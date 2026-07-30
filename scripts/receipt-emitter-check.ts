/**
 * Executable proof for the live receipt path (app vitest is broken - rolldown
 * binding - so this runner is the gate): assemble the REAL organism with a
 * deterministic offline spike, run ticks, assert every distributed observation
 * emitted a verifiable Phase 3-conformant receipt. Exit 1 on any failure.
 *
 * Run: npx tsx scripts/receipt-emitter-check.ts
 */
import { assembleOrganism } from '../src/lib/organism';
import { createObservation } from '../src/lib/eyes';
import type { VacuumSpike } from '../src/lib/bloodstream';
import { verifyReceipt } from '../src/lib/spore/receipt';
import { toDreamNetReceipt, verifyDreamNetReceipt } from '../src/lib/spore/interop';

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

const NOW = '2026-07-30T05:00:00.000Z';
let tick = 0;
const spike: VacuumSpike = {
  manifest: { spikeId: 'spike:offline', version: '1', riskTier: 'passive', strategy: 'poll', pollIntervalMs: 1, produces: ['market.price'] },
  ingest: async (ctx) => ({
    observations: [
      createObservation(
        {
          sensor: 'spike:offline',
          kind: 'market.price',
          subjectKey: 'asset:ETH-USD',
          payload: { price: 3000 + tick }, // changes per tick -> not deduped
          confidence: 1,
          provenance: { method: 'api' },
          health: { status: 'healthy', latencyMs: 1, errorRate: 0, lastOkAt: null, consecutiveFailures: 0 },
        },
        { observerId: ctx.observerId, now: NOW },
      ),
    ],
  }),
};

const sunk: string[] = [];
const organism = assembleOrganism({
  now: () => NOW,
  spike,
  receiptIssuer: 'organism:zao:main',
  onReceipt: (r) => {
    sunk.push(r.receiptId);
  },
});

async function main() {
const t1 = await organism.runTick();
tick++;
const t2 = await organism.runTick();

check('tick 1 distributed', t1.circulated[0]?.distributed === 1);
check('tick 2 distributed (changed payload)', t2.circulated[0]?.distributed === 1);

const receipts = organism.receipts.recent();
check('2 receipts emitted', receipts.length === 2);
check('sink received both', sunk.length === 2);
for (const r of receipts) {
  check(`receipt ${r.receiptId.slice(0, 8)} self-verifies`, verifyReceipt(r));
  const dn = toDreamNetReceipt(r);
  check(
    `receipt ${r.receiptId.slice(0, 8)} verifies as SDK receipt.v1`,
    verifyDreamNetReceipt(dn, { kind: r.spore.kind, subjectKey: r.spore.subjectKey, payload: r.spore.payload }).isValid,
  );
}
const snap = organism.snapshot();
const receiptsOrgan = snap.organs.find((o: { organId: string }) => o.organId === 'receipts');
check('receipts organ registered + healthy', receiptsOrgan?.status === 'healthy');
check('emitted metric = 2', organism.receipts.metrics().emitted === 2);

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
}

main().catch((e: unknown) => {
  console.error('FATAL:', e instanceof Error ? e.message : String(e));
  process.exit(1);
});
