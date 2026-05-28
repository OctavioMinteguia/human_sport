const productService = require('../services/ProductService');

class ProductController {
  async list(req, res, next) {
    try {
      const products = await productService.listProducts({
        category: req.query.category,
        brand:    req.query.brand,
        badge:    req.query.badge,
        active:   true
      });
      res.json({ success: true, data: products });
    } catch (err) { next(err); }
  }

  async getOne(req, res, next) {
    try {
      const product = await productService.getProduct(req.params.id);
      res.json({ success: true, data: product });
    } catch (err) { next(err); }
  }

  async create(req, res, next) {
    try {
      const product = await productService.createProduct(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      res.json({ success: true, data: product });
    } catch (err) { next(err); }
  }

  async remove(req, res, next) {
    try {
      await productService.deleteProduct(req.params.id);
      res.json({ success: true, message: 'Producto eliminado' });
    } catch (err) { next(err); }
  }

  async uploadImage(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ success: false, error: 'No se recibió imagen' });
      const result = await productService.addImage(req.params.id, req.file);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async deleteImage(req, res, next) {
    try {
      await productService.removeImage(req.params.id, req.params.imageId);
      res.json({ success: true, message: 'Imagen eliminada' });
    } catch (err) { next(err); }
  }

  async setPrimaryImage(req, res, next) {
    try {
      await productService.setPrimaryImage(req.params.id, req.params.imageId);
      res.json({ success: true, message: 'Imagen principal actualizada' });
    } catch (err) { next(err); }
  }
}

module.exports = new ProductController();
