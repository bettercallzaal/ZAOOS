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
import { parseItemOptions } from './terminal-grill';

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
    // The grill queue is the final, append-only section of BLACKBOARD.md since 2026-09-10 (zao-vault plan 2). The Mac drain (zaal-dotfiles bin/zao-grill-queue-drain) writes the same file.
    join(homedir(), 'zao-vault', 'BLACKBOARD.md')
  );
}

export function spoolPath(): string {
  return (
    process.env.ZOE_GRILL_SPOOL_PATH || join(homedir(), '.zao/zoe/grill-queue-spool.jsonl')
  );
}

/**
 * Spool even when the queue's directory exists.
 *
 * The header above says the VPS has no vault. That stopped being true: measured
 * 2026-10-07, /home/zaal/zao-vault is a checkout there, 2,512 commits behind
 * origin with no cron pulling or pushing it, and its BLACKBOARD.md held 20
 * grill batches (646 lines) uncommitted. "The directory already exists" was
 * standing in for "this file reaches someone", and on that box it does not.
 * The spool is the path zao-grill-queue-drain reads. Off unless set to '1', so
 * the mac, where the vault is real, behaves as before.
 */
export function spoolOnly(): boolean {
  return process.env.ZOE_GRILL_QUEUE_SPOOL_ONLY === '1';
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

  if (haveVault && !spoolOnly()) {
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

// ---------------------------------------------------------------------------
// Gated or not (doc 2679 PR 2b; ZOE_GRILL_GATE_SORT=1, default off).
//
// The sorted-questions rule (adopted 2026-10-07; lane-autonomy.md): a question
// reaches Zaal only when it is about money, goes public or outbound, cannot be
// undone, needs a fact only he has, or changes a setting. Everything else is
// auto-proceeded on its recommended option, logged where he can override it.
//
// "When in doubt it IS gated." Fail closed: a card is auto-proceeded only when
// its recommended option is one of a short allowlist of reversible choice
// shapes (ALLOW_SHAPES) AND nothing in its title, notes or recommendation
// matches a gated class. Events and PR reviews always stay his.
// ---------------------------------------------------------------------------

export function gateSortEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_GRILL_GATE_SORT === '1';
}

export type GateClass = 'money' | 'public' | 'irreversible' | 'his-fact' | 'settings';

const GATE_WORDS: [GateClass, RegExp][] = [
  ['money', /\$\s?\d|send \$|\b(wire\w*|money|funds?|cash|venmo|zelle|paypal|stripe|usdc?|eth|sol|pay|paid|payments?|payouts?|invoices?|price|pricing|costs?|spend|budget|fees?|buy|purchase|subscriptions?|grants?|donat\w*|sponsor\w*|wallets?|tokens?|mint\w*|swap|transfers?|refunds?|billing|burn\w*)\b/i],
  ['public', /\b(post|posts|publish\w*|tweet|cast|announce\w*|send|email|e-mail|dm|newsletter|outreach|public|press|reply to|share with|invite|tell|notify|message|broadcast\w*|upload\w*|go(?:ing)? live|livestream\w*|stream it|launch\w*|ship\w*|release)\b/i],
  ['irreversible', /\b(delete|rm|remove|archive|drop|rename|force|on-?chain|deploy\w*|migrat\w*|rotate|revoke|sign|contract|cancel|close (?:the )?account|wipe|purge|merge\w*|push\w*|production|prod|commit\w*)\b/i],
  ['his-fact', /\b(only you|your call|do you|did you|are you|have you|which one do you|who is|whose|his|her)\b/i],
  ['settings', /\b(setting|settings|flag|env|permission\w*|config\w*|vercel|dns|domain|password|api key|keys?|secrets?|hooks?|webhooks?|cron)\b/i],
];

/**
 * The reversible choice shapes a recommendation may take for a card to be
 * auto-proceeded (fail closed, seat reviews on #3984): a bare option letter,
 * an ordering of one or two named things, tabs or wording, or a bare skip or
 * defer. Each matches the WHOLE recommendation, never a keyword inside it. Any other recommendation keeps the card with Zaal; the
 * gated word list above then runs as a second check over title, notes and
 * the recommendation together.
 */
// The only things an ordering may name (seat round 3 on #3984: an open word
// let "withdraw first", "sell first", "restart first" through). Names read
// from the card itself are deliberately not added: whoever writes a card could
// plant them. Any other ordering comes to Zaal.
const ORDER_NOUN = '(?:lint|tests?|typecheck|build|docs?|readme|review|spec|changelog)';
const DAY = '(?:tomorrow|next week|next month|later|monday|tuesday|wednesday|thursday|friday|saturday|sunday)';
const ALLOW_SHAPES: RegExp[] = [
  // a bare option letter: "A", "option B", "C)", "A (pick)"
  /^(?:option )?[a-d](?:\)|\.)?(?: \((?:pick|rec\w*)\))?$/,
  // an ordering of one of the fixed nouns below: "do lint first", "docs before tests"
  new RegExp(`^(?:do |run )?(?:the )?${ORDER_NOUN} (?:first|second|third|next|last)$`),
  new RegExp(`^(?:the )?${ORDER_NOUN} (?:before|after|then) (?:the )?${ORDER_NOUN}$`),
  // tabs, layout, wording
  /^(?:keep |use )?(?:the )?(?:one |two |three )?tabs?(?: on (?:top|bottom|the left|the right))?$/,
  /^(?:shorter|longer|plainer|simpler|clearer) (?:wording|phrasing|title|label)$/,
  // skip or defer, and nothing else
  /^skip(?: it| this| the optional [\w-]+| optional [\w-]+)?$/,
  new RegExp(`^(?:defer|park|hold)(?: it)?(?: (?:to|until) ${DAY})?$`),
  /^(?:later|not now|wait)$/,
];

/**
 * Pure. True when the WHOLE recommendation is one of the allowlisted shapes.
 * Each shape is anchored at both ends (seat re-review on #3984: an unanchored
 * keyword let "later: wire the money" through), so any extra verb or object
 * drops the card back to gated. Over-gating is the safe failure.
 */
export function allowlistedChoice(recommended: string): boolean {
  const r = recommended.trim().replace(/\s+/g, ' ').toLowerCase();
  return ALLOW_SHAPES.some((re) => re.test(r));
}

export interface GateVerdict {
  gated: boolean;
  /** Every gated class that matched; empty when none did. */
  classes: GateClass[];
  /** The option to proceed with, when there is one. */
  recommended?: string;
  /** One line saying why, for the log. */
  reason: string;
}

/** Pure. Sort one card. `recommended` is the option the card itself names as the pick, if any. */
export function classifyGate(card: { kind: string; title: string; notes?: string | null; recommended?: string }): GateVerdict {
  if (card.kind !== 'decision' && card.kind !== 'blocked') {
    return { gated: true, classes: [], recommended: card.recommended, reason: `${card.kind} cards always stay with Zaal` };
  }
  if (!card.recommended) return { gated: true, classes: [], reason: 'no recommended option to proceed with' };
  if (!allowlistedChoice(card.recommended)) {
    return { gated: true, classes: [], recommended: card.recommended, reason: 'recommendation is not an allowlisted reversible choice' };
  }
  // A bare option letter says nothing by itself: the gate list must also read
  // what that option IS (seat round 3). If the card shows no such option, the
  // letter cannot be checked, so the card stays with Zaal.
  let optionText = '';
  const letter = /^(?:option )?([a-d])(?:\)|\.)?(?: \((?:pick|rec\w*)\))?$/.exec(card.recommended.trim().toLowerCase())?.[1];
  if (letter) {
    const found = [card.title, card.notes ?? '']
      .flatMap((t) => t.split('\n'))
      .flatMap((line) => parseItemOptions(line).options)
      .find((o) => o.letter === letter.toUpperCase());
    if (!found) return { gated: true, classes: [], recommended: card.recommended, reason: `option ${letter.toUpperCase()} is not shown on the card` };
    optionText = found.text;
  }
  const text = `${card.title}\n${card.notes ?? ''}\n${card.recommended}\n${optionText}`;
  const classes = GATE_WORDS.filter(([, re]) => re.test(text)).map(([c]) => c);
  if (classes.length) return { gated: true, classes, recommended: card.recommended, reason: `names ${classes.join(', ')}` };
  return { gated: false, classes, recommended: card.recommended, reason: 'allowlisted reversible choice, no gated class' };
}

/** The line written for an auto-proceeded card, so Zaal can find and override it. */
export function autoProceedLine(recommended: string): string {
  return `auto-proceeded: ${recommended}, override anytime`;
}
