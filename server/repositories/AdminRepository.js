const db = require('../config/database');

class AdminRepository {
  async findByEmail(email) {
    return db('admin_users').where({ email }).first();
  }

  async findById(id) {
    return db('admin_users').where({ id }).first();
  }

  async getSetting(key) {
    const row = await db('settings').where({ key }).first();
    return row?.value ?? null;
  }

  async setSetting(key, value) {
    const existing = await db('settings').where({ key }).first();
    if (existing) {
      return db('settings').where({ key }).update({ value, updated_at: db.fn.now() });
    }
    return db('settings').insert({ key, value });
  }

  async getAllSettings() {
    const rows = await db('settings');
    return rows.reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {});
  }
}

module.exports = new AdminRepository();
