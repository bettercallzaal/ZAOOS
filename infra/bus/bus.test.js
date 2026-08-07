/**
 * zao-bus tests - the tasern wire contract, enforced.
 * Run: node --test infra/bus/
 */
'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// hermetic env BEFORE requiring the bus
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'zao-bus-'));
process.env.BUS_DATA_DIR = TMP;
process.env.BUS_ADMIN_TOKEN = 'admin-token-test';
process.env.BUS_GUEST_TOKEN = 'guest-token-test';
process.env.BUS_GUEST_AGENT = 'zoe';
process.env.BUS_GUEST_TOKEN_JIM = 'jim-token-test';

const { createBus, resolveAuth, sanitizeFilename } = require('./bus.js');

let server;
let base;

before(async () => {
  server = createBus();
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

function req(method, p, { token, body, headers = {}, raw } = {}) {
  const h = { ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  let payload;
  if (raw !== undefined) { payload = raw; }
  else if (body !== undefined) { h['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  return fetch(`${base}${p}`, { method, headers: h, body: payload });
}

test('health needs no auth', async () => {
  const r = await fetch(`${base}/bus/health`);
  assert.strictEqual(r.status, 200);
  assert.deepStrictEqual(await r.json(), { status: 'ok' });
});

test('unauthenticated JSON call gets 401; browser gets the friendly page', async () => {
  const r = await fetch(`${base}/bus/messages`);
  assert.strictEqual(r.status, 401);
  const b = await fetch(`${base}/bus/messages`, { headers: { Accept: 'text/html' } });
  assert.strictEqual(b.status, 200);
  assert.match(await b.text(), /agent API, not a webpage/);
});

test('auth mapping: admin=coordinator, guest=zoe, partner=jim; A-Z0-9 regex only', () => {
  assert.deepStrictEqual(resolveAuth('Bearer admin-token-test'), { role: 'admin', agent: 'coordinator' });
  assert.deepStrictEqual(resolveAuth('Bearer guest-token-test'), { role: 'guest', agent: 'zoe' });
  assert.deepStrictEqual(resolveAuth('Bearer jim-token-test'), { role: 'partner', agent: 'jim' });
  assert.strictEqual(resolveAuth('Bearer nope'), null);
  assert.strictEqual(resolveAuth(undefined), null);
});

test('guest sends to coordinator; wire object shape is exact', async () => {
  const r = await req('POST', '/bus/send', { token: 'guest-token-test', body: { to: 'coordinator', subject: 'hi', body: 'first message' } });
  assert.strictEqual(r.status, 200);
  const { id } = await r.json();
  assert.ok(id);
  const list = await (await req('GET', '/bus/messages?to=coordinator', { token: 'admin-token-test' })).json();
  const msg = list.messages.find((m) => m.id === id);
  assert.ok(msg, 'message present');
  assert.deepStrictEqual(Object.keys(msg).sort(), ['body', 'created', 'from', 'id', 'status', 'subject', 'to']);
  assert.strictEqual(msg.from, 'zoe');
  assert.strictEqual(msg.status, 'new');
  assert.ok(!Number.isNaN(Date.parse(msg.created)), 'created is ISO8601');
});

test('partner can only send to coordinator, and from is server-forced (no spoofing)', async () => {
  const bad = await req('POST', '/bus/send', { token: 'jim-token-test', body: { to: 'zoe', body: 'sneaky' } });
  assert.strictEqual(bad.status, 403);
  const ok = await req('POST', '/bus/send', { token: 'jim-token-test', body: { to: 'coordinator', body: 'legit', from: 'coordinator' } });
  assert.strictEqual(ok.status, 200);
  const { id } = await ok.json();
  const list = await (await req('GET', '/bus/messages', { token: 'admin-token-test' })).json();
  const msg = list.messages.find((m) => m.id === id);
  assert.strictEqual(msg.from, 'jim', 'from forced to the caller agent, spoof ignored');
});

test('partner reads own thread only - never internal traffic', async () => {
  await req('POST', '/bus/send', { token: 'guest-token-test', body: { to: 'coordinator', body: 'internal zoe->coordinator' } });
  const list = await (await req('GET', '/bus/messages', { token: 'jim-token-test' })).json();
  assert.ok(list.messages.length > 0, 'jim sees his own');
  for (const m of list.messages) {
    assert.ok(m.to === 'jim' || m.from === 'jim', `leaked: ${m.from}->${m.to}`);
  }
});

test('PATCH marks read; partner cannot touch another thread', async () => {
  const send = await req('POST', '/bus/send', { token: 'guest-token-test', body: { to: 'coordinator', body: 'to be read' } });
  const { id } = await send.json();
  const deny = await req('PATCH', `/bus/messages/${id}`, { token: 'jim-token-test', body: { status: 'read' } });
  assert.strictEqual(deny.status, 403);
  const okr = await req('PATCH', `/bus/messages/${id}`, { token: 'admin-token-test', body: { status: 'read' } });
  assert.strictEqual(okr.status, 200);
  const list = await (await req('GET', '/bus/messages?status=read', { token: 'admin-token-test' })).json();
  assert.ok(list.messages.some((m) => m.id === id));
});

test('ring buffer keeps only the last 200', async () => {
  for (let i = 0; i < 205; i++) {
    // write directly through the API would be slow; use it for the last few, seed the file for bulk
  }
  const msgsPath = path.join(TMP, 'messages.json');
  const seed = Array.from({ length: 200 }, (_, i) => ({
    id: `seed-${i}`, from: 'zoe', to: 'coordinator', subject: '', body: `m${i}`, status: 'new', created: new Date().toISOString(),
  }));
  fs.writeFileSync(msgsPath, JSON.stringify(seed));
  await req('POST', '/bus/send', { token: 'guest-token-test', body: { to: 'coordinator', body: 'the 201st' } });
  const all = JSON.parse(fs.readFileSync(msgsPath, 'utf8'));
  assert.strictEqual(all.length, 200, 'ring capped at 200');
  assert.strictEqual(all[0].id, 'seed-1', 'oldest shifted out');
  assert.strictEqual(all[all.length - 1].body, 'the 201st');
});

test('JSON body over 50KB is rejected early with 413', async () => {
  const big = 'x'.repeat(51 * 1024);
  const r = await req('POST', '/bus/send', { token: 'guest-token-test', body: { to: 'coordinator', body: big } });
  assert.strictEqual(r.status, 413);
});

test('filename sanitization + partner upload quarantine prefix', async () => {
  assert.strictEqual(sanitizeFilename('../../etc/passwd'), '.._.._etc_passwd');
  assert.strictEqual(sanitizeFilename('a'.repeat(200)).length, 100);
  const up = await req('POST', '/bus/files/upload', {
    token: 'jim-token-test', raw: 'hello file', headers: { 'X-Filename': 'notes.txt' },
  });
  assert.strictEqual(up.status, 200);
  const { name } = await up.json();
  assert.strictEqual(name, 'jim-notes.txt', 'partner upload auto-prefixed');
  // partner sees only own/prefixed files
  const list = await (await req('GET', '/bus/files', { token: 'jim-token-test' })).json();
  for (const f of list.files) {
    assert.ok(f.uploadedBy === 'jim' || f.name.startsWith('jim-'));
  }
  // download round-trip
  const dl = await req('GET', `/bus/files/${name}`, { token: 'jim-token-test' });
  assert.strictEqual(await dl.text(), 'hello file');
});

test('admin can delete a file; partner cannot delete others files', async () => {
  await req('POST', '/bus/files/upload', { token: 'guest-token-test', raw: 'internal', headers: { 'X-Filename': 'internal.md' } });
  const deny = await req('DELETE', '/bus/files/internal.md', { token: 'jim-token-test' });
  assert.strictEqual(deny.status, 403);
  const ok = await req('DELETE', '/bus/files/internal.md', { token: 'admin-token-test' });
  assert.strictEqual(ok.status, 200);
});
