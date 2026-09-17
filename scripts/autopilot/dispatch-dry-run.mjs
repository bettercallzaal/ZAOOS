#!/usr/bin/env node
/**
 * dispatch-dry-run - which `route: agent` cards WOULD a dispatcher take, and
 * what WOULD it do to each? It prints the answer and does nothing else.
 *
 * Antigravity's review (2026-09-17) proposed a dispatcher that spawns headless
 * agents against the todo cards whose metadata says route=agent (151 on that
 * day, count measured). The antigravity-automation brief puts it last and puts
 * a dry run first: a dispatcher that takes 151 cards and gets 20 wrong is worse
 * than 151 cards sitting still. Zaal reviews this output before any card is
 * claimed.
 *
 * NO WRITES, STRUCTURALLY. The only network function is getJson, which issues
 * GET and nothing else; there is no PATCH, POST or claim path in this file to
 * switch on. The service key reaches curl on stdin (-K -), never in argv where
 * `ps` would show it.
 *
 * A card is taken only if EVERY check passes. The checks are the CHECKS table,
 * in order, and the first failure is the reason printed. They are deliberately
 * strict: a skipped card costs nothing, a wrongly taken one costs a bad PR or
 * an action that was Zaal's.
 *
 *   node scripts/autopilot/dispatch-dry-run.mjs                 # live board, read-only
 *   node scripts/autopilot/dispatch-dry-run.mjs --cards FILE    # a saved JSON array of rows
 *   node scripts/autopilot/dispatch-dry-run.mjs --json          # machine-readable
 *
 * Env for the live board: SUPABASE_URL, SUPABASE_SERVICE_KEY (the cowork
 * tracker, as zao-tracker reads them from ~/.zao/zao.env).
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const meta = (card) => card.metadata ?? {};
const body = (card) => `${card.title ?? ''}\n${card.notes ?? ''}`;

/**
 * Words that mean the card's own action is a one-way door (DOCTRINE escalation
 * classes). Matched on title and notes. A hit is a skip for Zaal, not a take.
 */
export const ONE_WAY_WORDS =
  /\b(post|posts|posting|tweet|cast|publish|send|sends|email|emails|dm|dms|pay|payment|invoice|transfer|mint|deploy|migrate|migration|delete|remove|rotate|secret|password|sign|signs|contract|announce)\b/i;

/** Ordered readiness checks. Each returns null (pass) or the reason it fails. */
export const CHECKS = [
  ['not-archived', (c) => (c.archived_at ? `archived ${String(c.archived_at).slice(0, 10)} (${meta(c).archived_reason ?? 'no reason'}) but still todo` : null)],
  ['agent-owned', (c) => (meta(c).next_owner === 'agent' ? null : `next_owner is ${JSON.stringify(meta(c).next_owner ?? null)}, not "agent"`)],
  ['has-repo', (c) => (typeof meta(c).repo === 'string' && /^[\w.-]+\/[\w.-]+$/.test(meta(c).repo) ? null : 'no target repo in metadata.repo')],
  ['has-done-when', (c) => (meta(c).done_when || /\b(done when|acceptance)\b/i.test(c.notes ?? '') ? null : 'no done_when or acceptance line: nothing to prove the work against')],
  ['has-brief', (c) => ((c.notes ?? '').trim().length >= 80 ? null : `notes are ${(c.notes ?? '').trim().length} chars: not a brief`)],
  ['no-one-way-door', (c) => {
    const m = body(c).match(ONE_WAY_WORDS);
    return m ? `one-way door language ("${m[0]}"): Zaal's, not an agent's` : null;
  }],
];

/** What the dispatcher would do to a card it takes. Printed, never executed. */
export function plannedAction(card) {
  const repo = meta(card).repo;
  return [
    `claim: PATCH tasks id=${card.id} status todo -> in_progress, note "[dispatch] claimed"`,
    `spawn: headless claude in a fresh worktree of ${repo}, branch agent/card-${card.legacy_id ?? card.id}`,
    'brief: the card title, notes and done_when, plus autopilot rules; door-check before every action',
    `finish: open a PR against ${repo} main, then zao-tracker ready ${card.legacy_id ?? card.id} --pr <url>`,
  ];
}

/** Pure: assess one card. */
export function assess(card) {
  const failures = CHECKS.map(([id, check]) => ({ id, reason: check(card) })).filter((f) => f.reason);
  if (failures.length > 0) return { take: false, check: failures[0].id, reason: failures[0].reason, failures };
  return { take: true, check: null, reason: 'every check passed', failures, action: plannedAction(card) };
}

/** Pure: assess every card and count skips by the check that stopped them. */
export function dryRun(cards) {
  const rows = cards.map((card) => ({ card, ...assess(card) }));
  const byCheck = {};
  const failing = {};
  for (const r of rows) {
    if (!r.take) byCheck[r.check] = (byCheck[r.check] ?? 0) + 1;
    for (const f of r.failures) failing[f.id] = (failing[f.id] ?? 0) + 1;
  }
  return { total: cards.length, take: rows.filter((r) => r.take).length, byCheck, failing, rows };
}

export function render(result) {
  const out = [];
  out.push(`DRY RUN - nothing was claimed, written or spawned. ${result.total} route:agent todo cards read.`);
  out.push(`WOULD TAKE ${result.take}. WOULD SKIP ${result.total - result.take}.`);
  out.push('');
  out.push('Per check: stopped here first / fail it at all');
  for (const [id] of CHECKS) out.push(`  ${String(result.byCheck[id] ?? 0).padStart(4)} / ${String(result.failing[id] ?? 0).padStart(4)}  ${id}`);
  const near = result.rows.filter((x) => !x.take && x.failures.length === 1);
  out.push('');
  out.push(`Near misses - one check from being taken: ${near.length}`);
  for (const r of near) out.push(`  #${r.card.legacy_id ?? '-'} [${r.check}] ${r.card.title}`);
  out.push('');
  for (const r of result.rows.filter((x) => x.take)) {
    out.push(`TAKE  #${r.card.legacy_id ?? '-'} ${r.card.title}`);
    for (const step of r.action) out.push(`        ${step}`);
  }
  for (const r of result.rows.filter((x) => !x.take)) {
    out.push(`SKIP  #${r.card.legacy_id ?? '-'} [${r.failures.map((f) => f.id).join(', ')}] ${r.reason} | ${r.card.title}`);
  }
  return `${out.join('\n')}\n`;
}

/** GET only. The key goes to curl on stdin, never in argv. */
export function getJson(url, key, run = spawnSync) {
  const config = `header = "apikey: ${key}"\nheader = "Authorization: Bearer ${key}"\n`;
  const res = run('curl', ['-sS', '--fail', '--max-time', '25', '--connect-timeout', '8', '-X', 'GET', '-K', '-', url], {
    input: config,
    encoding: 'utf8',
  });
  if (res.status !== 0) throw new Error(`GET failed (curl exit ${res.status}): ${String(res.stderr).trim().slice(0, 200)}`);
  return JSON.parse(res.stdout);
}

export const CARDS_QUERY =
  '/rest/v1/tasks?select=id,legacy_id,title,notes,metadata,archived_at,updated_at&status=eq.todo&metadata->>route=eq.agent&order=legacy_id.asc&limit=1000';

export function main(argv, env = process.env) {
  const json = argv.includes('--json');
  const i = argv.indexOf('--cards');
  let cards;
  try {
    if (i !== -1) {
      cards = JSON.parse(readFileSync(argv[i + 1], 'utf8'));
    } else {
      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set (or pass --cards FILE)');
      cards = getJson(`${env.SUPABASE_URL}${CARDS_QUERY}`, env.SUPABASE_SERVICE_KEY);
    }
    if (!Array.isArray(cards)) throw new Error('expected a JSON array of task rows');
  } catch (err) {
    process.stderr.write(`dispatch-dry-run: ${err.message}\n`);
    return 2;
  }
  const result = dryRun(cards);
  process.stdout.write(json ? `${JSON.stringify({ ...result, rows: result.rows.map(({ card, ...r }) => ({ id: card.id, legacy_id: card.legacy_id, title: card.title, ...r })) }, null, 2)}\n` : render(result));
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = main(process.argv.slice(2));
}
