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
 * Partner scope is ENFORCED here, never trusted from the client:
 *   send only to "coordinator"; `from` is forced; read own thread only;
 *   files: own uploads or "<name>-" prefixed only (uploads auto-prefixed).
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

function dataDir() {
  return process.env.BUS_DATA_DIR || path.join(process.cwd(), 'bus-data');
}
function messagesPath() { return path.join(dataDir(), 'messages.json'); }
function fileMetaPath() { return path.join(dataDir(), 'file-meta.json'); }
function filesDir() { return path.join(dataDir(), 'shared-files'); }

function ensureDirs() {
  fs.mkdirSync(filesDir(), { recursive: true });
}
function loadJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}
function saveJson(p, val) {
  fs.writeFileSync(p, JSON.stringify(val, null, 2));
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
      const from = auth.role === 'admin' && body.from ? String(body.from).toLowerCase() : auth.agent;
      const msg = {
        id: crypto.randomUUID(),
        from,
        to,
        subject: typeof body.subject === 'string' ? body.subject : '',
        body: body.body,
        status: 'new',
        created: new Date().toISOString(),
      };
      const messages = loadJson(messagesPath(), []);
      messages.push(msg);
      while (messages.length > RING_MAX) messages.shift(); // ring buffer
      saveJson(messagesPath(), messages);
      sendJson(res, 200, { id: msg.id });
    });
    return;
  }

  // GET /bus/messages
  if (p === '/bus/messages' && req.method === 'GET') {
    let messages = loadJson(messagesPath(), []);
    if (auth.role === 'partner') {
      // partners see their own thread ONLY - never internal traffic
      messages = messages.filter((m) => m.to === auth.agent || m.from === auth.agent);
    }
    const qTo = url.searchParams.get('to');
    const qStatus = url.searchParams.get('status');
    if (qTo) messages = messages.filter((m) => m.to === qTo.toLowerCase());
    if (qStatus) messages = messages.filter((m) => m.status === qStatus);
    sendJson(res, 200, { messages });
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
      if (auth.role === 'partner' && msg.to !== auth.agent && msg.from !== auth.agent) {
        sendJson(res, 403, { error: 'not your thread' });
        return;
      }
      msg.status = 'read';
      saveJson(messagesPath(), messages);
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
    if (auth.role === 'partner' && !name.startsWith(`${auth.agent}-`)) name = `${auth.agent}-${name}`;
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
    if (auth.role === 'partner') {
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
    if (auth.role === 'partner' && !mine) { sendJson(res, 403, { error: 'not your file' }); return; }
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

module.exports = { createBus, resolveAuth, sanitizeFilename, RING_MAX };

if (require.main === module) {
  const port = Number(process.env.BUS_PORT || 3099);
  createBus().listen(port, () => {
    console.log(`[zao-bus] listening on :${port} (data: ${dataDir()})`);
  });
}
