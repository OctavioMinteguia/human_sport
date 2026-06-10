const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const repo     = require('../repositories/CustomerRepository');
const db       = require('../config/database');

const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

function signToken(customer) {
  return jwt.sign({ id: customer.id, email: customer.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

class AuthController {

  async register(req, res, next) {
    try {
      const { name, email, password, phone } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: 'Nombre, email y contraseña son requeridos' });
      }
      if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      const existing = await repo.findByEmail(email);
      if (existing) {
        return res.status(409).json({ success: false, error: 'Ya existe una cuenta con ese email' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const customer = await repo.create({ name, email, password_hash, phone });
      const token = signToken(customer);

      res.status(201).json({ success: true, data: { token, customer } });
    } catch (err) { next(err); }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email y contraseña requeridos' });
      }

      const customer = await repo.findByEmail(email);
      if (!customer) {
        return res.status(401).json({ success: false, error: 'Email o contraseña incorrectos' });
      }

      const valid = await bcrypt.compare(password, customer.password_hash);
      if (!valid) {
        return res.status(401).json({ success: false, error: 'Email o contraseña incorrectos' });
      }

      const { password_hash, ...safe } = customer;
      const token = signToken(safe);

      res.json({ success: true, data: { token, customer: safe } });
    } catch (err) { next(err); }
  }

  async getProfile(req, res, next) {
    try {
      const customer = await repo.findById(req.customerId);
      if (!customer) return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
      res.json({ success: true, data: customer });
    } catch (err) { next(err); }
  }

  async updateProfile(req, res, next) {
    try {
      const { name, phone } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'El nombre es requerido' });
      }
      await db('customers').where({ id: req.customerId }).update({
        name: name.trim(),
        phone: phone || null,
        updated_at: db.fn.now()
      });
      const customer = await repo.findById(req.customerId);
      res.json({ success: true, data: customer });
    } catch (err) { next(err); }
  }

  async getMyOrders(req, res, next) {
    try {
      const orders = await repo.getOrders(req.customerId);

      const withItems = await Promise.all(orders.map(async (o) => {
        const items = await db('order_items').where({ order_id: o.id })
          .select('product_name', 'size', 'quantity', 'unit_price');
        return { ...o, items };
      }));

      res.json({ success: true, data: withItems });
    } catch (err) { next(err); }
  }
}

module.exports = new AuthController();
