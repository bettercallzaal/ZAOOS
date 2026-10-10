/**
 * answers.ts - the durable index of Zaal's answers to button questions.
 *
 * Why (2026-10-08, the night 33 zao-ask questions went unreadable): every
 * answer path (button tap, "Type my own" text, voice, reaction) wrote ONE
 * line, `[answer:<qid>] <value>`, into recent/<group>.json, and nowhere else
 * that a reader looked. recent/ is the prompt window, a ring buffer of
 * RECENT_MAX = 8 turns (memory.ts), so the ninth answer in a batch pushes the
 * first one off before any poller sees it. Both readers of the bridge, the
 * orchestrator tick's detectNewAnswers and the VPS zao-ask-check, read only
 * that ring buffer. The append-only archive keeps every turn but is split by
 * month and mixed with every other message, so nothing could look an answer up
 * by its qid.
 *
 * This file is the missing store: one JSON line per answer in
 * ~/.zao/zoe/answers.jsonl, never truncated, findable by qid, written BEFORE
 * the ring-buffer line so a crash between the two loses the prompt window, not
 * the answer. The ring-buffer line is still written, in the same shape, so the
 * prompt window and the existing readers keep working unchanged.
 */
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { pushRecent, type ChatScope } from './memory';

export interface AnswerRecord {
  /** The question id the asker chose, e.g. "g1008-fin2". */
  qid: string;
  /** The tapped option slug, the typed text, or the reaction name. */
  value: string;
  /** Which path wrote it: zaalbotz-btn, zaalbotz-type, zaalbotz-voice. */
  sender: string;
  /** The chat scope the question lived in (group id as a string, or "private"). */
  scope: string;
  /** ISO timestamp, written by this module from the clock. */
  ts: string;
  /** The question's Telegram message id, when the answer came from its button.
   *  answer-loop.ts replies to it so the result sits under the question. */
  messageId?: number;
}

/** Resolved at call time, like orchestrator-tick, so a test can point ZOE_HOME
 *  at a temp dir after import. */
export function answersPath(): string {
  const home = process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
  return join(home, 'answers.jsonl');
}

/** The one bridge shape every reader greps for. Keep it here so the four
 *  write paths cannot drift from each other or from the readers. */
export function answerText(qid: string, value: string): string {
  return `[answer:${qid}] ${value}`;
}

/** Parse a bridge line back into its parts, or null if it is not one. */
export function parseAnswerText(text: string): { qid: string; value: string } | null {
  const m = /^\[answer:([^\]]+)\]\s*(.*)$/.exec(text);
  if (!m) return null;
  return { qid: m[1], value: m[2].trim() };
}

/**
 * Record an answer: append to answers.jsonl first, then push the bridge line
 * into the chat's recent/ ring buffer. Returns the stored record.
 */
export async function recordAnswer(
  qid: string,
  value: string,
  sender: string,
  scope: ChatScope,
  opts: { messageId?: number } = {},
): Promise<AnswerRecord> {
  const rec: AnswerRecord = {
    qid,
    value,
    sender,
    scope: String(scope),
    ts: new Date().toISOString(),
    ...(opts.messageId ? { messageId: opts.messageId } : {}),
  };
  // Both stores are attempted even when one fails: an answer that reaches only
  // the ring buffer is still readable for a while, and one that reaches only the
  // index is still readable by qid. Only when BOTH writes fail does this throw,
  // so the caller's catch logs a real loss and not a half one.
  const failures: string[] = [];
  try {
    const path = answersPath();
    await fs.mkdir(dirname(path), { recursive: true });
    await fs.appendFile(path, `${JSON.stringify(rec)}\n`, 'utf8');
  } catch (e) {
    failures.push(`answers.jsonl: ${(e as Error)?.message ?? String(e)}`);
  }
  try {
    // Same ts in both stores, so detectNewAnswers can dedupe on qid + ts.
    await pushRecent({ from: 'zaal', text: answerText(qid, value), sender, ts: rec.ts }, scope);
  } catch (e) {
    failures.push(`recent/: ${(e as Error)?.message ?? String(e)}`);
  }
  if (failures.length === 2) throw new Error(`recordAnswer(${qid}) reached neither store: ${failures.join('; ')}`);
  if (failures.length === 1) console.error(`[zoe/answers] ${qid} reached one store only: ${failures[0]}`);
  return rec;
}

/** Every stored answer, oldest first. Missing file = no answers, not an error. */
export async function readAnswers(opts: { since?: string; qid?: string } = {}): Promise<AnswerRecord[]> {
  let raw: string;
  try {
    raw = await fs.readFile(answersPath(), 'utf8');
  } catch {
    return [];
  }
  const out: AnswerRecord[] = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let rec: AnswerRecord;
    try {
      rec = JSON.parse(line) as AnswerRecord;
    } catch {
      continue; // a torn last line from a crash mid-write is skipped, not fatal
    }
    if (opts.qid && rec.qid !== opts.qid) continue;
    if (opts.since && new Date(rec.ts) <= new Date(opts.since)) continue;
    out.push(rec);
  }
  return out;
}

/** The newest answer for a qid, or undefined if Zaal has not answered it. */
export async function findAnswer(qid: string): Promise<AnswerRecord | undefined> {
  const all = await readAnswers({ qid });
  return all.length ? all[all.length - 1] : undefined;
}
