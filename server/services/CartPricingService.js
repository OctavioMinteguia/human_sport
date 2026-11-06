const db       = require('../config/database');
const AppError = require('../utils/AppError');

const MAX_QTY_PER_LINE = 99;

/**
 * Builds order lines from a cart using only what the shopper is allowed to choose
 * (product, size, color, quantity). Name, brand and price always come from the
 * database, so a tampered cart cannot change what gets charged or recorded.
 *
 * Accepts both cart shapes used by the frontend:
 *   checkout:  { id, size, color, qty }
 *   WhatsApp:  { product_id, size, quantity }
 */
class CartPricingService {
  async priceItems(rawItems, { checkStock = true } = {}) {
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      throw new AppError('Carrito vacío');
    }

    const requested = rawItems.map((raw) => {
      if (raw === null || typeof raw !== 'object') {
        throw new AppError('Producto inválido en el carrito');
      }
      const productId = Number(raw.id ?? raw.product_id);
      const quantity  = Number(raw.qty ?? raw.quantity);
      if (!Number.isInteger(productId) || productId <= 0) {
        throw new AppError('Producto inválido en el carrito');
      }
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY_PER_LINE) {
        throw new AppError('Cantidad inválida en el carrito');
      }
      return {
        productId,
        quantity,
        size:  raw.size  == null ? '' : String(raw.size),
        color: raw.color == null ? '' : String(raw.color)
      };
    });

    const ids      = [...new Set(requested.map(r => r.productId))];
    const products = await db('products').whereIn('id', ids).andWhere('is_active', true);
    const variants = await db('product_variants').whereIn('product_id', ids);
    const productById = new Map(products.map(p => [p.id, p]));

    // The same product and size can appear on several lines (e.g. different colors).
    const qtyByVariant = new Map();
    for (const r of requested) {
      const key = `${r.productId}|${r.size}`;
      qtyByVariant.set(key, (qtyByVariant.get(key) || 0) + r.quantity);
    }

    const lines = requested.map((r) => {
      const product = productById.get(r.productId);
      if (!product) {
        throw new AppError('Uno de los productos ya no está disponible');
      }
      const productVariants = variants.filter(v => v.product_id === r.productId);
      if (productVariants.length) {
        const variant = productVariants.find(v => v.size === r.size);
        if (!variant) {
          throw new AppError(`El talle ${r.size || '(sin talle)'} no existe para ${product.name}`);
        }
        if (checkStock && qtyByVariant.get(`${r.productId}|${r.size}`) > variant.stock) {
          throw new AppError(`No hay stock suficiente de ${product.name} talle ${r.size}`, 409);
        }
      }
      return {
        product_id:   product.id,
        product_name: product.name,
        brand:        product.brand || null,
        size:         r.size,
        color:        r.color,
        quantity:     r.quantity,
        unit_price:   product.price
      };
    });

    const total = lines.reduce((sum, l) => sum + l.unit_price * l.quantity, 0);
    return { lines, total };
  }

  // Shape of an order_items row (without order_id) for a priced line.
  toOrderItem(line) {
    return {
      product_id:   line.product_id,
      product_name: line.product_name,
      brand:        line.brand,
      size:         line.size,
      quantity:     line.quantity,
      unit_price:   line.unit_price
    };
  }
}

module.exports = new CartPricingService();
