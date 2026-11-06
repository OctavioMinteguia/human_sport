// Security regression tests: admin/customer role separation and server-side pricing.
// Runs against a throwaway SQLite file; MercadoPago is stubbed (no network).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'humansport-test-'));
process.env.NODE_ENV = 'test';
process.env.TEST_DB_FILE = path.join(tmpDir, 'test.db');
process.env.JWT_SECRET = 'test-secret';
process.env.BASE_URL = 'http://localhost:3001';

const bcrypt = require('bcryptjs');
const db = require('../server/config/database');
const mp = require('../server/config/mercadopago');
const app = require('../server/app');

let server;
let base;
let adminToken;
let customerToken;
let lastPreference = null;

const PRICE = 15000;

async function call(method, url, { token, body } = {}) {
  const res = await fetch(base + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

before(async () => {
  await db.migrate.latest();
  await db('products').insert([
    { id: 1, name: 'Remera Dry Fit', brand: 'Lady Fit', category: 'remeras', price: PRICE, is_active: true },
    { id: 2, name: 'Calza Vieja', brand: 'Lady Fit', category: 'calzas', price: 9000, is_active: false }
  ]);
  await db('product_variants').insert([
    { product_id: 1, size: 'M', stock: 2 },
    { product_id: 2, size: 'M', stock: 5 }
  ]);
  await db('admin_users').insert({
    email: 'admin@test.com',
    password_hash: bcrypt.hashSync('admin-pass', 4),
    name: 'Admin'
  });

  mp.preference.create = async ({ body }) => {
    lastPreference = body;
    return { id: 'pref-test', init_point: 'https://mp.test/pay', sandbox_init_point: 'https://mp.test/sandbox' };
  };

  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;

  const adminLogin = await call('POST', '/admin/auth/login', { body: { email: 'admin@test.com', password: 'admin-pass' } });
  adminToken = adminLogin.body.data.token;

  const reg = await call('POST', '/auth/register', {
    body: { name: 'Cliente', email: 'cliente@test.com', password: 'cliente-pass' }
  });
  customerToken = reg.body.data.token;
});

after(async () => {
  server.close();
  await db.destroy();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── Roles ──

test('a customer token is rejected on admin routes', async () => {
  const res = await call('GET', '/admin/orders', { token: customerToken });
  assert.equal(res.status, 403);
  assert.equal(res.body.success, false);
});

test('a customer token cannot change prices', async () => {
  const res = await call('PUT', '/admin/products/1', { token: customerToken, body: { price: 1 } });
  assert.equal(res.status, 403);
  const product = await db('products').where({ id: 1 }).first();
  assert.equal(product.price, PRICE);
});

test('an admin token still works on admin routes', async () => {
  const res = await call('GET', '/admin/orders', { token: adminToken });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
});

test('an admin token is rejected on customer routes', async () => {
  const res = await call('GET', '/auth/my-orders', { token: adminToken });
  assert.equal(res.status, 403);
});

test('a customer token still works on customer routes', async () => {
  const res = await call('GET', '/auth/me', { token: customerToken });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.email, 'cliente@test.com');
});

test('a token without a role (issued before this change) is rejected', async () => {
  const jwt = require('jsonwebtoken');
  const legacy = jwt.sign({ id: 1, email: 'admin@test.com' }, process.env.JWT_SECRET);
  const res = await call('GET', '/admin/orders', { token: legacy });
  assert.equal(res.status, 403);
});

// ── Server-side pricing (MercadoPago checkout) ──

test('checkout charges the database price, not the price sent by the browser', async () => {
  lastPreference = null;
  const res = await call('POST', '/checkout', {
    token: customerToken,
    body: { items: [{ id: 1, name: 'Hack', size: 'M', qty: 2, price: 1 }] }
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);

  assert.equal(lastPreference.items.length, 1);
  assert.equal(lastPreference.items[0].unit_price, PRICE);
  assert.equal(lastPreference.items[0].quantity, 2);
  assert.match(lastPreference.items[0].title, /^Remera Dry Fit/);

  const order = await db('orders').where({ id: res.body.data.order_id }).first();
  assert.equal(order.total, PRICE * 2);
  const items = await db('order_items').where({ order_id: order.id });
  assert.equal(items[0].unit_price, PRICE);
  assert.equal(items[0].product_name, 'Remera Dry Fit');
});

test('checkout rejects a quantity above the available stock', async () => {
  const before = await db('orders').count({ n: '*' }).first();
  const res = await call('POST', '/checkout', {
    token: customerToken,
    body: { items: [{ id: 1, size: 'M', qty: 3, price: PRICE }] }
  });
  assert.equal(res.status, 409);
  assert.equal(res.body.success, false);
  const afterCount = await db('orders').count({ n: '*' }).first();
  assert.equal(afterCount.n, before.n);
});

test('checkout counts the same product and size across cart lines against stock', async () => {
  const res = await call('POST', '/checkout', {
    token: customerToken,
    body: { items: [
      { id: 1, size: 'M', color: 'Negro', qty: 2 },
      { id: 1, size: 'M', color: 'Blanco', qty: 1 }
    ] }
  });
  assert.equal(res.status, 409);
});

test('checkout rejects unknown products, inactive products, unknown sizes and bad quantities', async () => {
  const cases = [
    [{ id: 999, size: 'M', qty: 1 }],
    [{ id: 2, size: 'M', qty: 1 }],
    [{ id: 1, size: 'XXL', qty: 1 }],
    [{ id: 1, size: 'M', qty: 0 }],
    [{ id: 1, size: 'M', qty: -1 }],
    [{ id: 1, size: 'M', qty: 1.5 }],
    [null],
    ['1']
  ];
  for (const items of cases) {
    const res = await call('POST', '/checkout', { token: customerToken, body: { items } });
    assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(items)}`);
    assert.equal(res.body.success, false);
  }
});

test('checkout still rejects an empty cart', async () => {
  const res = await call('POST', '/checkout', { token: customerToken, body: { items: [] } });
  assert.equal(res.status, 400);
});

// ── Server-side pricing (WhatsApp order log) ──

test('WhatsApp order stores database prices, not the prices sent by the browser', async () => {
  const res = await call('POST', '/orders', {
    body: { items: [{ product_id: 1, product_name: 'Hack', size: 'M', quantity: 1, unit_price: 1 }] }
  });
  assert.equal(res.status, 201);
  const order = await db('orders').where({ id: res.body.data.id }).first();
  assert.equal(order.total, PRICE);
  const items = await db('order_items').where({ order_id: order.id });
  assert.equal(items[0].unit_price, PRICE);
  assert.equal(items[0].product_name, 'Remera Dry Fit');
});
