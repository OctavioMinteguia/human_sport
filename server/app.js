require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');

const productRoutes     = require('./routes/products');
const orderRoutes       = require('./routes/orders');
const adminRoutes       = require('./routes/admin');
const bestsellerRoutes  = require('./routes/bestsellers');
const checkoutRoutes    = require('./routes/checkout');
const AppError          = require('./utils/AppError');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));
app.use('/uploads', express.static(path.join(__dirname, '../data/uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/products',     productRoutes);
app.use('/api/orders',      orderRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/bestsellers', bestsellerRoutes);
app.use('/api/checkout',    checkoutRoutes);
app.use('/api/webhook',     checkoutRoutes);

// ── Páginas de pago (antes del catch-all) ────────────────────────────────────
app.get('/pago/exito',     (req, res) => res.sendFile(path.join(__dirname, '../public/pago/exito.html')));
app.get('/pago/pendiente', (req, res) => res.sendFile(path.join(__dirname, '../public/pago/pendiente.html')));
app.get('/pago/error',     (req, res) => res.sendFile(path.join(__dirname, '../public/pago/error.html')));

// ── SPA fallbacks ─────────────────────────────────────────────────────────────
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/index.html'));
});
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  const status  = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  if (status === 500) console.error('[ERROR]', err);
  res.status(status).json({ success: false, error: message });
});

module.exports = app;
