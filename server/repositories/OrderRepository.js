const db = require('../config/database');

class OrderRepository {
  async findAll({ status, limit = 50, offset = 0 } = {}) {
    let query = db('orders').orderBy('created_at', 'desc').limit(limit).offset(offset);
    if (status) query = query.where({ status });
    return query;
  }

  async findById(id) {
    const order = await db('orders').where({ id }).first();
    if (!order) return null;
    const items = await db('order_items').where('order_id', id);
    return { ...order, items };
  }

  async create({ items = [], ...orderData }) {
    return db.transaction(async (trx) => {
      const [orderId] = await trx('orders').insert(orderData);

      if (items.length) {
        await trx('order_items').insert(
          items.map(item => ({ ...item, order_id: orderId }))
        );
      }

      return orderId;
    });
  }

  async updateStatus(id, status, notes = null) {
    const data = { status, updated_at: db.fn.now() };
    if (notes !== null) data.notes = notes;
    return db('orders').where({ id }).update(data);
  }

  async getStats() {
    const [total, pending, today] = await Promise.all([
      db('orders').count('id as c').first(),
      db('orders').where('status', 'pending').count('id as c').first(),
      db('orders')
        .whereRaw("date(created_at) = date('now')")
        .count('id as c').first()
    ]);
    const revenue = await db('orders')
      .whereIn('status', ['confirmed', 'delivered'])
      .sum('total as s').first();

    return {
      total:   total?.c   || 0,
      pending: pending?.c || 0,
      today:   today?.c   || 0,
      revenue: revenue?.s || 0
    };
  }
}

module.exports = new OrderRepository();
