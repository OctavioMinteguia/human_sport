const db  = require('../config/database');
const mp  = require('../config/mercadopago');
const logger = require('../utils/logger');
const { readBearerToken, verifyToken } = require('../utils/token');
const cartPricing = require('../services/CartPricingService');

class CheckoutController {

  async createPreference(req, res, next) {
    try {
      // Prices, names and stock come from the database; the cart only picks products.
      const { lines, total } = await cartPricing.priceItems(req.body.items);
      const baseUrl = (process.env.BASE_URL || 'http://localhost:3001').replace(/\/+$/, '');

      // Leer customer del JWT si está logueado
      let customerId = null;
      let customerEmail = null;
      let customerName = null;
      const token = readBearerToken(req);
      if (token) {
        try {
          const payload = verifyToken(token);
          if (payload.role === 'customer') {
            customerId = payload.id;
            customerEmail = payload.email;
            const c = await db('customers').where({ id: customerId }).select('name', 'email', 'phone').first();
            if (c) { customerName = c.name; customerEmail = c.email; }
          }
        } catch (tokenErr) {
          // Login is optional at checkout: a bad or expired token is treated as a guest.
          logger.info('[Checkout] token ignored, continuing as guest:', tokenErr.message);
        }
      }

      // Crear orden en DB antes de ir a MP
      const [orderId] = await db('orders').insert({
        total,
        status:         'pending',
        payment_status: 'pending',
        whatsapp_sent:  false,
        customer_id:    customerId,
        customer_name:  customerName,
        customer_email: customerEmail
      });

      await db('order_items').insert(
        lines.map(l => ({ order_id: orderId, ...cartPricing.toOrderItem(l) }))
      );

      // Crear preferencia en MercadoPago
      const mpItems = lines.map(l => ({
        title:      `${l.product_name}${l.size ? ` - Talle ${l.size}` : ''}`,
        quantity:   l.quantity,
        unit_price: l.unit_price,
        currency_id: 'ARS'
      }));

      const pref = await mp.preference.create({
        body: {
          items: mpItems,
          external_reference: String(orderId),
          back_urls: {
            success: `${baseUrl}/pago/exito`,
            failure: `${baseUrl}/pago/error`,
            pending: `${baseUrl}/pago/pendiente`
          },
          // auto_return solo funciona con URLs públicas (no localhost)
          ...(baseUrl.startsWith('http://localhost') ? {} : { auto_return: 'approved' }),
          notification_url: `${baseUrl}/api/webhook/mercadopago`,
          statement_descriptor: 'Human Sport'
        }
      });

      await db('orders').where({ id: orderId }).update({ preference_id: pref.id });

      const checkoutUrl = mp.isSandbox() ? pref.sandbox_init_point : pref.init_point;

      res.json({ success: true, data: { order_id: orderId, checkout_url: checkoutUrl } });
    } catch (err) { next(err); }
  }

  async webhook(req, res) {
    // Siempre responder 200 a MP, aunque algo falle
    try {
      const { type, data } = req.body;

      if (type === 'payment' && data?.id) {
        const paymentData = await mp.payment.get({ id: data.id });
        const orderId     = paymentData.external_reference;
        const mpStatus    = paymentData.status;

        const map = {
          approved:   { status: 'confirmed', payment_status: 'approved' },
          rejected:   { status: 'cancelled', payment_status: 'rejected' },
          pending:    { status: 'pending',   payment_status: 'pending'  },
          in_process: { status: 'pending',   payment_status: 'in_process' },
          cancelled:  { status: 'cancelled', payment_status: 'cancelled' }
        };

        const update = map[mpStatus] || { payment_status: mpStatus };

        // Capturar datos del pagador si la orden no los tiene
        const payer = paymentData.payer || {};
        const payerName = [payer.first_name, payer.last_name].filter(Boolean).join(' ').trim() || null;
        const payerEmail = payer.email || null;

        if (orderId) {
          const order = await db('orders').where({ id: orderId }).first();
          await db('orders').where({ id: orderId }).update({
            payment_id:     String(data.id),
            ...update,
            ...(payerName  && !order?.customer_name  ? { customer_name:  payerName  } : {}),
            ...(payerEmail && !order?.customer_email ? { customer_email: payerEmail } : {})
          });
        }
      }
    } catch (err) {
      logger.error('[Webhook MP]', err.message);
    }

    res.status(200).json({ received: true });
  }
}

module.exports = new CheckoutController();
