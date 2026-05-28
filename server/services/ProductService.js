const productRepo = require('../repositories/ProductRepository');
const AppError = require('../utils/AppError');

class ProductService {
  async listProducts(filters) {
    return productRepo.findAllWithDetails(filters);
  }

  async getProduct(id) {
    const product = await productRepo.findWithDetails(id);
    if (!product) throw new AppError('Producto no encontrado', 404);
    return product;
  }

  async createProduct(data) {
    if (!data.name || !data.category || !data.price) {
      throw new AppError('Nombre, categoría y precio son requeridos');
    }
    data.price         = parseFloat(data.price);
    data.original_price = data.original_price ? parseFloat(data.original_price) : null;

    const id = await productRepo.create(data);
    return productRepo.findWithDetails(id);
  }

  async updateProduct(id, data) {
    await this.getProduct(id);
    if (data.price)          data.price          = parseFloat(data.price);
    if (data.original_price) data.original_price = parseFloat(data.original_price);
    await productRepo.update(id, data);
    return productRepo.findWithDetails(id);
  }

  async deleteProduct(id) {
    await this.getProduct(id);
    return productRepo.softDelete(id);
  }

  async addImage(productId, file) {
    await this.getProduct(productId);
    const url       = `/uploads/products/${file.filename}`;
    const imageId   = await productRepo.addImage(productId, { filename: file.filename, url });
    return { id: imageId, url };
  }

  async removeImage(productId, imageId) {
    await this.getProduct(productId);
    return productRepo.deleteImage(imageId);
  }

  async setPrimaryImage(productId, imageId) {
    await this.getProduct(productId);
    return productRepo.setPrimaryImage(productId, imageId);
  }
}

module.exports = new ProductService();
