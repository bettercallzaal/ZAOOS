/**
 * Executable proof for the Phase 4 verify endpoint (app vitest broken):
 * invokes the route handlers DIRECTLY with real fixture data - the
 * DreamNet-generated cross-runtime vectors - and asserts accept/reject
 * behavior. Exit 1 on any failure.
 *
 * Run: npx tsx scripts/spore-verify-endpoint-check.ts
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NextRequest } from 'next/server';
import { POST, GET } from '../src/app/api/spore/verify/route';
import { createObservation } from '../src/lib/eyes';
import { observationToSpore } from '../src/lib/spore/spore';
import { sporeToReceipt } from '../src/lib/spore/receipt';

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean) {
  if (ok) {
    pass++;
    console.log(`PASS  ${name}`);
  } else {
    fail++;
    console.error(`FAIL  ${name}`);
  }
}

function post(body: unknown): Promise<Response> {
  return POST(
    new NextRequest('http://localhost/api/spore/verify', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }),
  );
}

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const vectors = JSON.parse(
    readFileSync(join(here, '..', 'src', 'lib', 'spore', '__tests__', 'fixtures', 'cross-runtime-vectors.json'), 'utf8'),
  );

  // GET discovery
  const g = await GET();
  const gBody = await g.json();
  check('GET returns conformance status', gBody?.data?.conformance?.status?.includes('47/47') === true);

  // DreamNet-issued receipt.v1 verifies (with subject)
  let r = await post({ kind: 'receipt.v1', receipt: vectors.dreamnetReceipt, subject: vectors.dreamnetReceiptSubject });
  let b = await r.json();
  check('SDK receipt.v1 + subject -> valid', r.status === 200 && b.data?.isValid === true);

  // Tampered digest rejected
  r = await post({ kind: 'receipt.v1', receipt: { ...vectors.dreamnetReceipt, digest: 'f'.repeat(64) }, subject: vectors.dreamnetReceiptSubject });
  b = await r.json();
  check('tampered digest -> invalid', b.data?.isValid === false);

  // DreamNet proof-artifact verifies
  r = await post({ kind: 'proof-artifact.v1', artifact: vectors.dreamnetArtifact });
  b = await r.json();
  check('SDK proof-artifact.v1 -> valid', b.data?.isValid === true);

  // ZAO envelope: mint a real one and verify
  const obs = createObservation(
    {
      sensor: 'sensor:endpoint-check',
      kind: 'market.price',
      subjectKey: 'asset:ETH-USD',
      payload: { price: 3000 },
      confidence: 1,
      provenance: { method: 'api' },
      health: { status: 'healthy', latencyMs: 1, errorRate: 0, lastOkAt: null, consecutiveFailures: 0 },
    },
    { observerId: 'observer:endpoint-check', now: '2026-07-30T06:00:00.000Z' },
  );
  const receipt = sporeToReceipt(observationToSpore(obs), 'organism:zao:main', { now: '2026-07-30T06:00:00.000Z' });
  r = await post({ kind: 'zao.receipt', receipt });
  b = await r.json();
  check('ZAO envelope -> valid', b.data?.isValid === true);

  // Tampered ZAO payload rejected
  const forged = { ...receipt, spore: { ...receipt.spore, payload: { price: 1 } } };
  r = await post({ kind: 'zao.receipt', receipt: forged });
  b = await r.json();
  check('tampered ZAO payload -> invalid', b.data?.isValid === false);

  // Unknown kind fails closed at the schema gate
  r = await post({ kind: 'receipt.v2', receipt: {} });
  check('unknown kind -> 400', r.status === 400);

  // Garbage JSON -> 400
  const rawBad = await POST(
    new NextRequest('http://localhost/api/spore/verify', { method: 'POST', body: '{not json', headers: { 'content-type': 'application/json' } }),
  );
  check('invalid JSON -> 400', rawBad.status === 400);

  // Oversize body -> 413
  const big = await POST(
    new NextRequest('http://localhost/api/spore/verify', {
      method: 'POST',
      body: JSON.stringify({ kind: 'receipt.v1', receipt: { pad: 'x'.repeat(300_000) } }),
      headers: { 'content-type': 'application/json' },
    }),
  );
  check('oversize body -> 413', big.status === 413);

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((e: unknown) => {
  console.error('FATAL:', e instanceof Error ? e.message : String(e));
  process.exit(1);
});
