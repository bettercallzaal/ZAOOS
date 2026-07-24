/**
 * organism-demo - run the first living end-to-end flow against the REAL world.
 *
 *   npx tsx scripts/organism-demo.ts
 *
 * Pulls a live ETH-USD spot price from Coinbase (public, no auth), circulates it
 * through the Bloodstream into Memory, and prints the Control Plane snapshot so
 * you can see the organs registered and healthy. Runs two ticks: the second
 * proves the cache dedups an unchanged value. Read-only; nothing is written
 * anywhere but in-process memory. This is the proof the contracts RUN.
 */

import { assembleOrganism } from '../src/lib/organism';

async function main(): Promise<void> {
  const org = assembleOrganism(); // default: real Coinbase ETH-USD spike

  console.log('== organism boot ==');
  console.log('organs registered:', org.snapshot().organs.map((o) => `${o.organId}(${o.layer})`).join(', '));

  for (let tick = 1; tick <= 2; tick++) {
    const r = await org.runTick();
    const c = r.circulated[0];
    const price = org.memory.recall({ kind: 'market.price' }, 'working')[0];
    console.log(`\n== tick ${tick} ==`);
    console.log(`  circulate: ok=${c.ok} ingested=${c.ingested} distributed=${c.distributed} deduped=${c.deduped}`);
    console.log(`  memory:    stored=${r.stored} working=${r.workingSize}`);
    if (price) console.log(`  latest:    ${JSON.stringify(price.payload)} (source ${price.source})`);
    const s = r.snapshot;
    console.log(`  control plane: ${s.healthy}/${s.total} healthy, ${s.capabilities} capabilities`);
    for (const o of s.organs) console.log(`     - ${o.organId} [${o.layer}] ${o.status} v${o.version}`);
  }

  console.log('\n== done - a real observation flowed spike -> bloodstream -> memory, visible in the control plane ==');
}

main().catch((e) => {
  console.error('organism-demo failed:', e);
  process.exit(1);
});
