const db  = require('../config/database');
const mp  = require('../config/mercadopago');
const jwt = require('jsonwebtoken');

class CheckoutController {

  async createPreference(req, res, next) {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || !items.length) {
        return res.status(400).json({ success: false, error: 'Carrito vacío' });
      }

      const total = items.reduce((s, i) => s + parseFloat(i.price) * parseInt(i.qty), 0);
      const baseUrl = process.env.BASE_URL || 'http://localhost:3001';

      // Leer customer del JWT si está logueado
      let customerId = null;
      let customerEmail = null;
      let customerName = null;
      const header = req.headers['authorization'] || '';
      const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (token) {
        try {
          const payload = jwt.verify(token, process.env.JWT_SECRET);
          customerId = payload.id;
          customerEmail = payload.email;
          const c = await db('customers').where({ id: customerId }).select('name', 'email', 'phone').first();
          if (c) { customerName = c.name; customerEmail = c.email; }
        } catch {}
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
        items.map(i => ({
          order_id:     orderId,
          product_id:   i.id   || null,
          product_name: i.name,
          brand:        i.brand || null,
          size:         i.size  || '',
          quantity:     parseInt(i.qty),
          unit_price:   parseFloat(i.price)
        }))
      );

      // Crear preferencia en MercadoPago
      const mpItems = items.map(i => ({
        title:      `${i.name}${i.size ? ` - Talle ${i.size}` : ''}`,
        quantity:   parseInt(i.qty),
        unit_price: parseFloat(i.price),
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

        if (orderId) {
          await db('orders').where({ id: orderId }).update({
            payment_id: String(data.id),
            ...update
          });
        }
      }
    } catch (err) {
      console.error('[Webhook MP]', err.message);
    }

    res.status(200).json({ received: true });
  }
}

module.exports = new CheckoutController();
