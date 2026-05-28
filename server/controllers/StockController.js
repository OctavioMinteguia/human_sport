const stockService = require('../services/StockService');

class StockController {
  async getStock(req, res, next) {
    try {
      const data = await stockService.getStock(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async setStock(req, res, next) {
    try {
      const { size, quantity } = req.body;
      const data = await stockService.setStock(req.params.id, size, parseInt(quantity));
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getLowStock(req, res, next) {
    try {
      const data = await stockService.getLowStockAlerts();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
}

module.exports = new StockController();
