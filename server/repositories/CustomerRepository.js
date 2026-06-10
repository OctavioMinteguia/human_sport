const db = require('../config/database');

class CustomerRepository {
  findByEmail(email) {
    return db('customers').where({ email: email.toLowerCase().trim() }).first();
  }

  findById(id) {
    return db('customers').where({ id }).select('id', 'name', 'email', 'phone', 'created_at').first();
  }

  async create({ name, email, password_hash, phone }) {
    const [id] = await db('customers').insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash,
      phone: phone || null
    });
    return this.findById(id);
  }

  getOrders(customer_id) {
    return db('orders')
      .where({ customer_id })
      .orderBy('created_at', 'desc')
      .select('id', 'total', 'status', 'payment_status', 'created_at');
  }

  getOrderWithItems(order_id, customer_id) {
    return db('orders').where({ id: order_id, customer_id }).first();
  }
}

module.exports = new CustomerRepository();
