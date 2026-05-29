const db = require('../config/database');

class ProductRepository {
  async findAll({ category, brand, badge, active = true } = {}) {
    let query = db('products').where('is_active', active);
    if (category) query = query.where('category', category);
    if (brand)    query = query.where('brand', brand);
    if (badge)    query = query.where('badge', badge);
    return query.orderBy('sort_order', 'asc').orderBy('id', 'asc');
  }

  async findById(id) {
    return db('products').where({ id }).first();
  }

  async findWithDetails(id) {
    const product = await db('products').where({ id }).first();
    if (!product) return null;

    const [variants, images, colors] = await Promise.all([
      db('product_variants').where('product_id', id).orderBy('size'),
      db('product_images').where('product_id', id).orderBy('sort_order'),
      db('product_colors').where('product_id', id)
    ]);

    return { ...product, variants, images, colors };
  }

  async findAllWithDetails(filters = {}) {
    const products = await this.findAll(filters);
    return Promise.all(products.map(p => this.findWithDetails(p.id)));
  }

  async create({ colors = [], variants = [], sizes = [], image, ...data }) {
    return db.transaction(async (trx) => {
      const [id] = await trx('products').insert(data);

      const variantRows = variants.length
        ? variants.map(v => ({ product_id: id, size: v.size, stock: v.stock || 0 }))
        : sizes.map(s => ({ product_id: id, size: s, stock: 0 }));

      if (variantRows.length) {
        await trx('product_variants').insert(variantRows);
      }

      if (colors.length) {
        await trx('product_colors').insert(
          colors.map(c => ({ product_id: id, hex: c.hex, name: c.name }))
        );
      }

      return id;
    });
  }

  async update(id, { colors, variants, ...data }) {
    data.updated_at = db.fn.now();
    return db.transaction(async (trx) => {
      await trx('products').where({ id }).update(data);

      if (colors !== undefined) {
        await trx('product_colors').where('product_id', id).del();
        if (colors.length) {
          await trx('product_colors').insert(
            colors.map(c => ({ product_id: id, hex: c.hex, name: c.name || '' }))
          );
        }
      }

      if (variants !== undefined) {
        for (const v of variants) {
          const existing = await trx('product_variants').where({ product_id: id, size: v.size }).first();
          if (existing) {
            await trx('product_variants').where({ product_id: id, size: v.size }).update({ stock: v.stock || 0 });
          } else {
            await trx('product_variants').insert({ product_id: id, size: v.size, stock: v.stock || 0 });
          }
        }
      }
    });
  }

  async softDelete(id) {
    return db('products').where({ id }).update({ is_active: false, updated_at: db.fn.now() });
  }

  // ── Variantes / Stock ──────────────────────────────────────────────────────

  async findVariants(productId) {
    return db('product_variants').where('product_id', productId).orderBy('size');
  }

  async upsertVariant(productId, size, stock) {
    const existing = await db('product_variants').where({ product_id: productId, size }).first();
    if (existing) {
      return db('product_variants').where({ product_id: productId, size }).update({ stock });
    }
    return db('product_variants').insert({ product_id: productId, size, stock });
  }

  async adjustStock(productId, size, delta) {
    return db('product_variants')
      .where({ product_id: productId, size })
      .update({ stock: db.raw('MAX(0, stock + ?)', [delta]) });
  }

  async getLowStock(threshold = 3) {
    return db('product_variants as pv')
      .join('products as p', 'p.id', 'pv.product_id')
      .where('p.is_active', true)
      .where('pv.stock', '<=', threshold)
      .select('p.id as product_id', 'p.name', 'p.brand', 'p.category', 'pv.size', 'pv.stock')
      .orderBy('pv.stock', 'asc');
  }

  // ── Imágenes ───────────────────────────────────────────────────────────────

  async addImage(productId, { filename, url, is_primary = false }) {
    if (is_primary) {
      await db('product_images').where('product_id', productId).update({ is_primary: false });
    }
    const count = await db('product_images').where('product_id', productId).count('id as c').first();
    const sort_order = (count?.c || 0);
    const [id] = await db('product_images').insert({ product_id: productId, filename, url, is_primary, sort_order });
    return id;
  }

  async deleteImage(imageId) {
    return db('product_images').where({ id: imageId }).del();
  }

  async setPrimaryImage(productId, imageId) {
    await db('product_images').where('product_id', productId).update({ is_primary: false });
    return db('product_images').where({ id: imageId, product_id: productId }).update({ is_primary: true });
  }
}

module.exports = new ProductRepository();
