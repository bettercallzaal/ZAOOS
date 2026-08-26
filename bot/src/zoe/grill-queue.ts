/**
 * grill-queue.ts - the grill's second destination.
 *
 * WHY
 * Zaal, 2026-08-26, on a grill that had sent ~190 cards a day since the 24th
 * and recorded zero answers: make it a daily digest, and route every card into
 * the orchestrator grill lane instead of only Telegram.
 *
 * Telegram-only meant a card had exactly one reader, and that reader is the
 * bottleneck for every lane in the estate. The grill lane can already clear
 * the reversible ones under his standing rule:
 *
 *   "you should be knocking those out unless you have an issue."
 *
 * A card that reaches GRILL-QUEUE.md can be worked while he sleeps. A card
 * that only reaches his DM waits for a thumb, and 190 a day proved what that
 * is worth.
 *
 * WHERE IT LANDS, AND THE PROBLEM WITH THAT
 * The queue file lives in the vault at ~/zao-vault/handoffs/GRILL-QUEUE.md.
 * The vault is on the mac. THE BOT RUNS ON THE VPS, which has no vault and no
 * mount of one - checked 2026-08-26, /home/zaal/zao-vault does not exist.
 *
 * So writing the file unconditionally would either fail every time or, worse,
 * succeed into a freshly-created directory nobody reads, and the feature would
 * look shipped while every card fell on the floor. Instead: append when the
 * handoffs directory ALREADY exists (the mac), and spool to a JSONL next to
 * the grill state when it does not (the VPS), for `zao-grill-queue-drain` on
 * the mac to pull in later. Nothing is invented and no card is lost either
 * way, and the return value says which of the two happened so the caller can
 * log it rather than assume.
 */

import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

export interface GrillQueueCard {
  taskId: string;
  title: string;
  /** First line of the card's notes - the "why", when the board has one. */
  why?: string;
  createdAt?: string;
}

export interface GrillQueueResult {
  wrote: 'queue' | 'spool' | 'nothing';
  path: string;
  count: number;
  /** Item numbers assigned, so the caller can log what it added. */
  numbers: number[];
}

export function queuePath(): string {
  return (
    process.env.ZOE_GRILL_QUEUE_PATH ||
    join(homedir(), 'zao-vault', 'handoffs', 'GRILL-QUEUE.md')
  );
}

export function spoolPath(): string {
  return (
    process.env.ZOE_GRILL_SPOOL_PATH || join(homedir(), '.zao/zoe/grill-queue-spool.jsonl')
  );
}

/**
 * The next item number to use.
 *
 * The file's own numbering is not a clean sequence - batch 1 wrote 1-7, the
 * shepherd pass wrote 8-10 BELOW a section that had already used 11-15, and
 * later sections restart. So "count the items" and "read the last number" both
 * produce collisions. Take the highest number anywhere in the file and go up
 * from there: monotonic, and a duplicate item number in a file humans cite by
 * number ("item 28 is Zaal's") is the one failure that actually costs
 * something.
 */
export function nextItemNumber(existing: string): number {
  let max = 0;
  for (const m of existing.matchAll(/^\s*(\d+)\.\s/gm)) {
    const n = Number(m[1]);
    if (Number.isInteger(n) && n > max) max = n;
  }
  return max + 1;
}

function ageDays(createdAt: string | undefined, now: number): string {
  if (!createdAt) return 'age unknown';
  const t = Date.parse(createdAt);
  if (!Number.isFinite(t)) return 'age unknown';
  return `${Math.max(0, Math.round((now - t) / 86_400_000))}d old`;
}

/**
 * Render the batch in the file's existing shape: a `## ` section header, then
 * numbered items. Kept deliberately close to what the organizer and lane
 * shepherd passes already write, because /quick-grill and the grill lane both
 * read this file by eye.
 */
export function renderQueueSection(
  cards: GrillQueueCard[],
  startNumber: number,
  now: number,
  date = new Date(now).toISOString().slice(0, 10),
): string {
  const lines: string[] = [
    '',
    `## From ZOE grill batch (${date}, ${cards.length} card${cards.length === 1 ? '' : 's'})`,
    '',
    'Sent to Telegram as the daily digest AND landed here. Standing rule',
    'applies (Zaal 2026-08-26: *"you should be knocking those out unless you',
    'have an issue."*) - reversible ones get the recommended option and get',
    'recorded; money, public, on-chain, an unrecoverable delete, or a call that',
    'is not clearly right goes to him as a tap.',
    '',
    'Verdicts are the grill\'s five: 1 done, 2 keep, 3 work on it, 4 drop,',
    '5 skip. Closing the board card is the orchestrator\'s to run; the verdict',
    'is what gets recorded here.',
    '',
  ];
  cards.forEach((c, i) => {
    lines.push(`${startNumber + i}. **${c.title}** - board card \`${c.taskId}\`,`);
    lines.push(`   ${ageDays(c.createdAt, now)}.${c.why ? ` ${c.why}` : ''}`);
  });
  lines.push('');
  return lines.join('\n');
}

/**
 * Append a batch. Never throws: the queue is the SECOND destination, and a
 * vault that is missing, read-only, or full must not take down the send that
 * already happened.
 */
export async function appendGrillQueue(
  cards: GrillQueueCard[],
  opts: { now?: number; path?: string; spool?: string } = {},
): Promise<GrillQueueResult> {
  const now = opts.now ?? Date.now();
  const path = opts.path ?? queuePath();
  const spool = opts.spool ?? spoolPath();
  if (cards.length === 0) return { wrote: 'nothing', path, count: 0, numbers: [] };

  // ALREADY exists, not mkdir -p. Creating the vault here is how the VPS ends
  // up with a one-file directory that looks like the real queue and is read by
  // nobody.
  let haveVault = false;
  try {
    const st = await fs.stat(dirname(path));
    haveVault = st.isDirectory();
  } catch {
    haveVault = false;
  }

  if (haveVault) {
    try {
      let existing = '';
      try {
        existing = await fs.readFile(path, 'utf8');
      } catch {
        existing = '';
      }
      const start = nextItemNumber(existing);
      await fs.appendFile(path, renderQueueSection(cards, start, now), 'utf8');
      return {
        wrote: 'queue',
        path,
        count: cards.length,
        numbers: cards.map((_, i) => start + i),
      };
    } catch {
      // fall through to the spool rather than losing the batch
    }
  }

  try {
    await fs.mkdir(dirname(spool), { recursive: true });
    const rows = cards
      .map((c) => JSON.stringify({ ...c, spooledAt: new Date(now).toISOString() }))
      .join('\n');
    await fs.appendFile(spool, rows + '\n', 'utf8');
    return { wrote: 'spool', path: spool, count: cards.length, numbers: [] };
  } catch {
    return { wrote: 'nothing', path: spool, count: 0, numbers: [] };
  }
}
