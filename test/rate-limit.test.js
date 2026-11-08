// Login brute-force protection: failed attempts are limited per client IP.
// Runs against a throwaway SQLite file.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'humansport-ratelimit-'));
process.env.NODE_ENV = 'test';
process.env.TEST_DB_FILE = path.join(tmpDir, 'test.db');
process.env.JWT_SECRET = 'test-secret';

const bcrypt = require('bcryptjs');
const db = require('../server/config/database');
const app = require('../server/app');
const { rateLimitFailures } = require('../server/middleware/rateLimit');

let server;
let base;

async function post(url, body) {
  const res = await fetch(base + url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: res.status, headers: res.headers, body: await res.json().catch(() => null) };
}

const adminLogin = (password) => post('/admin/auth/login', { email: 'admin@test.com', password });
const customerLogin = (password) => post('/auth/login', { email: 'cliente@test.com', password });

before(async () => {
  await db.migrate.latest();
  await db('admin_users').insert({
    email: 'admin@test.com',
    password_hash: bcrypt.hashSync('admin-pass', 4),
    name: 'Admin'
  });
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
  const reg = await post('/auth/register', { name: 'Cliente', email: 'cliente@test.com', password: 'cliente-pass' });
  assert.equal(reg.status, 201);
});

after(async () => {
  server.close();
  await db.destroy();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// Order matters: all requests come from the same IP and share the limiter state.

test('successful admin logins do not count against the limit', async () => {
  for (let i = 0; i < 8; i++) {
    const res = await adminLogin('admin-pass');
    assert.equal(res.status, 200, `login ${i + 1} should succeed`);
  }
});

test('admin login is blocked after 5 failed attempts, even with the right password', async () => {
  for (let i = 0; i < 5; i++) {
    const res = await adminLogin('wrong');
    assert.equal(res.status, 401, `attempt ${i + 1} should be a normal failure`);
  }
  const blocked = await adminLogin('admin-pass');
  assert.equal(blocked.status, 429);
  assert.equal(blocked.body.success, false);
  assert.match(blocked.body.error, /Demasiados intentos/);
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
});

test('customer login has its own limit and is blocked after 10 failed attempts', async () => {
  const ok = await customerLogin('cliente-pass');
  assert.equal(ok.status, 200, 'admin lockout must not block customers');

  for (let i = 0; i < 10; i++) {
    const res = await customerLogin('wrong');
    assert.equal(res.status, 401, `attempt ${i + 1} should be a normal failure`);
  }
  const blocked = await customerLogin('cliente-pass');
  assert.equal(blocked.status, 429);
  assert.match(blocked.body.error, /Demasiados intentos/);
});

// ── Limiter window (unit) ──

function fakeRes(statusCode) {
  const listeners = {};
  return {
    statusCode,
    headers: {},
    set(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; listeners.finish?.(); return this; },
    on(event, fn) { listeners[event] = fn; },
    finish() { listeners.finish?.(); }
  };
}

function attempt(limiter, statusCode) {
  const res = fakeRes(statusCode);
  let passed = false;
  limiter({ ip: '10.0.0.1' }, res, () => { passed = true; });
  if (passed) res.finish();
  return { passed, res };
}

test('the limit resets once the window has passed', () => {
  let now = 0;
  const limiter = rateLimitFailures({ windowMs: 1000, max: 2, message: 'Demasiados intentos', now: () => now });

  assert.equal(attempt(limiter, 401).passed, true);
  assert.equal(attempt(limiter, 401).passed, true);
  const blocked = attempt(limiter, 200);
  assert.equal(blocked.passed, false);
  assert.equal(blocked.res.statusCode, 429);
  assert.equal(blocked.res.headers['Retry-After'], '1');

  now = 1000;
  assert.equal(attempt(limiter, 200).passed, true);
});
