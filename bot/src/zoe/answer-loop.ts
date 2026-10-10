/**
 * answer-loop.ts - close the loop on Zaal's answers: say what each one changed.
 *
 * WHY (Zaal, 2026-10-10: "can we loop this terminal on improving the zoes
 * ability to question me", option A: better questions that report back).
 * Every answer path records the tap (answers.ts) and nothing else. The asker
 * reads it with zao-ask-check, acts or does not, and Zaal never hears which.
 * Measured on the VPS 2026-10-10: answers.jsonl held 12 answers since
 * 2026-10-08, the last five tapped inside 40 seconds, and no file anywhere
 * recorded what any of them led to (searched bot/src/zoe, the repo for
 * ask-done / outcomes, and ~/bin). A fast answer into silence teaches the
 * person answering that answering does nothing.
 *
 * WHAT IT DOES, with ZOE_ANSWER_LOOP=1:
 *   1. The asker reports the outcome: one JSON line in
 *      ~/.zao/zoe/answer-outcomes.jsonl, {qid, text, by, ts} (recordOutcome
 *      here, or any tool that appends the same shape).
 *   2. A tick posts it back as a reply to the original question message:
 *      "Done (qid): <what changed>". The question and its result sit together.
 *   3. Once a day it lists answers older than 6h with no outcome, so a dropped
 *      answer is visible instead of silent.
 *
 * Boundary: it reports, never acts. What an answer should cause stays with the
 * asker; this only makes the result, or its absence, visible.
 */
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { readAnswers, type AnswerRecord } from './answers';
import { featureRan } from './feature-ran';

export function answerLoopEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_ANSWER_LOOP === '1';
}

export interface OutcomeRecord {
  qid: string;
  /** What the answer changed, in one line: "merged #3875", "parked, needs X". */
  text: string;
  /** Who acted: a lane name, "seat", "zoe". */
  by: string;
  ts: string;
}

const zoeHome = (): string => process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
export const outcomesPath = (): string => join(zoeHome(), 'answer-outcomes.jsonl');
const statePath = (): string => join(zoeHome(), 'answer-loop-state.json');

const MAX_TEXT = 400;
export const STALE_MS = 6 * 3600_000;
export const MAX_AGE_MS = 7 * 24 * 3600_000;
const MAX_LISTED = 10;

async function readJsonl<T>(path: string): Promise<T[]> {
  let raw: string;
  try {
    raw = await fs.readFile(path, 'utf8');
  } catch {
    return [];
  }
  const out: T[] = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line) as T);
    } catch {
      // a torn last line from a crash mid-write is skipped, not fatal
    }
  }
  return out;
}

/** Append one outcome. Refuses an empty qid or text rather than storing noise. */
export async function recordOutcome(qid: string, text: string, by: string): Promise<OutcomeRecord> {
  const q = qid.trim();
  const t = text.trim().replace(/\s+/g, ' ');
  if (!q) throw new Error('recordOutcome: empty qid');
  if (!t) throw new Error(`recordOutcome(${q}): empty text`);
  const rec: OutcomeRecord = {
    qid: q,
    text: t.length > MAX_TEXT ? `${t.slice(0, MAX_TEXT - 3)}...` : t,
    by: by.trim() || 'unknown',
    ts: new Date().toISOString(),
  };
  await fs.mkdir(dirname(outcomesPath()), { recursive: true });
  await fs.appendFile(outcomesPath(), `${JSON.stringify(rec)}\n`, 'utf8');
  return rec;
}

export function readOutcomes(): Promise<OutcomeRecord[]> {
  return readJsonl<OutcomeRecord>(outcomesPath());
}

interface LoopState {
  /** `${qid}|${ts}` of every outcome already posted. */
  reported: string[];
  /** UTC day (YYYY-MM-DD) the stale list last ran. */
  lastStaleDay?: string;
}

async function readState(): Promise<LoopState> {
  try {
    const s = JSON.parse(await fs.readFile(statePath(), 'utf8')) as Partial<LoopState>;
    return { reported: Array.isArray(s.reported) ? s.reported : [], lastStaleDay: s.lastStaleDay };
  } catch {
    return { reported: [] };
  }
}

async function writeState(s: LoopState): Promise<void> {
  await fs.mkdir(dirname(statePath()), { recursive: true });
  // Keep the newest 500 keys; an outcome older than that will never be re-read.
  await fs.writeFile(statePath(), JSON.stringify({ ...s, reported: s.reported.slice(-500) }));
}

const outcomeKey = (o: OutcomeRecord): string => `${o.qid}|${o.ts}`;

/** The newest answer per qid. */
function latestAnswers(answers: AnswerRecord[]): Map<string, AnswerRecord> {
  const m = new Map<string, AnswerRecord>();
  for (const a of answers) {
    const prev = m.get(a.qid);
    if (!prev || a.ts >= prev.ts) m.set(a.qid, a);
  }
  return m;
}

export function formatReport(o: OutcomeRecord, answer?: AnswerRecord): string {
  const lines = [`Done (${o.qid}): ${o.text}`];
  if (answer) lines.push(`You answered: ${answer.value}`);
  lines.push(`- ${o.by}`);
  return lines.join('\n');
}

/**
 * Answers that have waited longer than staleMs with no outcome reported at or
 * after the answer. Older than maxAgeMs is dropped: a week-old answer with no
 * outcome is history, not a nudge.
 */
export function openLoops(
  answers: AnswerRecord[],
  outcomes: OutcomeRecord[],
  now: Date,
  staleMs: number = STALE_MS,
  maxAgeMs: number = MAX_AGE_MS,
): AnswerRecord[] {
  const latestOutcome = new Map<string, string>();
  for (const o of outcomes) {
    const prev = latestOutcome.get(o.qid);
    if (!prev || o.ts > prev) latestOutcome.set(o.qid, o.ts);
  }
  const out: AnswerRecord[] = [];
  for (const a of latestAnswers(answers).values()) {
    const age = now.getTime() - new Date(a.ts).getTime();
    if (!(age >= staleMs && age <= maxAgeMs)) continue;
    const done = latestOutcome.get(a.qid);
    if (done && done >= a.ts) continue;
    out.push(a);
  }
  return out.sort((x, y) => x.ts.localeCompare(y.ts));
}

export function formatOpenLoops(open: AnswerRecord[], now: Date): string {
  const shown = open.slice(0, MAX_LISTED).map((a) => {
    const h = Math.round((now.getTime() - new Date(a.ts).getTime()) / 3600_000);
    return `- ${a.qid}: ${a.value} (${h}h ago)`;
  });
  const more = open.length > MAX_LISTED ? [`...and ${open.length - MAX_LISTED} more`] : [];
  return [
    `${open.length} answer${open.length === 1 ? '' : 's'} with nothing reported back yet:`,
    ...shown,
    ...more,
    'Whoever asked has not said what your answer changed.',
  ].join('\n');
}

export interface AnswerLoopDeps {
  /** Send to a chat, as a reply to replyTo when given. Resolves true when sent. */
  send: (chatId: string, text: string, replyTo?: number) => Promise<boolean>;
  /** Where outcomes for unknown qids and the stale list go. */
  defaultChat: string;
  now: Date;
  /** UTC hour from which the daily stale list may run. Default 13 (09:00 EDT). */
  staleHourUtc?: number;
}

export interface AnswerLoopResult {
  reported: number;
  staleListed: number;
}

/**
 * One tick: post every unreported outcome, then (once a UTC day) list the
 * answers still waiting on one. An outcome is marked reported only after its
 * send succeeds, so a failed send is retried next tick, not lost.
 */
export async function runAnswerLoopTick(deps: AnswerLoopDeps): Promise<AnswerLoopResult> {
  const [answers, outcomes, state] = await Promise.all([readAnswers(), readOutcomes(), readState()]);
  const done = new Set(state.reported);
  const latest = latestAnswers(answers);
  let reported = 0;
  let dirty = false;
  for (const o of outcomes) {
    const key = outcomeKey(o);
    if (done.has(key)) continue;
    const a = latest.get(o.qid);
    const chat = a && a.scope && a.scope !== 'private' ? a.scope : deps.defaultChat;
    const ok = await deps.send(chat, formatReport(o, a), a?.messageId).catch(() => false);
    if (!ok) continue;
    done.add(key);
    state.reported.push(key);
    reported++;
    dirty = true;
  }
  if (reported) featureRan('answer-loop', `${reported} report(s)`);

  let staleListed = 0;
  const today = deps.now.toISOString().slice(0, 10);
  if (state.lastStaleDay !== today && deps.now.getUTCHours() >= (deps.staleHourUtc ?? 13)) {
    const open = openLoops(answers, outcomes, deps.now);
    if (open.length) {
      const ok = await deps.send(deps.defaultChat, formatOpenLoops(open, deps.now)).catch(() => false);
      if (ok) staleListed = open.length;
    }
    // Set even when empty or failed: one attempt a day, never a retry storm.
    state.lastStaleDay = today;
    dirty = true;
  }
  if (dirty) await writeState(state);
  return { reported, staleListed };
}
