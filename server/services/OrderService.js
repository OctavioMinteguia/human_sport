const orderRepo   = require('../repositories/OrderRepository');
const AppError    = require('../utils/AppError');
const cartPricing = require('./CartPricingService');

class OrderService {
  async createFromCart({ items, customer_name, customer_phone }) {
    if (!items || items.length === 0) throw new AppError('El carrito está vacío');

    // WhatsApp orders ask the shop to confirm availability, so stock is not enforced here.
    const { lines, total } = await cartPricing.priceItems(items, { checkStock: false });

    const orderId = await orderRepo.create({
      customer_name:  customer_name  || null,
      customer_phone: customer_phone || null,
      total,
      status: 'pending',
      whatsapp_sent: true,
      items: lines.map(l => cartPricing.toOrderItem(l))
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

  async deleteOrder(id) {
    await this.getOrder(id);
    return orderRepo.delete(id);
  }
}

module.exports = new OrderService();
