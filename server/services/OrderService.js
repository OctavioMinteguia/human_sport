const orderRepo   = require('../repositories/OrderRepository');
const AppError    = require('../utils/AppError');

class OrderService {
  async createFromCart({ items, customer_name, customer_phone }) {
    if (!items || items.length === 0) throw new AppError('El carrito está vacío');

    const total = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

    const orderId = await orderRepo.create({
      customer_name:  customer_name  || null,
      customer_phone: customer_phone || null,
      total,
      status: 'pending',
      whatsapp_sent: true,
      items: items.map(i => ({
        product_id:   i.product_id   || null,
        product_name: i.product_name,
        brand:        i.brand        || null,
        size:         i.size,
        quantity:     i.quantity,
        unit_price:   i.unit_price
      }))
    });

    return orderRepo.findById(orderId);
  }

  async listOrders(filters) {
    return orderRepo.findAll(filters);
  }

  async getOrder(id) {
    const order = await orderRepo.findById(id);
    if (!order) throw new AppError('Pedido no encontrado', 404);
    return order;
  }

  async updateStatus(id, status, notes) {
    const valid = ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'];
    if (!valid.includes(status)) throw new AppError(`Estado inválido. Válidos: ${valid.join(', ')}`);
    await this.getOrder(id);
    await orderRepo.updateStatus(id, status, notes);
    return orderRepo.findById(id);
  }

  async getStats() {
    return orderRepo.getStats();
  }
}

module.exports = new OrderService();
