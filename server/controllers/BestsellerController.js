const path = require('path');
const fs   = require('fs');
const repo = require('../repositories/BestsellerRepository');

class BestsellerController {
  async list(req, res, next) {
    try {
      const items = await repo.getAll();
      res.json({ success: true, data: items });
    } catch (err) { next(err); }
  }

  async listAdmin(req, res, next) {
    try {
      const items = await repo.getAllAdmin();
      res.json({ success: true, data: items });
    } catch (err) { next(err); }
  }

  async create(req, res, next) {
    try {
      const { name, badge, price, sort_order } = req.body;
      const data = {
        name:       String(name || '').trim(),
        badge:      String(badge || '').trim() || null,
        price:      parseFloat(price),
        sort_order: parseInt(sort_order) || 0,
        is_active:  true
      };
      if (req.file) {
        data.image_filename = req.file.filename;
        data.image_url      = '/uploads/products/' + req.file.filename;
      }
      const item = await repo.create(data);
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, badge, price, sort_order, is_active } = req.body;
      const data = {};
      if (name      !== undefined) data.name       = String(name).trim();
      if (badge     !== undefined) data.badge      = String(badge).trim() || null;
      if (price     !== undefined) data.price      = parseFloat(price);
      if (sort_order !== undefined) data.sort_order = parseInt(sort_order) || 0;
      if (is_active !== undefined) data.is_active  = is_active === 'true' || is_active === true;
      if (req.file) {
        const existing = await repo.findById(id);
        if (existing?.image_filename) {
          const old = path.resolve(__dirname, '../../uploads/products', existing.image_filename);
          if (fs.existsSync(old)) fs.unlinkSync(old);
        }
        data.image_filename = req.file.filename;
        data.image_url      = '/uploads/products/' + req.file.filename;
      }
      const item = await repo.update(id, data);
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  }

  async remove(req, res, next) {
    try {
      const { id } = req.params;
      const item = await repo.findById(id);
      if (item?.image_filename) {
        const filePath = path.resolve(__dirname, '../../uploads/products', item.image_filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      await repo.delete(id);
      res.json({ success: true, data: { deleted: true } });
    } catch (err) { next(err); }
  }
}

module.exports = new BestsellerController();
