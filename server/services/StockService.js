const productRepo = require('../repositories/ProductRepository');
const adminRepo   = require('../repositories/AdminRepository');
const AppError    = require('../utils/AppError');

class StockService {
  async getStock(productId) {
    const product = await productRepo.findById(productId);
    if (!product) throw new AppError('Producto no encontrado', 404);
    const variants = await productRepo.findVariants(productId);
    return { product_id: productId, product_name: product.name, variants };
  }

  async setStock(productId, size, quantity) {
    if (quantity < 0) throw new AppError('El stock no puede ser negativo');
    const product = await productRepo.findById(productId);
    if (!product) throw new AppError('Producto no encontrado', 404);
    await productRepo.upsertVariant(productId, size, quantity);
    return this.getStock(productId);
  }

  async adjustStock(productId, size, delta) {
    const product = await productRepo.findById(productId);
    if (!product) throw new AppError('Producto no encontrado', 404);
    await productRepo.adjustStock(productId, size, delta);
    return this.getStock(productId);
  }

  async getLowStockAlerts() {
    const threshold = parseInt(await adminRepo.getSetting('low_stock_threshold') || '3');
    return productRepo.getLowStock(threshold);
  }

  async decrementForOrder(items) {
    for (const item of items) {
      if (item.product_id) {
        await productRepo.adjustStock(item.product_id, item.size, -item.quantity);
      }
    }
  }
}

module.exports = new StockService();
