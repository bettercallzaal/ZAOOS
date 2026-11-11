/**
 * zoe-golden-eval.ts - run the concierge golden set against a real model and
 * print ZOE's score (concierge-golden.ts, golden-eval.ts, doc 1020).
 *
 * Run by hand on a box where the claude CLI is installed and logged in:
 *
 *   npx tsx bot/scripts/zoe-golden-eval.ts            # model haiku
 *   ZOE_GOLDEN_MODEL=sonnet npx tsx bot/scripts/zoe-golden-eval.ts
 *
 * Every case is a TALK-ONLY turn (toolPolicy 'none'): no tools, no MCP, an
 * empty working directory, and the ops ZOE returns are never applied. It reads
 * no working memory and writes nothing to the board. The persona is the box's
 * ~/.zao/zoe/persona.md (readPersona), so on the VPS this scores the LIVE
 * persona. On a box without one, readPersona's ensureZoeHome seeds ~/.zao/zoe
 * from the repo defaults first: run it on the VPS.
 * Cost: one model call per case (10 today).
 *
 * Output: the report on stdout, and the full JSON (with each reply) at
 * ~/.zao/zoe/golden/<UTC timestamp>.json.
 * Exit 0 = every case passed. 1 = at least one failed. 2 = no case could run
 * (every case threw: the CLI is missing or logged out), so there is no score.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { runConciergeTurn } from '../src/zoe/concierge';
import { CONCIERGE_GOLDEN_SET, GOLDEN_CURRENT_DATE, caseForInput } from '../src/zoe/concierge-golden';
import { formatGoldenReport, runGoldenSet } from '../src/zoe/golden-eval';
import { readPersona } from '../src/zoe/memory';

const model = process.env.ZOE_GOLDEN_MODEL || 'haiku';
const replies: Record<string, string> = {};
let persona = '';

async function run(input: string): Promise<string> {
  const c = caseForInput(input);
  if (!c) throw new Error(`no golden case for input: ${input.slice(0, 60)}`);
  const result = await runConciergeTurn({
    message: c.input,
    senderLabel: c.sender,
    model,
    toolPolicy: 'none',
    blocks: {
      persona,
      human: 'Zaal Panthaki founded The ZAO, a web3 music community.',
      working: '',
      tasks: '',
      quests: '',
      chat_scope: c.scope,
      chat_title: c.scope === 'private' ? undefined : 'ZAO Golden Eval',
    },
    context: { zaal_tg_id: 0, workspace_dir: tmpdir(), current_date: GOLDEN_CURRENT_DATE },
  });
  replies[c.id] = result.reply;
  return result.reply;
}

async function main(): Promise<void> {
  persona = await readPersona();
  const report = await runGoldenSet(CONCIERGE_GOLDEN_SET, run);
  console.log(`model: ${model}`);
  console.log(formatGoldenReport(report));

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = join(homedir(), '.zao', 'zoe', 'golden');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${stamp}.json`);
  writeFileSync(path, JSON.stringify({ model, ranAt: new Date().toISOString(), report, replies }, null, 2));
  console.log(`full report: ${path}`);

  const threw = report.results.filter((r) => r.failures.some((f) => f.startsWith('runner threw'))).length;
  if (threw === report.total) {
    console.error('NO SCORE: every case threw (claude CLI missing or logged out?)');
    process.exit(2);
  }
  process.exit(report.failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('zoe-golden-eval crashed:', (e as Error)?.message);
  process.exit(2);
});
