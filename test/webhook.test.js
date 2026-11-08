// MercadoPago webhook: signature verification and paid-amount check.
// Runs against a throwaway SQLite file; MercadoPago is stubbed (no network).
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'humansport-webhook-'));
process.env.NODE_ENV = 'test';
process.env.TEST_DB_FILE = path.join(tmpDir, 'test.db');
process.env.JWT_SECRET = 'test-secret';
delete process.env.MP_WEBHOOK_SECRET;

const db = require('../server/config/database');
const mp = require('../server/config/mercadopago');
const app = require('../server/app');

const SECRET = 'webhook-secret';
const TOTAL = 30000;

let server;
let base;
let payments;      // payment id -> payment returned by the stubbed MP API
let fetchedIds;    // payment ids the webhook asked MP for

function sign(dataId, requestId, ts = String(Date.now()), secret = SECRET) {
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${ts};`;
  const hash = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return `ts=${ts},v1=${hash}`;
}

async function notify(paymentId, { signature, requestId = 'req-1', bodyId = paymentId } = {}) {
  const res = await fetch(`${base}/api/webhook/mercadopago?data.id=${paymentId}&type=payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': requestId,
      ...(signature ? { 'x-signature': signature } : {})
    },
    body: JSON.stringify({ type: 'payment', data: { id: String(bodyId) } })
  });
  return { status: res.status };
}

async function newOrder() {
  const [id] = await db('orders').insert({
    total: TOTAL, status: 'pending', payment_status: 'pending', whatsapp_sent: false
  });
  return id;
}

function approvedPayment(orderId, overrides = {}) {
  return {
    status: 'approved',
    external_reference: String(orderId),
    transaction_amount: TOTAL,
    currency_id: 'ARS',
    payer: {},
    ...overrides
  };
}

before(async () => {
  await db.migrate.latest();
  mp.payment.get = async ({ id }) => {
    fetchedIds.push(String(id));
    if (!payments[id]) throw new Error('payment not found');
    return payments[id];
  };
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(() => {
  payments = {};
  fetchedIds = [];
  process.env.MP_WEBHOOK_SECRET = SECRET;
});

after(async () => {
  delete process.env.MP_WEBHOOK_SECRET;
  server.close();
  await db.destroy();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── Signature ──

test('an unsigned notification is rejected and the order is not touched', async () => {
  const orderId = await newOrder();
  payments['111'] = approvedPayment(orderId);

  const res = await notify('111');

  assert.equal(res.status, 401);
  assert.deepEqual(fetchedIds, []);
  const order = await db('orders').where({ id: orderId }).first();
  assert.equal(order.status, 'pending');
  assert.equal(order.payment_status, 'pending');
});

test('a notification signed with the wrong secret is rejected', async () => {
  const orderId = await newOrder();
  payments['112'] = approvedPayment(orderId);

  const res = await notify('112', { signature: sign('112', 'req-1', String(Date.now()), 'other-secret') });

  assert.equal(res.status, 401);
  assert.deepEqual(fetchedIds, []);
  const order = await db('orders').where({ id: orderId }).first();
  assert.equal(order.payment_status, 'pending');
});

test('a signature for another payment id is rejected', async () => {
  const orderId = await newOrder();
  payments['113'] = approvedPayment(orderId);

  const res = await notify('113', { signature: sign('999', 'req-1') });

  assert.equal(res.status, 401);
  assert.deepEqual(fetchedIds, []);
});

test('a correctly signed approved payment confirms the order', async () => {
  const orderId = await newOrder();
  payments['114'] = approvedPayment(orderId);

  const res = await notify('114', { signature: sign('114', 'req-1') });

  assert.equal(res.status, 200);
  assert.deepEqual(fetchedIds, ['114']);
  const order = await db('orders').where({ id: orderId }).first();
  assert.equal(order.status, 'confirmed');
  assert.equal(order.payment_status, 'approved');
  assert.equal(order.payment_id, '114');
});

test('the payment fetched is the signed id, not the id in the body', async () => {
  const orderId = await newOrder();
  payments['115'] = approvedPayment(orderId);

  const res = await notify('115', { signature: sign('115', 'req-1'), bodyId: '999' });

  assert.equal(res.status, 200);
  assert.deepEqual(fetchedIds, ['115']);
});

// ── Paid amount ──

test('an approved payment for less than the order total does not confirm the order', async () => {
  const orderId = await newOrder();
  payments['121'] = approvedPayment(orderId, { transaction_amount: 1 });

  const res = await notify('121', { signature: sign('121', 'req-1') });

  assert.equal(res.status, 200);
  const order = await db('orders').where({ id: orderId }).first();
  assert.equal(order.status, 'pending');
  assert.equal(order.payment_status, 'amount_mismatch');
  assert.equal(order.payment_id, '121');
});

test('an approved payment in another currency does not confirm the order', async () => {
  const orderId = await newOrder();
  payments['122'] = approvedPayment(orderId, { currency_id: 'USD' });

  await notify('122', { signature: sign('122', 'req-1') });

  const order = await db('orders').where({ id: orderId }).first();
  assert.equal(order.status, 'pending');
  assert.equal(order.payment_status, 'amount_mismatch');
});

test('a rejected payment still cancels the order', async () => {
  const orderId = await newOrder();
  payments['123'] = approvedPayment(orderId, { status: 'rejected', transaction_amount: 1 });

  await notify('123', { signature: sign('123', 'req-1') });

  const order = await db('orders').where({ id: orderId }).first();
  assert.equal(order.status, 'cancelled');
  assert.equal(order.payment_status, 'rejected');
});

// ── Previous behaviour without a configured secret ──

test('without MP_WEBHOOK_SECRET an unsigned notification is still processed', async () => {
  delete process.env.MP_WEBHOOK_SECRET;
  const orderId = await newOrder();
  payments['131'] = approvedPayment(orderId);

  const res = await notify('131');

  assert.equal(res.status, 200);
  const order = await db('orders').where({ id: orderId }).first();
  assert.equal(order.status, 'confirmed');
  assert.equal(order.payment_status, 'approved');
});
