/**
 * capability-gaps.ts - ZOE notes what she could not do, and once a week turns
 * the most-asked one into an upgrade check.
 *
 * Zaal, 2026-10-11: "have it find ways to improve itself thats the most
 * important improvement we can do".
 *
 * ZOE already improves from three signals: her own code errors (own-errors.ts
 * into error-remediation.ts), her workers' run telemetry (learn.ts), and repos
 * Zaal sends her (self-upgrade.ts). None of them hears the plainest signal
 * there is: Zaal asked for something and she had no way to do it. That moment
 * ended in the chat and nothing kept it.
 *
 * HOW IT WORKS
 * 1. With ZOE_GAP_LOG=1 the main DM turn asks concierge.ts for one extra prompt
 *    block (the `gapLog` option; no other turn sets it): when you
 *    have no ability to do what was asked, answer normally and end with a line
 *    `GAP: <what he wanted>`.
 * 2. index.ts takes that line off the reply before Zaal sees it and appends
 *    it to ~/.zao/zoe/capability-gaps.jsonl.
 * 3. Sunday, scheduler.ts groups the week's lines by meaning-bearing words and
 *    sends Zaal the top few with counts (a status message, not a question).
 * 4. With ZOE_GAP_UPGRADE=1 as well, the single most-asked gap that was asked
 *    at least MIN_ASKS_FOR_UPGRADE times is queued as ONE work-loop item: a
 *    fit check against our live code that says EXTEND a named file, build NEW,
 *    or SKIP. That lands as a research doc and PR like any work-loop item. It
 *    never writes code.
 *
 * Both flags default OFF, so merging this changes nothing until one is set.
 *
 * WHAT IS KEPT. The model's own short paraphrase of the want, cut to
 * MAX_WANT_CHARS and passed through redactPii, with a timestamp. Never the
 * message text. The file lives beside ZOE's other state in ZOE_HOME.
 *
 * Everything but appendGap and readGaps is pure.
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from './memory';
import { redactPii } from './pii';

export const MAX_WANT_CHARS = 160;
export const MIN_ASKS_FOR_UPGRADE = 2;
export const DIGEST_TOP = 5;
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** How much two wants must share to count as the same gap. */
const SAME_GAP = 0.5;

export function gapLogEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_GAP_LOG === '1';
}

/** Queueing an upgrade check needs the log on too: no log, nothing to queue. */
export function gapUpgradeEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return gapLogEnabled(env) && env.ZOE_GAP_UPGRADE === '1';
}

export const gapsPath = (): string => join(ZOE_PATHS.home, 'capability-gaps.jsonl');

/** The lines added to the DM system prompt when the log is on. */
export const GAP_PROMPT_BLOCK: readonly string[] = [
  `<capability_gap>`,
  `When Zaal asks you to DO something and you have no tool or ability for it (for example: speak a reply aloud, set a reminder for a clock time, send an email, add a calendar event), answer him as you normally would, then end your reply with one final line in exactly this form:`,
  `GAP: <what he wanted, in 12 words or fewer, no names of people>`,
  `Only for a missing ability. Not when you refuse, not when you lack a fact, not when something errored, not when you did the thing. At most one GAP line per reply. He never sees this line; it is how you get better.`,
  `</capability_gap>`,
  ``,
];

export interface GapExtract {
  /** The reply with any GAP line taken off. */
  reply: string;
  /** The want, cleaned, or null when the reply had no GAP line. */
  gap: string | null;
}

const GAP_LINE = /^\s*GAP:\s*(.*)$/;

/**
 * Take every `GAP:` line off a reply and return the first non-empty want.
 * A reply that was nothing but a GAP line keeps a short honest sentence, so
 * Zaal is never sent an empty message.
 */
export function extractGap(reply: string): GapExtract {
  const kept: string[] = [];
  let gap: string | null = null;
  for (const line of reply.split('\n')) {
    const m = GAP_LINE.exec(line);
    if (!m) {
      kept.push(line);
      continue;
    }
    const want = cleanWant(m[1]);
    if (gap === null && want) gap = want;
  }
  if (kept.length === reply.split('\n').length) return { reply, gap: null };
  const text = kept.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
  return { reply: text.trim() ? text : 'I cannot do that yet. I have noted it.', gap };
}

/** One line, redacted, bounded. Empty when nothing usable is left. */
export function cleanWant(raw: string): string {
  const oneLine = raw.replace(/[<>`]/g, '').replace(/\s+/g, ' ').trim();
  return redactPii(oneLine).slice(0, MAX_WANT_CHARS).trim();
}

export interface GapRow {
  ts: string;
  want: string;
}

const STOP = new Set([
  'a', 'an', 'the', 'to', 'for', 'of', 'in', 'on', 'at', 'and', 'or', 'with', 'by', 'from', 'me', 'my', 'him',
  'his', 'he', 'zaal', 'zoe', 'it', 'this', 'that', 'be', 'is', 'as', 'out', 'up', 'some', 'something', 'wanted',
  'want', 'wants', 'asked', 'ask', 'able', 'can', 'could', 'please',
]);

/** The meaning-bearing words of a want, lowercased, crudely stemmed. */
export function gapWords(want: string): Set<string> {
  const out = new Set<string>();
  for (const w of want.toLowerCase().split(/[^a-z0-9]+/)) {
    if (w.length < 3 || STOP.has(w)) continue;
    out.add(w.replace(/(ing|ed|es|s)$/, '') || w);
  }
  return out;
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / Math.min(a.size, b.size);
}

export interface GapGroup {
  /** The first wording seen, used as the group's label. */
  want: string;
  count: number;
  lastTs: string;
}

/**
 * Group rows inside the window ending at `now`, most-asked first. Rows with an
 * unreadable timestamp or no usable words are left out, never guessed at.
 */
export function summarizeGaps(rows: GapRow[], now: Date, windowMs: number = WEEK_MS): GapGroup[] {
  const groups: Array<GapGroup & { words: Set<string> }> = [];
  for (const row of rows) {
    const t = Date.parse(row.ts);
    if (!Number.isFinite(t) || t > now.getTime() || now.getTime() - t > windowMs) continue;
    const words = gapWords(row.want);
    if (words.size === 0) continue;
    const hit = groups.find((g) => overlap(g.words, words) >= SAME_GAP);
    if (hit) {
      hit.count++;
      if (row.ts > hit.lastTs) hit.lastTs = row.ts;
    } else {
      groups.push({ want: row.want, count: 1, lastTs: row.ts, words });
    }
  }
  return groups
    .sort((a, b) => b.count - a.count || (a.lastTs < b.lastTs ? 1 : -1))
    .map(({ want, count, lastTs }) => ({ want, count, lastTs }));
}

/** The one gap worth an upgrade check this week, or null. */
export function pickUpgrade(groups: GapGroup[], minAsks: number = MIN_ASKS_FOR_UPGRADE): GapGroup | null {
  const top = groups[0];
  return top && top.count >= minAsks ? top : null;
}

/** The weekly status message. Empty string when there is nothing to say. */
export function formatGapDigest(groups: GapGroup[], queued: GapGroup | null): string {
  if (groups.length === 0) return '';
  const lines = groups
    .slice(0, DIGEST_TOP)
    .map((g, i) => `${i + 1}. ${g.want} (${g.count === 1 ? 'once' : `${g.count} times`})`);
  const more = groups.length > DIGEST_TOP ? `\nAnd ${groups.length - DIGEST_TOP} more.` : '';
  const tail = queued
    ? `\n\nI queued an upgrade check for number 1. It will read our code and say whether to extend something we have, build new, or skip. It writes no code.`
    : '';
  return `Things you asked me for this week that I could not do:\n${lines.join('\n')}${more}${tail}`;
}

/**
 * The work-loop goal for one gap. Same shape of answer as the self-upgrade fit
 * check (self-upgrade.ts buildFitCheckGoal), aimed at a want and not a repo.
 */
export function buildGapGoal(group: GapGroup): string {
  return `CAPABILITY GAP FIT CHECK
Zaal asked ZOE ${group.count} times in the last week for something she could not do. In her own words: "${group.want}"

Goal: say what it would take for ZOE (bot/src/zoe in bettercallzaal/ZAOOS) to do this, grounded in OUR live code.

Do, in order:
1. Search OUR code first, with synonyms: gh search code "<term>" --owner=bettercallzaal --owner=ZAODEVZ, and read the matching files at origin/main (gh api, not a local clone). It is common that most of the ability already exists and only the last step is missing; name the file if so.
2. Look for how others built it: at most 3 open-source projects, each with its LICENSE FILE read (gh api repos/<owner>/<repo>/contents/LICENSE), never the API licence field.
3. Give one verdict: EXTEND <exact file we already have>, NEW (nothing of ours does it; say what you searched), or SKIP (why it should not be built).

REAL FETCHES ONLY. Every claim cites a file:line or a URL you fetched in this run; anything you could not fetch is marked UNVERIFIED. Do not write or change any code. Nothing outbound.

Output must include, in this order:
## Fit check
| What is needed | Verdict (EXTEND <file> / NEW / SKIP) | Evidence (file:line or URL) |
## Credit
Any project a build would borrow from: repo, author, licence as read from the LICENSE file.
## Proposed build
For EXTEND or NEW: the files a build would touch and the flag it would sit behind (default OFF). Anything that sends, spends or posts is listed as "needs Zaal's ruling".`;
}

/** Append one gap. Returns false, and writes nothing, when the want is empty. */
export async function appendGap(want: string, now: Date = new Date(), path: string = gapsPath()): Promise<boolean> {
  const clean = cleanWant(want);
  if (!clean) return false;
  const row: GapRow = { ts: now.toISOString(), want: clean };
  await fs.mkdir(join(path, '..'), { recursive: true });
  await fs.appendFile(path, `${JSON.stringify(row)}\n`);
  return true;
}

/**
 * Read the log. A missing file is an empty log. A line that does not parse is
 * skipped and counted, so a damaged file is visible in the caller's log line.
 */
export async function readGaps(path: string = gapsPath()): Promise<{ rows: GapRow[]; skipped: number }> {
  let text: string;
  try {
    text = await fs.readFile(path, 'utf8');
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { rows: [], skipped: 0 };
    throw error;
  }
  const rows: GapRow[] = [];
  let skipped = 0;
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      const v = JSON.parse(line) as Partial<GapRow>;
      if (typeof v.ts === 'string' && typeof v.want === 'string') rows.push({ ts: v.ts, want: v.want });
      else skipped++;
    } catch {
      skipped++;
    }
  }
  return { rows, skipped };
}
