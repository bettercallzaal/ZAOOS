/**
 * terminal-grill.ts - /grill walks the seat's "Waiting on Zaal" items first.
 *
 * Zaal, 2026-10-08: "can i do a /grill command aswell so that i can click
 * through the todos for terminals". The orchestrator seat keeps those items in
 * zao-vault notes/orca-terminals-latest.md (read by terminals-digest.ts). With
 * ZOE_GRILL_TERMINALS=1, /grill shows them one at a time, each with a button per
 * option, before the board cards /grill already walks.
 *
 * OPTIONS. The seat writes an item's choices inline: "Which Ryan leads design:
 * A Ryan Miller (OPEN X) / B someone else (name)". parseItemOptions reads that
 * shape only when the letters run A, B, C... each after " / ". "Thank-yous A/B
 * and ..." has no space after the letter and stays a plain item: Done, Skip,
 * Type an answer.
 *
 * WHERE HIS ANSWER GOES. One JSON line per answer, verbatim and timed, in
 * ~/.zao/zoe/terminal-answers.jsonl on the VPS. The seat on the Mac reads it with
 *   ssh vps tail -n 20 ~/.zao/zoe/terminal-answers.jsonl
 * The VPS cannot push to the vault (its checkout is behind and dirty), so the
 * answer waits where the seat can read it, not in a file that never leaves.
 *
 * ONCE. One answer per item id per page stamp. A second tap on the same card
 * is refused and not written. A tap on a card from an older page is refused,
 * because the seat may have reused the id for a different question.
 */

import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { TerminalsPage } from './terminals-digest';
import { withStopRow, type Button } from './grill-pause';

export function terminalGrillEnabled(): boolean {
  return process.env.ZOE_GRILL_TERMINALS === '1';
}

function dir(): string {
  return process.env.ZOE_TERMINAL_GRILL_DIR || join(homedir(), '.zao', 'zoe');
}
const statePath = () => join(dir(), 'terminal-grill.json');
export const answersPath = () => join(dir(), 'terminal-answers.jsonl');

export interface ItemOption {
  letter: string;
  text: string;
}

/** Pure. Split "question A x / B y / C z" into the question and lettered options. */
export function parseItemOptions(item: string): { question: string; options: ItemOption[] } {
  const none = { question: item.trim(), options: [] as ItemOption[] };
  const m = /(^|[\s?:.;])A\s+(?=\S)/.exec(item);
  if (!m) return none;
  const start = m.index + m[1].length;
  const parts = item.slice(start).split(/\s+\/\s+/);
  if (parts.length < 2 || parts.length > 4) return none;
  const options: ItemOption[] = [];
  for (let i = 0; i < parts.length; i++) {
    const letter = 'ABCD'[i];
    const pm = new RegExp(`^${letter}\\s+(.+)$`).exec(parts[i].trim());
    if (!pm) return none;
    options.push({ letter, text: pm[1].trim() });
  }
  return { question: item.slice(0, start).trim() || item.trim(), options };
}

/** "2026-10-08 05:46 EDT" -> "2610080546", short enough for callback data. */
export function stampKey(stamp: string | null): string {
  const d = (stamp ?? '').replace(/\D/g, '');
  return d.length >= 12 ? d.slice(2, 12) : d || 'nostamp';
}

export const answerKey = (stamp: string | null, id: string) => `${stampKey(stamp)}|${id}`;

export interface TerminalGrillState {
  /** answerKey -> what was recorded. Answered and skipped items both end here. */
  done: Record<string, { choice: string; at: string }>;
  /** The message a typed answer should reply to, if Zaal tapped "Type an answer". */
  pendingType: { messageId: number; id: string; stampKey: string } | null;
}

export async function readTerminalGrillState(): Promise<TerminalGrillState> {
  try {
    const s = JSON.parse(await fs.readFile(statePath(), 'utf8')) as Partial<TerminalGrillState>;
    return { done: s.done ?? {}, pendingType: s.pendingType ?? null };
  } catch {
    return { done: {}, pendingType: null };
  }
}

async function writeState(s: TerminalGrillState): Promise<void> {
  await fs.mkdir(dir(), { recursive: true });
  const tmp = `${statePath()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(s, null, 2));
  await fs.rename(tmp, statePath());
}

export async function setPendingType(messageId: number, id: string, stamp: string | null): Promise<void> {
  const s = await readTerminalGrillState();
  s.pendingType = { messageId, id, stampKey: stampKey(stamp) };
  await writeState(s);
}

/** Pure. The first waiting item not yet answered or skipped on this page. */
export function nextTerminalItem(page: TerminalsPage, s: TerminalGrillState): { id: string; item: string } | null {
  return page.waiting.find((w) => !s.done[answerKey(page.stamp, w.id)]) ?? null;
}

/** Pure. The card for one item. */
export function formatTerminalCard(w: { id: string; item: string }, stamp: string | null): { text: string; buttons: Button[][] } {
  const sk = stampKey(stamp);
  const d = (c: string) => `tw:${sk}:${w.id}:${c}`.slice(0, 64);
  const { question, options } = parseItemOptions(w.item);
  const head = `${w.id} - waiting on you (seat page ${stamp ?? 'with no stamp'})\n${options.length ? question : w.item}`;
  if (options.length) {
    const text = `${head}\n\n${options.map((o) => `${o.letter}) ${o.text}`).join('\n')}`;
    const row = options.map((o) => ({ text: `${o.letter}: ${o.text}`.slice(0, 28), data: d(o.letter) }));
    return { text, buttons: withStopRow([row, [{ text: 'Skip', data: d('skip') }, { text: 'Type an answer', data: d('type') }]]) };
  }
  return {
    text: head,
    buttons: withStopRow([[{ text: 'Done', data: d('done') }, { text: 'Skip', data: d('skip') }, { text: 'Type an answer', data: d('type') }]]),
  };
}

export type RecordOutcome = 'recorded' | 'already-answered' | 'stale' | 'invalid' | 'unknown-item';

/**
 * Record one answer. choice is a letter, 'done', 'skip', or 'typed' with text.
 * Writes the answer line first, then the state, so a crash between them can
 * only ever repeat a line the seat can see, never lose one.
 */
export async function recordTerminalAnswer(opts: {
  page: TerminalsPage;
  id: string;
  choice: string;
  text?: string;
  tapStampKey?: string;
  now?: number;
}): Promise<RecordOutcome> {
  const { page, id } = opts;
  if (opts.tapStampKey && opts.tapStampKey !== stampKey(page.stamp)) return 'stale';
  const w = page.waiting.find((x) => x.id === id);
  if (!w) return 'unknown-item';
  const { options } = parseItemOptions(w.item);
  let answer: string;
  if (opts.choice === 'typed') answer = opts.text ?? '';
  else if (opts.choice === 'done' || opts.choice === 'skip') answer = opts.choice;
  else {
    const o = options.find((x) => x.letter === opts.choice);
    if (!o) return 'invalid';
    answer = o.text;
  }
  const s = await readTerminalGrillState();
  const key = answerKey(page.stamp, id);
  if (s.done[key]) return 'already-answered';
  const at = new Date(opts.now ?? Date.now()).toISOString();
  await fs.mkdir(dir(), { recursive: true });
  await fs.appendFile(
    answersPath(),
    JSON.stringify({ at, stamp: page.stamp, id, choice: opts.choice, answer, item: w.item, from: 'zaal', via: 'telegram /grill' }) + '\n',
  );
  s.done[key] = { choice: opts.choice, at };
  if (s.pendingType && s.pendingType.id === id) s.pendingType = null;
  await writeState(s);
  return 'recorded';
}
