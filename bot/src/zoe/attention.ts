/**
 * Attention layer - what ZOE sends on its own, and what it learns from Zaal's taps.
 *
 * Doc 2432 (2026-08-28) set the rule: one interrupt class, one digest at wake
 * time, nothing else. Measured on the VPS 2026-10-09 09:00 UTC, the morning
 * release still went out as 29 messages in one minute, including a 16-part
 * "Held back yesterday (52 items)" dump. This module is the digest half of
 * that rule, plus the feedback loop no ZOE surface had: a record of what Zaal
 * actually taps, so the digest can say which sources he acts on and which he
 * has never touched.
 *
 * Gated by ZOE_ATTENTION=1 (default OFF). With the flag off nothing here runs
 * and every caller keeps its old behaviour.
 *
 * Patterns adapted (MIT, credited per credit-attribution.md):
 *   - openclaw/openclaw docs/gateway/heartbeat.md: "reply NO_REPLY when nothing
 *     needs attention" - progress pings are not sent at all.
 *   - openclaw/openclaw docs/reference/templates/AGENTS.md: stay quiet unless
 *     urgent - only things that need Zaal get their text in the digest; the
 *     rest become counts.
 *   - elizaOS/eliza plugins/plugin-assistant/src/services/followUp.ts:
 *     follow-ups carry a priority and snooze is recorded state (see nudges.ts).
 *   - letta-ai/learning-sdk sleeptime.ts (Apache-2.0): memory consolidation runs
 *     as its own cadence job, not inside a conversation (computeAttention).
 * Status-class items are still HELD, not dropped: Zaal ruled 2026-10-06 "make
 * the status send class hold instead of drop". They are shown as counts.
 */
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { batchFragmentIndexes, renderDeferredBatch, type DeferredSend } from './send-budget';

export function attentionEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_ATTENTION === '1';
}

function zoeHome(): string {
  return process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
}
const tapsFile = () => join(zoeHome(), 'taps.jsonl');
const attentionFile = () => join(zoeHome(), 'attention.json');
const heldLastFile = () => join(zoeHome(), 'held-last.txt');
const sendLogFile = () => join(zoeHome(), 'send-budget-log.jsonl');

/** Telegram's hard limit is 4096; leave room for the chunker's prefix. */
export const DIGEST_MAX_CHARS = 3800;
const WINDOW_DAYS = 7;

// ---------------------------------------------------------------------------
// What a held message is
// ---------------------------------------------------------------------------

export type HeldSource =
  | 'relay'
  | 'handoff'
  | 'board'
  | 'work-done'
  | 'work-failed'
  | 'work-progress'
  | 'repo-improver'
  | 'team-todos'
  | 'shipped'
  | 'vault-copy'
  | 'other';

/** Strip the card decoration ZOE puts on board items ("⚡️ **Title** ..."). */
function plain(text: string): string {
  return text.replace(/^\(\d+\/\d+\) /, '').replace(/^⚡️?\s*/u, '').replace(/\*\*/g, '').trim();
}

/**
 * Classify a held message by its text. The prefixes are the ones measured in
 * the VPS send-budget log on 2026-10-09 (top 30 deferred previews).
 */
export function classifyHeld(text: string): HeldSource {
  const t = plain(text);
  if (/^Relay from /.test(t)) return 'relay';
  if (/^Handoff: /.test(t)) return 'handoff';
  if (/^Work-loop done:/.test(t)) return 'work-done';
  if (/^Work-loop: researching /.test(t)) return 'work-progress';
  if (/^Work-loop( error)?:/.test(t)) return 'work-failed';
  if (/^\[repo-improver\]/.test(t)) return 'repo-improver';
  if (/^Team todos - /.test(t)) return 'team-todos';
  if (/^Shipped today - /.test(t)) return 'shipped';
  if (/^vault copy: /.test(t)) return 'vault-copy';
  if (/^⚡/u.test(text.trim())) return 'board';
  return 'other';
}

const SOURCE_LABEL: Record<HeldSource, string> = {
  relay: 'relays',
  handoff: 'lane handoffs',
  board: 'board items',
  'work-done': 'research results',
  'work-failed': 'work-loop failures',
  'work-progress': 'work-loop progress pings',
  'repo-improver': 'repo-improver notes',
  'team-todos': 'team todo digests',
  shipped: 'shipped-today digests',
  'vault-copy': 'vault-copy warnings',
  other: 'other messages',
};

/** The tap families that answer a source (for the "never answered" line). */
const SOURCE_FAMILIES: Partial<Record<HeldSource, string[]>> = {
  relay: ['relay', 'reply'],
  board: ['bg', 'veto', 'grill'],
  'work-done': ['reply'],
};

function firstLine(text: string, max: number): string {
  const line = plain(text).split('\n')[0] ?? '';
  return line.length > max ? `${line.slice(0, max - 3)}...` : line;
}

function trimTo(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

// ---------------------------------------------------------------------------
// The one-message digest
// ---------------------------------------------------------------------------

export interface AttentionSnapshot {
  at: string;
  windowDays: number;
  /** Taps and replies from Zaal, by family, in the window. */
  taps: Record<string, number>;
  /** Messages ZOE sent or held, by source, in the window. */
  sent: Record<string, number>;
}

/** Engagement used to order sources: taps on the families that answer it. */
function engagement(source: HeldSource, att: AttentionSnapshot | null): number {
  if (!att) return 0;
  return (SOURCE_FAMILIES[source] ?? []).reduce((n, f) => n + (att.taps[f] ?? 0), 0);
}

/**
 * Render everything held since the last batch as ONE message, at most
 * DIGEST_MAX_CHARS. Things that need Zaal keep their text (his own relays,
 * board items, finished research); everything else becomes a count. The full
 * list is still available behind the Show all button (see writeHeldFull).
 */
export function renderHeldDigest(entries: DeferredSend[], att: AttentionSnapshot | null = null): string {
  const frag = batchFragmentIndexes(entries);
  const bySource = new Map<HeldSource, DeferredSend[]>();
  const seen = new Set<string>();
  let total = 0;
  for (const [i, e] of entries.entries()) {
    if (frag.has(i)) continue;
    total += 1;
    const src = classifyHeld(e.text);
    // Identical text is shown once (a handoff re-emitted every ten minutes).
    const key = `${src}\u0000${plain(e.text)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const list = bySource.get(src) ?? [];
    list.push(e);
    bySource.set(src, list);
  }
  const countOf = (s: HeldSource): number =>
    entries.filter((e, i) => !frag.has(i) && classifyHeld(e.text) === s).length;

  const parts: string[] = [`While you were away: ${total} ${total === 1 ? 'message' : 'messages'} held.`];

  const relays = bySource.get('relay') ?? [];
  if (relays.length > 0) {
    parts.push(
      `YOUR RELAYS (${relays.length})\n` +
        relays.slice(0, 3).map((e) => `- ${trimTo(plain(e.text).replace(/\s+/g, ' '), 500)}`).join('\n') +
        (relays.length > 3 ? `\n- and ${relays.length - 3} more` : ''),
    );
  }
  const board = bySource.get('board') ?? [];
  if (board.length > 0) {
    parts.push(
      `BOARD ITEMS (${board.length})\n` +
        board.slice(0, 3).map((e) => `- ${firstLine(e.text, 140)}`).join('\n') +
        (board.length > 3 ? `\n- and ${board.length - 3} more` : ''),
    );
  }
  const done = bySource.get('work-done') ?? [];
  if (done.length > 0) {
    parts.push(`RESULTS (${done.length})\n` + done.slice(0, 3).map((e) => `- ${firstLine(e.text, 200)}`).join('\n'));
  }

  const countable: HeldSource[] = [
    'handoff', 'work-failed', 'work-progress', 'repo-improver', 'team-todos', 'shipped', 'vault-copy', 'other',
  ];
  const counts = countable
    .map((s) => ({ s, n: countOf(s) }))
    .filter((c) => c.n > 0)
    .sort((a, b) => b.n - a.n)
    .map(({ s, n }) => {
      let line = `${n} ${SOURCE_LABEL[s]}`;
      if (s === 'work-failed') {
        const last = (bySource.get(s) ?? []).at(-1);
        if (last) line += ` (last: ${firstLine(last.text, 90)})`;
      }
      return line;
    });
  if (counts.length > 0) parts.push(`ALSO HELD: ${counts.join('; ')}.`);

  const attLine = att ? formatAttentionLine(att) : '';
  if (attLine) parts.push(attLine);
  parts.push('Tap Show all for every held message.');

  let out = parts.join('\n\n');
  if (out.length > DIGEST_MAX_CHARS) {
    out = `${out.slice(0, DIGEST_MAX_CHARS - 40)}...\n\n(trimmed - tap Show all)`;
  }
  return out;
}

export const SHOW_ALL_CALLBACK = 'held:all';

export function showAllKeyboard(): { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } {
  return { inline_keyboard: [[{ text: 'Show all', callback_data: SHOW_ALL_CALLBACK }]] };
}

/** Keep the full held list so the Show all button can send it later. */
export async function writeHeldFull(fullText: string): Promise<void> {
  await fs.mkdir(zoeHome(), { recursive: true });
  await fs.writeFile(heldLastFile(), fullText, 'utf8');
}

export async function readHeldFull(): Promise<string | null> {
  try {
    const t = await fs.readFile(heldLastFile(), 'utf8');
    return t.trim().length > 0 ? t : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Taps - the signal for what Zaal acts on
// ---------------------------------------------------------------------------

/** "bg:yes:123" -> "bg"; relay reply buttons "q:rl-<lane>:..." -> "relay". */
export function tapFamily(data: string): string {
  if (data.startsWith('q:rl-')) return 'relay';
  const i = data.indexOf(':');
  const fam = (i === -1 ? data : data.slice(0, i)).trim();
  return fam.length > 0 && fam.length <= 32 ? fam : 'unknown';
}

/**
 * Every taps.jsonl write goes through this queue, so an append can never land
 * between pruneTaps' read and its rename (which would drop the tap). It covers
 * one process; ZOE runs as exactly one process (agent-loops rule 9), and no
 * other writer touches this file.
 */
let tapsQueue: Promise<unknown> = Promise.resolve();
function withTapsLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = tapsQueue.then(fn, fn);
  tapsQueue = run.catch(() => undefined);
  return run;
}

/** Append one tap. Best-effort: a failed write never blocks the button. */
export async function recordTap(family: string, now: Date = new Date()): Promise<void> {
  await withTapsLock(async () => {
    try {
      await fs.mkdir(zoeHome(), { recursive: true });
      await fs.appendFile(tapsFile(), `${JSON.stringify({ ts: now.toISOString(), family })}\n`, 'utf8');
    } catch (err) {
      console.warn('[zoe/attention] could not record tap:', (err as Error).message);
    }
  });
}

async function readJsonl<T>(file: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const out: T[] = [];
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try {
        out.push(JSON.parse(line) as T);
      } catch {
        // a torn line from a crash mid-append is skipped, not fatal
      }
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * The nightly consolidation: count Zaal's taps by family and ZOE's sends by
 * source over the last seven days, and write attention.json. Reads only files
 * ZOE already writes (taps.jsonl, send-budget-log.jsonl).
 */
export async function computeAttention(now: Date = new Date()): Promise<AttentionSnapshot> {
  try {
    const removed = await pruneTaps(now);
    if (removed > 0) console.log(`[zoe/attention] pruned ${removed} taps older than ${TAPS_KEEP_DAYS} days`);
  } catch (err) {
    console.warn('[zoe/attention] could not prune taps.jsonl:', (err as Error).message);
  }
  const since = now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const taps: Record<string, number> = {};
  for (const t of await readJsonl<{ ts: string; family: string }>(tapsFile())) {
    if (Date.parse(t.ts) >= since) taps[t.family] = (taps[t.family] ?? 0) + 1;
  }
  const sent: Record<string, number> = {};
  for (const r of await readJsonl<{ at: string; outcome: string; preview?: string }>(sendLogFile())) {
    if (Date.parse(r.at) < since || !r.preview) continue;
    const src = classifyHeld(r.preview);
    sent[src] = (sent[src] ?? 0) + 1;
  }
  const snap: AttentionSnapshot = { at: now.toISOString(), windowDays: WINDOW_DAYS, taps, sent };
  try {
    await fs.mkdir(zoeHome(), { recursive: true });
    await fs.writeFile(attentionFile(), JSON.stringify(snap, null, 2), 'utf8');
  } catch (err) {
    console.warn('[zoe/attention] could not write attention.json:', (err as Error).message);
  }
  return snap;
}

export async function readAttention(): Promise<AttentionSnapshot | null> {
  try {
    return JSON.parse(await fs.readFile(attentionFile(), 'utf8')) as AttentionSnapshot;
  } catch {
    return null;
  }
}

/**
 * One line Zaal can act on: what he tapped this week, and the loudest sources
 * he never answered. Empty when there is no data yet, so a fresh install says
 * nothing rather than "you tapped nothing".
 */
export function formatAttentionLine(att: AttentionSnapshot): string {
  const tapped = Object.entries(att.taps)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([f, n]) => `${f} ${n}`);
  const silent = (Object.entries(att.sent) as Array<[HeldSource, number]>)
    .filter(([s]) => engagement(s, att) === 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s, n]) => `${SOURCE_LABEL[s] ?? s} ${n}`);
  if (tapped.length === 0 && silent.length === 0) return '';
  const bits: string[] = [];
  if (tapped.length > 0) bits.push(`you tapped ${tapped.join(', ')}`);
  if (silent.length > 0) bits.push(`never answered: ${silent.join(', ')}`);
  return `Last ${att.windowDays} days: ${bits.join('; ')}.`;
}

// ---------------------------------------------------------------------------
// Entry points used by index.ts and scheduler.ts (kept here so they are
// tested without importing the bot entrypoint - agent-loops rule 21)
// ---------------------------------------------------------------------------

/** What the Show all button answers, and the text to send (null: nothing kept). */
export async function showAllAction(): Promise<{ answer: string; full: string | null }> {
  const full = await readHeldFull();
  return { answer: full ? 'Sending the full list.' : 'Nothing kept.', full };
}

export interface MorningBatch {
  text: string;
  opts?: { replyMarkup: ReturnType<typeof showAllKeyboard> };
  /** true when the one-message digest was used, false for the full batch */
  digest: boolean;
}

/**
 * The morning release body. Flag off: the full batch, exactly as before.
 * Flag on: keep the full batch for Show all, then render the one-message
 * digest. If keeping the full list fails, send the full batch instead, so a
 * Show all button never points at nothing.
 */
export async function prepareMorningBatch(
  held: DeferredSend[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<MorningBatch> {
  const full = renderDeferredBatch(held);
  if (!attentionEnabled(env)) return { text: full, digest: false };
  try {
    await writeHeldFull(full);
  } catch (err) {
    console.warn('[zoe/attention] could not keep the full held list, sending it whole:', (err as Error).message);
    return { text: full, digest: false };
  }
  return { text: renderHeldDigest(held, await readAttention()), opts: { replyMarkup: showAllKeyboard() }, digest: true };
}

export const TAPS_KEEP_DAYS = 30;

/**
 * Bound taps.jsonl: keep the last TAPS_KEEP_DAYS days. Called by the nightly
 * consolidation, so the file holds about a month of taps rather than growing
 * forever. Torn lines are dropped. Returns how many lines were removed.
 */
export async function pruneTaps(now: Date = new Date(), keepDays: number = TAPS_KEEP_DAYS): Promise<number> {
  return withTapsLock(() => pruneTapsUnlocked(now, keepDays));
}

async function pruneTapsUnlocked(now: Date, keepDays: number): Promise<number> {
  const since = now.getTime() - keepDays * 24 * 60 * 60 * 1000;
  let raw: string;
  try {
    raw = await fs.readFile(tapsFile(), 'utf8');
  } catch {
    return 0;
  }
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  const kept = lines.filter((l) => {
    try {
      return Date.parse((JSON.parse(l) as { ts: string }).ts) >= since;
    } catch {
      return false;
    }
  });
  if (kept.length === lines.length) return 0;
  // Write a temp file and rename it over the original: a crash mid-write leaves
  // the old taps.jsonl intact instead of a truncated one. rename is atomic on
  // the same filesystem, and the temp file sits beside the original.
  const tmp = `${tapsFile()}.tmp`;
  await fs.writeFile(tmp, kept.length ? `${kept.join('\n')}\n` : '', 'utf8');
  await fs.rename(tmp, tapsFile());
  return lines.length - kept.length;
}
