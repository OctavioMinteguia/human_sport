const db = require('../config/database');

class BestsellerRepository {
  getAll() {
    return db('bestsellers')
      .where({ is_active: true })
      .orderBy('sort_order', 'asc')
      .orderBy('id', 'asc');
  }

  getAllAdmin() {
    return db('bestsellers')
      .orderBy('sort_order', 'asc')
      .orderBy('id', 'asc');
  }

  findById(id) {
    return db('bestsellers').where({ id }).first();
  }

  async create(data) {
    const [id] = await db('bestsellers').insert(data);
    return this.findById(id);
  }

  async update(id, data) {
    await db('bestsellers').where({ id }).update(data);
    return this.findById(id);
  }

  delete(id) {
    return db('bestsellers').where({ id }).del();
  }
}

module.exports = new BestsellerRepository();
