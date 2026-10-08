#!/usr/bin/env node
/**
 * zao-bus - ZAO's agent message bus, built to the tasern wire contract.
 *
 * Spec credit: Jim (Meme for Trees) / the tasern coordinator, who shared their
 * full bus shape on the tasern lane 2026-08-06 ("How we built the bus - full
 * shape for interop") so ZAO could build sovereign-but-interoperable. Same wire
 * object, same verbs, same auth model - so a Spore adapter at the DreamNet
 * Federation Gateway only maps names, never translates shapes.
 *
 * Deliberately boring (that's why it stays up): vanilla node:http, NO framework,
 * flat JSON storage, one process. The bus is transport, not the system of record.
 *
 * WIRE CONTRACT (interop - do not change):
 *   message = { id: uuid, from, to, subject, body, status: "new"|"read", created: ISO8601 }
 *   POST   /bus/send            {to, body, subject?}          -> {id}
 *   GET    /bus/messages        ?to=<name>&status=new         -> {messages:[...]}
 *   PATCH  /bus/messages/:id    {status:"read"}               -> {ok:true}
 *   POST   /bus/files/upload    raw body + X-Filename header  -> {ok,name}
 *   GET    /bus/files                                          -> {files, quota}
 *   GET    /bus/files/:filename                                -> download
 *   DELETE /bus/files/:filename  (admin or own)                -> {ok}
 *   GET    /bus/health          (no auth)                      -> {status:"ok"}
 *
 * AUTH (bearer -> role, all server-side):
 *   BUS_ADMIN_TOKEN         -> role admin,   agent "coordinator"
 *   BUS_GUEST_TOKEN         -> role guest,   agent from BUS_GUEST_AGENT (default "zoe")
 *   BUS_GUEST_TOKEN_<NAME>  -> role partner, agent lowercase(NAME)  [^BUS_GUEST_TOKEN_([A-Z0-9]+)$ - A-Z0-9 ONLY]
 *   BUS_AGENT_TOKEN_<NAME>  -> role agent,   agent lowercase(NAME)  (internal agents: zol, hermes, desk bots)
 * Partner scope is ENFORCED here, never trusted from the client:
 *   send only to "coordinator"; `from` is forced; read own thread only;
 *   files: own uploads or "<name>-" prefixed only (uploads auto-prefixed).
 * Internal agent scope: send to the coordinator, the guest agent or another
 *   internal agent, never straight to a partner (partner traffic goes through
 *   the coordinator); `from` is forced; read own thread only.
 *
 * EXTENSIONS (doc 2638, all optional, so the wire contract above is unchanged:
 * a message carries the extra keys only when the sender used them):
 *   send body may add  reply_to: <id>        -> message gets thread, reply_to, hops
 *                      thread: <string>      -> groups a conversation
 *                      idempotency_key: <s>  -> a retry returns the first id, no duplicate
 *   hop cap: a reply chain deeper than BUS_MAX_HOPS (default 8) is refused (409).
 *     This is the loop brake: two agents answering each other stop at the cap.
 *   no dodging the cap: an internal agent that has an unread message waiting
 *     from the agent it is writing to must answer with reply_to (409 if not),
 *     and every pair of internal agents shares a budget of BUS_PAIR_PER_HOUR
 *     messages an hour in both directions (default 60, 429 after that).
 *   rate limit: BUS_RATE_PER_MIN sends per sender per minute (default 30) -> 429;
 *     the same from/to/body inside 60s is not stored twice.
 *   receipts: GET /bus/messages/:id/receipt -> {delivered_at, read_at}
 *     delivered = the recipient listed it; read = the recipient PATCHed it.
 *   audit: every send/deliver/read appends one JSON line to audit.log
 *     (ids, names, sizes, never bodies). Past BUS_AUDIT_MAX_BYTES (default
 *     5 MB) it rotates to audit.log.1, keeping one older generation.
 *   only the recipient (or the admin) can mark a message read, so a sender
 *     cannot hide its own message from the recipient's status=new poll.
 *   names: an agent token whose name is "coordinator", the guest agent or a
 *     partner is ignored (that token gets 401), so no mistyped env line can
 *     hand an agent someone else's thread.
 *
 * Env: BUS_PORT (default 3099), BUS_DATA_DIR (default ./bus-data).
 * DEPLOY IS GATED - running this on the VPS behind nginx is Zaal's step.
 */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const MAX_JSON_BYTES = 50 * 1024; // reject early on the stream, never buffer unbounded
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_FILES = 200;
const MAX_TOTAL_BYTES = 500 * 1024 * 1024;
const RING_MAX = 200; // keep the last N messages; partners keep their own copy
const DEDUP_WINDOW_MS = 60 * 1000;
function maxHops() { return Number(process.env.BUS_MAX_HOPS || 8); }
function ratePerMin() { return Number(process.env.BUS_RATE_PER_MIN || 30); }
function pairPerHour() { return Number(process.env.BUS_PAIR_PER_HOUR || 60); }
function auditMaxBytes() { return Number(process.env.BUS_AUDIT_MAX_BYTES || 5 * 1024 * 1024); }

function dataDir() {
  return process.env.BUS_DATA_DIR || path.join(process.cwd(), 'bus-data');
}
function messagesPath() { return path.join(dataDir(), 'messages.json'); }
function fileMetaPath() { return path.join(dataDir(), 'file-meta.json'); }
function receiptsPath() { return path.join(dataDir(), 'receipts.json'); }
function auditPath() { return path.join(dataDir(), 'audit.log'); }
function filesDir() { return path.join(dataDir(), 'shared-files'); }

function ensureDirs() {
  fs.mkdirSync(filesDir(), { recursive: true });
}
function loadJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}
/** Atomic: write a temp file, then rename over the target, so a crash mid-write
 * can never leave a half-written messages.json (rename is atomic on one disk). */
function saveJson(p, val) {
  const tmp = `${p}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(val, null, 2));
  fs.renameSync(tmp, p);
}
function audit(event, fields) {
  try {
    const st = fs.statSync(auditPath(), { throwIfNoEntry: false });
    if (st && st.size > auditMaxBytes()) fs.renameSync(auditPath(), `${auditPath()}.1`); // one older generation
    fs.appendFileSync(auditPath(), `${JSON.stringify({ at: new Date().toISOString(), event, ...fields })}\n`);
  } catch { /* the audit log never blocks a message */ }
}

// per-sender send times for the rate limit; in memory, resets on restart (one process)
const sendTimes = new Map();
function overRate(agent, now) {
  const recent = (sendTimes.get(agent) || []).filter((t) => now - t < 60 * 1000);
  sendTimes.set(agent, recent);
  if (recent.length >= ratePerMin()) return true;
  recent.push(now);
  return false;
}

function guestAgent() { return (process.env.BUS_GUEST_AGENT || 'zoe').toLowerCase(); }
/** Names an agent token may NOT take: the coordinator, the guest agent, every partner. */
function reservedNames() {
  const names = new Set(['coordinator', guestAgent()]);
  for (const key of Object.keys(process.env)) {
    const m = /^BUS_GUEST_TOKEN_([A-Z0-9]+)$/.exec(key);
    if (m && process.env[key]) names.add(m[1].toLowerCase());
  }
  return names;
}
/** Internal agent names: the guest agent plus every BUS_AGENT_TOKEN_<NAME> that is not reserved. */
function internalAgents() {
  const reserved = reservedNames();
  const names = new Set([guestAgent()]);
  for (const key of Object.keys(process.env)) {
    const m = /^BUS_AGENT_TOKEN_([A-Z0-9]+)$/.exec(key);
    if (m && process.env[key] && !reserved.has(m[1].toLowerCase())) names.add(m[1].toLowerCase());
  }
  return names;
}

/** token -> {role, agent} - the whole auth model, all server-side. */
function resolveAuth(header) {
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  if (process.env.BUS_ADMIN_TOKEN && token === process.env.BUS_ADMIN_TOKEN) {
    return { role: 'admin', agent: 'coordinator' };
  }
  if (process.env.BUS_GUEST_TOKEN && token === process.env.BUS_GUEST_TOKEN) {
    return { role: 'guest', agent: (process.env.BUS_GUEST_AGENT || 'zoe').toLowerCase() };
  }
  for (const [key, val] of Object.entries(process.env)) {
    const m = /^BUS_GUEST_TOKEN_([A-Z0-9]+)$/.exec(key); // A-Z0-9 ONLY (tasern gotcha)
    if (m && val && token === val) return { role: 'partner', agent: m[1].toLowerCase() };
    const a = /^BUS_AGENT_TOKEN_([A-Z0-9]+)$/.exec(key);
    if (a && val && token === val) {
      if (reservedNames().has(a[1].toLowerCase())) return null; // name collision: refuse, never share a thread
      return { role: 'agent', agent: a[1].toLowerCase() };
    }
  }
  return null;
}

function sanitizeFilename(name) {
  return String(name || '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
}

function sendJson(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

/** Read a JSON body, rejecting early once it exceeds the cap. */
function readJsonBody(req, res, cb) {
  let size = 0;
  const chunks = [];
  let rejected = false;
  req.on('data', (c) => {
    size += c.length;
    if (size > MAX_JSON_BYTES && !rejected) {
      rejected = true;
      sendJson(res, 413, { error: 'body too large' });
      req.destroy();
      return;
    }
    chunks.push(c);
  });
  req.on('end', () => {
    if (rejected) return;
    try { cb(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
    catch { sendJson(res, 400, { error: 'invalid json' }); }
  });
}

function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;

  // CORS open + preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Filename');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // health - the one unauthenticated endpoint
  if (p === '/bus/health' && req.method === 'GET') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  const auth = resolveAuth(req.headers.authorization);
  if (!auth) {
    // browser guard: a human tapping a link gets a friendly page, not a bare 401
    if ((req.headers.accept || '').includes('text/html')) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html><body><p>This is an agent API, not a webpage. Nothing to see here.</p></body></html>');
      return;
    }
    sendJson(res, 401, { error: 'unauthorized' });
    return;
  }

  ensureDirs();

  // POST /bus/send
  if (p === '/bus/send' && req.method === 'POST') {
    readJsonBody(req, res, (body) => {
      const to = String(body.to || '').toLowerCase();
      if (!to || typeof body.body !== 'string' || !body.body) {
        sendJson(res, 400, { error: 'to and body required' });
        return;
      }
      // partner scope: only to coordinator; from is ALWAYS forced server-side
      if (auth.role === 'partner' && to !== 'coordinator') {
        sendJson(res, 403, { error: 'partners may only send to coordinator' });
        return;
      }
      // internal agent scope: coordinator or another internal agent, never a partner directly
      if (auth.role === 'agent' && to !== 'coordinator' && !internalAgents().has(to)) {
        sendJson(res, 403, { error: 'agents may send to the coordinator or another internal agent only' });
        return;
      }
      const from = auth.role === 'admin' && body.from ? String(body.from).toLowerCase() : auth.agent;
      const messages = loadJson(messagesPath(), []);
      const nowMs = Date.now();

      // idempotency: a retry with the same key from the same sender returns the first id
      const idemKey = typeof body.idempotency_key === 'string' ? body.idempotency_key.slice(0, 200) : '';
      if (idemKey) {
        const prior = messages.find((m) => m.from === from && m.idempotency_key === idemKey);
        if (prior) { sendJson(res, 200, { id: prior.id, duplicate: true }); return; }
      }
      // repeat drop: the same from/to/body inside the window is not stored twice
      const repeat = messages.find((m) => m.from === from && m.to === to && m.body === body.body
        && nowMs - Date.parse(m.created) < DEDUP_WINDOW_MS);
      if (repeat) { sendJson(res, 200, { id: repeat.id, duplicate: true }); return; }

      // threads and the hop cap (the loop brake)
      let thread = typeof body.thread === 'string' && body.thread ? body.thread.slice(0, 120) : '';
      let replyTo = '';
      let hops = 0;
      if (body.reply_to) {
        const parent = messages.find((m) => m.id === String(body.reply_to));
        if (!parent) { sendJson(res, 404, { error: 'reply_to not found' }); return; }
        if (auth.role !== 'admin' && parent.to !== from && parent.from !== from) {
          sendJson(res, 403, { error: 'reply_to is not in your thread' });
          return;
        }
        replyTo = parent.id;
        thread = parent.thread || parent.id;
        hops = (parent.hops || 0) + 1;
        if (hops > maxHops()) {
          audit('refused_hops', { from, to, reply_to: replyTo, hops });
          sendJson(res, 409, { error: `hop limit ${maxHops()} reached; a human or the coordinator must restart this thread` });
          return;
        }
      }

      // between internal agents: answer what is waiting with reply_to, and share a pair budget
      const internal = internalAgents();
      if (auth.role !== 'admin' && internal.has(from) && internal.has(to)) {
        const waiting = messages.some((m) => m.from === to && m.to === from && m.status === 'new');
        if (waiting && !replyTo) {
          audit('refused_unthreaded', { from, to });
          sendJson(res, 409, { error: `${to} has an unread message waiting for you; answer it with reply_to` });
          return;
        }
        const hourAgo = nowMs - 60 * 60 * 1000;
        const pairCount = messages.filter((m) => ((m.from === from && m.to === to) || (m.from === to && m.to === from))
          && Date.parse(m.created) > hourAgo).length;
        if (pairCount >= pairPerHour()) {
          audit('refused_pair_budget', { from, to, count: pairCount });
          sendJson(res, 429, { error: `pair budget: ${pairPerHour()} messages an hour between ${from} and ${to}` });
          return;
        }
      }

      if (overRate(from, nowMs)) {
        audit('refused_rate', { from, to });
        sendJson(res, 429, { error: `rate limit: ${ratePerMin()} sends per minute` });
        return;
      }

      const msg = {
        id: crypto.randomUUID(),
        from,
        to,
        subject: typeof body.subject === 'string' ? body.subject : '',
        body: body.body,
        status: 'new',
        created: new Date(nowMs).toISOString(),
      };
      // extension keys only when used, so the base wire object stays exact
      if (thread) msg.thread = thread;
      if (replyTo) { msg.reply_to = replyTo; msg.hops = hops; }
      if (idemKey) msg.idempotency_key = idemKey;
      messages.push(msg);
      while (messages.length > RING_MAX) messages.shift(); // ring buffer
      saveJson(messagesPath(), messages);
      audit('send', { id: msg.id, from, to, bytes: Buffer.byteLength(msg.body), thread: thread || undefined, hops: replyTo ? hops : undefined });
      sendJson(res, 200, { id: msg.id });
    });
    return;
  }

  // GET /bus/messages
  if (p === '/bus/messages' && req.method === 'GET') {
    let messages = loadJson(messagesPath(), []);
    if (auth.role === 'partner' || auth.role === 'agent') {
      // partners and internal agents see their own thread ONLY
      messages = messages.filter((m) => m.to === auth.agent || m.from === auth.agent);
    }
    const qTo = url.searchParams.get('to');
    const qStatus = url.searchParams.get('status');
    if (qTo) messages = messages.filter((m) => m.to === qTo.toLowerCase());
    if (qStatus) messages = messages.filter((m) => m.status === qStatus);
    // delivered receipt: the first time the recipient itself lists a message
    const mine = messages.filter((m) => m.to === auth.agent);
    if (mine.length) {
      const receipts = loadJson(receiptsPath(), {});
      let changed = false;
      for (const m of mine) {
        if (!receipts[m.id]) receipts[m.id] = {};
        if (!receipts[m.id].delivered_at) {
          receipts[m.id].delivered_at = new Date().toISOString();
          audit('delivered', { id: m.id, to: m.to });
          changed = true;
        }
      }
      if (changed) {
        const live = new Set(loadJson(messagesPath(), []).map((m) => m.id));
        for (const id of Object.keys(receipts)) if (!live.has(id)) delete receipts[id]; // follow the ring
        saveJson(receiptsPath(), receipts);
      }
    }
    sendJson(res, 200, { messages });
    return;
  }

  // GET /bus/messages/:id/receipt
  const receiptMatch = /^\/bus\/messages\/([0-9a-f-]+)\/receipt$/.exec(p);
  if (receiptMatch && req.method === 'GET') {
    const msg = loadJson(messagesPath(), []).find((m) => m.id === receiptMatch[1]);
    if (!msg) { sendJson(res, 404, { error: 'not found' }); return; }
    if (auth.role !== 'admin' && auth.role !== 'guest' && msg.to !== auth.agent && msg.from !== auth.agent) {
      sendJson(res, 403, { error: 'not your thread' });
      return;
    }
    const r = loadJson(receiptsPath(), {})[msg.id] || {};
    sendJson(res, 200, { id: msg.id, delivered_at: r.delivered_at || null, read_at: r.read_at || null });
    return;
  }

  // PATCH /bus/messages/:id
  const patchMatch = /^\/bus\/messages\/([0-9a-f-]+)$/.exec(p);
  if (patchMatch && req.method === 'PATCH') {
    readJsonBody(req, res, (body) => {
      if (body.status !== 'read') { sendJson(res, 400, { error: 'only status:"read"' }); return; }
      const messages = loadJson(messagesPath(), []);
      const msg = messages.find((m) => m.id === patchMatch[1]);
      if (!msg) { sendJson(res, 404, { error: 'not found' }); return; }
      if (auth.role !== 'admin' && msg.to !== auth.agent) {
        // only the recipient marks read; a sender could otherwise hide its own message
        sendJson(res, 403, { error: msg.from === auth.agent ? 'only the recipient can mark a message read' : 'not your thread' });
        return;
      }
      msg.status = 'read';
      saveJson(messagesPath(), messages);
      if (msg.to === auth.agent) {
        const receipts = loadJson(receiptsPath(), {});
        receipts[msg.id] = { ...(receipts[msg.id] || {}), read_at: new Date().toISOString() };
        if (!receipts[msg.id].delivered_at) receipts[msg.id].delivered_at = receipts[msg.id].read_at;
        saveJson(receiptsPath(), receipts);
      }
      audit('read', { id: msg.id, by: auth.agent });
      sendJson(res, 200, { ok: true });
    });
    return;
  }

  // POST /bus/files/upload  (raw body + X-Filename or ?name=)
  if (p === '/bus/files/upload' && req.method === 'POST') {
    const meta = loadJson(fileMetaPath(), []);
    if (meta.length >= MAX_FILES) { sendJson(res, 507, { error: 'file count quota' }); req.destroy(); return; }
    const used = meta.reduce((s, f) => s + (f.size || 0), 0);
    let name = sanitizeFilename(req.headers['x-filename'] || url.searchParams.get('name') || 'upload.bin');
    // quarantine: partner uploads auto-prefixed so they can NEVER overwrite internal files
    if ((auth.role === 'partner' || auth.role === 'agent') && !name.startsWith(`${auth.agent}-`)) name = `${auth.agent}-${name}`;
    const dest = path.join(filesDir(), name);
    let size = 0;
    let aborted = false;
    const out = fs.createWriteStream(dest);
    req.on('data', (c) => {
      size += c.length;
      if ((size > MAX_FILE_BYTES || used + size > MAX_TOTAL_BYTES) && !aborted) {
        aborted = true;
        out.destroy();
        fs.rmSync(dest, { force: true }); // single self-created partial file, exact path
        sendJson(res, 413, { error: 'file quota exceeded' });
        req.destroy();
      }
    });
    req.pipe(out);
    out.on('finish', () => {
      if (aborted) return;
      const rest = meta.filter((f) => f.name !== name);
      rest.push({ name, uploadedBy: auth.agent, size, created: new Date().toISOString() });
      saveJson(fileMetaPath(), rest);
      sendJson(res, 200, { ok: true, name });
    });
    return;
  }

  // GET /bus/files (list, scoped)
  if (p === '/bus/files' && req.method === 'GET') {
    let meta = loadJson(fileMetaPath(), []);
    if (auth.role === 'partner' || auth.role === 'agent') {
      meta = meta.filter((f) => f.uploadedBy === auth.agent || f.name.startsWith(`${auth.agent}-`));
    }
    const used = loadJson(fileMetaPath(), []).reduce((s, f) => s + (f.size || 0), 0);
    sendJson(res, 200, {
      files: meta,
      quota: { usedBytes: used, maxBytes: MAX_TOTAL_BYTES, fileCount: loadJson(fileMetaPath(), []).length, maxFiles: MAX_FILES },
    });
    return;
  }

  // GET|DELETE /bus/files/:filename
  const fileMatch = /^\/bus\/files\/([^/]+)$/.exec(p);
  if (fileMatch && (req.method === 'GET' || req.method === 'DELETE')) {
    const name = sanitizeFilename(decodeURIComponent(fileMatch[1]));
    const meta = loadJson(fileMetaPath(), []);
    const entry = meta.find((f) => f.name === name);
    if (!entry) { sendJson(res, 404, { error: 'not found' }); return; }
    const mine = entry.uploadedBy === auth.agent || name.startsWith(`${auth.agent}-`);
    if ((auth.role === 'partner' || auth.role === 'agent') && !mine) { sendJson(res, 403, { error: 'not your file' }); return; }
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
      fs.createReadStream(path.join(filesDir(), name)).pipe(res);
      return;
    }
    // DELETE: admin or own
    if (auth.role !== 'admin' && !mine) { sendJson(res, 403, { error: 'admin or owner only' }); return; }
    fs.rmSync(path.join(filesDir(), name), { force: true }); // single tracked file by exact path
    saveJson(fileMetaPath(), meta.filter((f) => f.name !== name));
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 404, { error: 'no such route' });
}

function createBus() {
  return http.createServer(handler);
}

module.exports = { createBus, resolveAuth, sanitizeFilename, RING_MAX, internalAgents };

if (require.main === module) {
  const port = Number(process.env.BUS_PORT || 3099);
  createBus().listen(port, () => {
    console.log(`[zao-bus] listening on :${port} (data: ${dataDir()})`);
  });
}
