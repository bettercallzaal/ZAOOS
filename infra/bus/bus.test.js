/**
 * zao-bus tests - the tasern wire contract, enforced.
 * Run: node --test infra/bus/*.test.js
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
process.env.BUS_AGENT_TOKEN_ZOL = 'zol-token-test';
process.env.BUS_AGENT_TOKEN_HERMES = 'hermes-token-test';
process.env.BUS_AGENT_TOKEN_ALPHA = 'alpha-token-test';
process.env.BUS_AGENT_TOKEN_BETA = 'beta-token-test';
process.env.BUS_AGENT_TOKEN_GAMMA = 'gamma-token-test';
process.env.BUS_AGENT_TOKEN_DELTA = 'delta-token-test';

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

// ---- doc 2638 extensions: internal agents, threads, hop cap, rate, receipts, audit

test('internal agent: from forced, may reach zoe and coordinator, never a partner', async () => {
  assert.deepStrictEqual(resolveAuth('Bearer zol-token-test'), { role: 'agent', agent: 'zol' });
  const ok = await req('POST', '/bus/send', { token: 'zol-token-test', body: { to: 'zoe', body: 'zol to zoe', from: 'coordinator' } });
  assert.strictEqual(ok.status, 200);
  const { id } = await ok.json();
  const all = await (await req('GET', '/bus/messages', { token: 'admin-token-test' })).json();
  assert.strictEqual(all.messages.find((m) => m.id === id).from, 'zol', 'spoofed from ignored');
  const toPartner = await req('POST', '/bus/send', { token: 'zol-token-test', body: { to: 'jim', body: 'straight to a partner' } });
  assert.strictEqual(toPartner.status, 403);
  const toUnknown = await req('POST', '/bus/send', { token: 'zol-token-test', body: { to: 'stranger', body: 'who' } });
  assert.strictEqual(toUnknown.status, 403);
});

test('internal agent reads its own thread only', async () => {
  const list = await (await req('GET', '/bus/messages', { token: 'zol-token-test' })).json();
  assert.ok(list.messages.length > 0);
  for (const m of list.messages) assert.ok(m.to === 'zol' || m.from === 'zol', `leaked: ${m.from}->${m.to}`);
});

test('base wire object stays exact when no extension is used', async () => {
  const r = await req('POST', '/bus/send', { token: 'hermes-token-test', body: { to: 'coordinator', body: 'plain hermes note' } });
  const { id } = await r.json();
  const list = await (await req('GET', '/bus/messages', { token: 'admin-token-test' })).json();
  const msg = list.messages.find((m) => m.id === id);
  assert.deepStrictEqual(Object.keys(msg).sort(), ['body', 'created', 'from', 'id', 'status', 'subject', 'to']);
});

test('loop brake: two agents answering each other stop at the hop cap', async () => {
  process.env.BUS_MAX_HOPS = '4';
  try {
    const first = await req('POST', '/bus/send', { token: 'zol-token-test', body: { to: 'hermes', body: 'loop start' } });
    let last = (await first.json()).id;
    const tokens = ['hermes-token-test', 'zol-token-test'];
    const targets = ['zol', 'hermes'];
    let refusedAt = null;
    for (let i = 0; i < 10; i++) {
      const r = await req('POST', '/bus/send', { token: tokens[i % 2], body: { to: targets[i % 2], body: `loop reply ${i}`, reply_to: last } });
      if (r.status === 409) { refusedAt = i + 1; break; }
      assert.strictEqual(r.status, 200);
      last = (await r.json()).id;
    }
    assert.strictEqual(refusedAt, 5, 'replies 1-4 pass, the 5th is refused');
    const list = await (await req('GET', '/bus/messages', { token: 'admin-token-test' })).json();
    const chain = list.messages.filter((m) => m.body.startsWith('loop'));
    assert.ok(chain.every((m) => m.thread === chain[0].id || m.id === chain[0].id), 'one thread');
    assert.strictEqual(Math.max(...chain.map((m) => m.hops || 0)), 4);
  } finally { delete process.env.BUS_MAX_HOPS; }
});

test('reply_to outside your thread is refused', async () => {
  const r = await req('POST', '/bus/send', { token: 'guest-token-test', body: { to: 'coordinator', body: 'zoe private to coordinator' } });
  const { id } = await r.json();
  const bad = await req('POST', '/bus/send', { token: 'zol-token-test', body: { to: 'coordinator', body: 'hijack', reply_to: id } });
  assert.strictEqual(bad.status, 403);
});

test('idempotency key: a retry returns the first id and stores one message', async () => {
  const send = () => req('POST', '/bus/send', { token: 'hermes-token-test', body: { to: 'zoe', body: `retry body ${Math.random()}`, idempotency_key: 'k-123' } });
  const a = await (await send()).json();
  const b = await (await send()).json();
  assert.strictEqual(b.id, a.id);
  assert.strictEqual(b.duplicate, true);
  const all = JSON.parse(fs.readFileSync(path.join(TMP, 'messages.json'), 'utf8'));
  assert.strictEqual(all.filter((m) => m.idempotency_key === 'k-123').length, 1);
});

test('the same from/to/body inside a minute is stored once', async () => {
  const a = await (await req('POST', '/bus/send', { token: 'zol-token-test', body: { to: 'coordinator', body: 'echo echo' } })).json();
  const b = await (await req('POST', '/bus/send', { token: 'zol-token-test', body: { to: 'coordinator', body: 'echo echo' } })).json();
  assert.strictEqual(b.id, a.id);
  assert.strictEqual(b.duplicate, true);
});

test('rate limit: over the per-minute cap returns 429', async () => {
  process.env.BUS_RATE_PER_MIN = '3';
  process.env.BUS_AGENT_TOKEN_RATEY = 'ratey-token-test';
  try {
    const codes = [];
    for (let i = 0; i < 5; i++) {
      codes.push((await req('POST', '/bus/send', { token: 'ratey-token-test', body: { to: 'coordinator', body: `burst ${i}` } })).status);
    }
    assert.deepStrictEqual(codes, [200, 200, 200, 429, 429]);
  } finally { delete process.env.BUS_RATE_PER_MIN; delete process.env.BUS_AGENT_TOKEN_RATEY; }
});

test('receipts: delivered when the recipient lists it, read when it PATCHes', async () => {
  const { id } = await (await req('POST', '/bus/send', { token: 'alpha-token-test', body: { to: 'beta', body: 'receipt me' } })).json();
  let r = await (await req('GET', `/bus/messages/${id}/receipt`, { token: 'alpha-token-test' })).json();
  assert.deepStrictEqual([r.delivered_at, r.read_at], [null, null]);
  await req('GET', '/bus/messages?status=new', { token: 'beta-token-test' });
  r = await (await req('GET', `/bus/messages/${id}/receipt`, { token: 'alpha-token-test' })).json();
  assert.ok(r.delivered_at && !r.read_at, 'delivered, not read');
  await req('PATCH', `/bus/messages/${id}`, { token: 'beta-token-test', body: { status: 'read' } });
  r = await (await req('GET', `/bus/messages/${id}/receipt`, { token: 'alpha-token-test' })).json();
  assert.ok(r.read_at, 'read');
  const outsider = await req('GET', `/bus/messages/${id}/receipt`, { token: 'jim-token-test' });
  assert.strictEqual(outsider.status, 403);
});

test('audit log records events without message bodies; no temp files left behind', async () => {
  await req('POST', '/bus/send', { token: 'zol-token-test', body: { to: 'coordinator', body: 'SECRET-BODY-MARKER' } });
  const log = fs.readFileSync(path.join(TMP, 'audit.log'), 'utf8');
  assert.match(log, /"event":"send"/);
  assert.match(log, /"event":"refused_hops"/);
  assert.ok(!log.includes('SECRET-BODY-MARKER'), 'bodies never logged');
  assert.deepStrictEqual(fs.readdirSync(TMP).filter((f) => f.endsWith('.tmp')), []);
});

// ---- review gaps (dreamnet review of #3806)

test('gap 1: an agent cannot dodge the hop cap by dropping reply_to', async () => {
  const first = await (await req('POST', '/bus/send', { token: 'gamma-token-test', body: { to: 'delta', body: 'gap1 start' } })).json();
  const dodge = await req('POST', '/bus/send', { token: 'delta-token-test', body: { to: 'gamma', body: 'gap1 fresh thread, no reply_to' } });
  assert.strictEqual(dodge.status, 409, 'unread message waiting: must use reply_to');
  const threaded = await req('POST', '/bus/send', { token: 'delta-token-test', body: { to: 'gamma', body: 'gap1 proper reply', reply_to: first.id } });
  assert.strictEqual(threaded.status, 200);
});

test('gap 1: a pair of agents shares an hourly budget', async () => {
  process.env.BUS_PAIR_PER_HOUR = '4';
  process.env.BUS_AGENT_TOKEN_EPS = 'eps-token-test';
  process.env.BUS_AGENT_TOKEN_ZETA = 'zeta-token-test';
  try {
    const codes = [];
    for (let i = 0; i < 6; i++) {
      const r = await req('POST', '/bus/send', { token: 'eps-token-test', body: { to: 'zeta', body: `pair ${i}` } });
      codes.push(r.status);
    }
    assert.deepStrictEqual(codes, [200, 200, 200, 200, 429, 429]);
  } finally { delete process.env.BUS_PAIR_PER_HOUR; delete process.env.BUS_AGENT_TOKEN_EPS; delete process.env.BUS_AGENT_TOKEN_ZETA; }
});

test('gap 2: a sender cannot mark its own message read to hide it', async () => {
  const { id } = await (await req('POST', '/bus/send', { token: 'gamma-token-test', body: { to: 'coordinator', body: 'gap2 hide me' } })).json();
  const hide = await req('PATCH', `/bus/messages/${id}`, { token: 'gamma-token-test', body: { status: 'read' } });
  assert.strictEqual(hide.status, 403);
  const list = await (await req('GET', '/bus/messages?status=new', { token: 'admin-token-test' })).json();
  assert.ok(list.messages.some((m) => m.id === id), 'still new for the recipient');
});

test('gap 3: an agent token named like the coordinator, the guest or a partner is refused', () => {
  process.env.BUS_AGENT_TOKEN_JIM = 'fake-jim-agent';
  process.env.BUS_AGENT_TOKEN_COORDINATOR = 'fake-coord-agent';
  process.env.BUS_AGENT_TOKEN_ZOE = 'fake-zoe-agent';
  try {
    assert.strictEqual(resolveAuth('Bearer fake-jim-agent'), null);
    assert.strictEqual(resolveAuth('Bearer fake-coord-agent'), null);
    assert.strictEqual(resolveAuth('Bearer fake-zoe-agent'), null);
    assert.deepStrictEqual(resolveAuth('Bearer jim-token-test'), { role: 'partner', agent: 'jim' }, 'the real partner token still works');
  } finally { delete process.env.BUS_AGENT_TOKEN_JIM; delete process.env.BUS_AGENT_TOKEN_COORDINATOR; delete process.env.BUS_AGENT_TOKEN_ZOE; }
});

test('gap 3: audit.log rotates to audit.log.1 past its size cap', async () => {
  process.env.BUS_AUDIT_MAX_BYTES = '200';
  try {
    for (let i = 0; i < 4; i++) await req('POST', '/bus/send', { token: 'guest-token-test', body: { to: 'coordinator', body: `rotate ${i}` } });
    assert.ok(fs.existsSync(path.join(TMP, 'audit.log.1')), 'older generation kept');
    assert.ok(fs.statSync(path.join(TMP, 'audit.log')).size < 1000, 'current log restarted small');
  } finally { delete process.env.BUS_AUDIT_MAX_BYTES; }
});
