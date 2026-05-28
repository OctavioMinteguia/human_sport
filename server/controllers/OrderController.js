const orderService = require('../services/OrderService');
const stockService = require('../services/StockService');

class OrderController {
  async create(req, res, next) {
    try {
      const order = await orderService.createFromCart(req.body);
      res.status(201).json({ success: true, data: order });
    } catch (err) { next(err); }
  }

  async list(req, res, next) {
    try {
      const orders = await orderService.listOrders({
        status: req.query.status,
        limit:  parseInt(req.query.limit)  || 50,
        offset: parseInt(req.query.offset) || 0
      });
      res.json({ success: true, data: orders });
    } catch (err) { next(err); }
  }

  async getOne(req, res, next) {
    try {
      const order = await orderService.getOrder(req.params.id);
      res.json({ success: true, data: order });
    } catch (err) { next(err); }
  }

  async updateStatus(req, res, next) {
    try {
      const { status, notes } = req.body;
      const order = await orderService.updateStatus(req.params.id, status, notes);

      // Si se confirma, descontar stock
      if (status === 'confirmed' && order.items?.length) {
        await stockService.decrementForOrder(order.items);
      }

      res.json({ success: true, data: order });
    } catch (err) { next(err); }
  }

  async getStats(req, res, next) {
    try {
      const stats = await orderService.getStats();
      res.json({ success: true, data: stats });
    } catch (err) { next(err); }
  }
}

module.exports = new OrderController();
