#!/usr/bin/env node
/**
 * zao-bus-cli - the little client every bus side runs (Jim's spec: "each side
 * connects with a little cli: check for new messages, send, read, list files,
 * upload, download").
 *
 * Works against ANY bus speaking the tasern wire contract - ours (infra/bus/bus.js)
 * or Jim's - because the contract is the whole interface. Spec credit: Jim /
 * Meme for Trees (tasern coordinator).
 *
 * Env: BUS_URL (e.g. https://example.com/bus or http://localhost:3099/bus... base
 *      WITHOUT the trailing verb; /bus is included), BUS_TOKEN (bearer).
 * Token hygiene: the token lives in env / a chmod-600 file - NEVER in argv (ps
 * leaks argv), never in a URL.
 *
 *   bus-cli health
 *   bus-cli check                        # unread for me (status=new)
 *   bus-cli send <to> <body...>          # send a message
 *   bus-cli read <message-id>            # mark read
 *   bus-cli list                         # all messages I can see
 *   bus-cli files                        # list files
 *   bus-cli upload <path>                # upload a file
 *   bus-cli download <name> [dest]       # download a file
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

function usage(code) {
  console.error('usage: bus-cli health|check|send|read|list|files|upload|download (env: BUS_URL, BUS_TOKEN)');
  process.exit(code);
}

const BUS_URL = (process.env.BUS_URL || '').replace(/\/$/, '');
const BUS_TOKEN = process.env.BUS_TOKEN || '';

async function call(method, p, { body, raw, headers = {} } = {}) {
  const h = { ...headers };
  if (BUS_TOKEN) h.Authorization = `Bearer ${BUS_TOKEN}`;
  let payload;
  if (raw !== undefined) payload = raw;
  else if (body !== undefined) { h['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(`${BUS_URL}${p}`, { method, headers: h, body: payload });
  return res;
}

async function main() {
  const [verb, ...args] = process.argv.slice(2);
  if (!verb) usage(2);
  if (verb !== 'health' && (!BUS_URL || !BUS_TOKEN)) {
    console.error('bus-cli: set BUS_URL and BUS_TOKEN in the environment');
    process.exit(2);
  }
  if (verb === 'health') {
    if (!BUS_URL) { console.error('bus-cli: set BUS_URL'); process.exit(2); }
    const r = await call('GET', '/health');
    console.log(await r.text());
    process.exit(r.ok ? 0 : 1);
  }
  if (verb === 'check' || verb === 'list') {
    const q = verb === 'check' ? '/messages?status=new' : '/messages';
    const r = await call('GET', q);
    if (!r.ok) { console.error(`bus-cli: HTTP ${r.status}`); process.exit(1); }
    const { messages } = await r.json();
    if (!messages.length) { console.log('(no messages)'); return; }
    for (const m of messages) {
      console.log(`${m.status === 'new' ? '*' : ' '} ${m.id}  ${m.created}  ${m.from}->${m.to}  ${m.subject || '(no subject)'}`);
      console.log(`    ${String(m.body).slice(0, 200).replace(/\n/g, '\n    ')}`);
    }
    return;
  }
  if (verb === 'send') {
    const [to, ...bodyParts] = args;
    if (!to || bodyParts.length === 0) usage(2);
    const r = await call('POST', '/send', { body: { to, body: bodyParts.join(' ') } });
    if (!r.ok) { console.error(`bus-cli: HTTP ${r.status} ${await r.text()}`); process.exit(1); }
    console.log(JSON.stringify(await r.json()));
    return;
  }
  if (verb === 'read') {
    const [id] = args;
    if (!id) usage(2);
    const r = await call('PATCH', `/messages/${id}`, { body: { status: 'read' } });
    if (!r.ok) { console.error(`bus-cli: HTTP ${r.status}`); process.exit(1); }
    console.log('marked read');
    return;
  }
  if (verb === 'files') {
    const r = await call('GET', '/files');
    if (!r.ok) { console.error(`bus-cli: HTTP ${r.status}`); process.exit(1); }
    console.log(JSON.stringify(await r.json(), null, 2));
    return;
  }
  if (verb === 'upload') {
    const [file] = args;
    if (!file || !fs.existsSync(file)) usage(2);
    const r = await call('POST', '/files/upload', {
      raw: fs.readFileSync(file),
      headers: { 'X-Filename': path.basename(file) },
    });
    if (!r.ok) { console.error(`bus-cli: HTTP ${r.status} ${await r.text()}`); process.exit(1); }
    console.log(JSON.stringify(await r.json()));
    return;
  }
  if (verb === 'download') {
    const [name, dest] = args;
    if (!name) usage(2);
    const r = await call('GET', `/files/${encodeURIComponent(name)}`);
    if (!r.ok) { console.error(`bus-cli: HTTP ${r.status}`); process.exit(1); }
    const out = dest || name;
    fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
    console.log(`saved ${out}`);
    return;
  }
  usage(2);
}

main().catch((e) => { console.error(`bus-cli: ${e.message}`); process.exit(1); });
