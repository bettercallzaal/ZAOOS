/**
 * proactive.ts — the reasoning-tick gate (doc 796 Move 1, Phase 2).
 *
 * Replaces "cron → generate content → send" with "cron → silent reasoning →
 * speak only if it clears the bar". Each tick gathers candidate thoughts (open
 * threads that are due/overdue, a went-quiet check-in, calendar nudges),
 * scores them for relevance, and speaks AT MOST the single best one — and only
 * if it clears the interrupt threshold. Most ticks stay silent.
 *
 * DECISION 1 (Zaal, 2026-06-04): NO daily quota. The threshold is the SOLE
 * control. With no budget backstop, three guards replace it and are
 * load-bearing, not optional:
 *   (a) single-best-thing  — ≤1 push per tick by construction (pickBest).
 *   (b) silence observability — every tick logs its decision so a mis-set
 *       threshold (silence_rate cratering) is visible within a day.
 *   (c) unacked self-throttle — if too many recent pushes go unacked, ZOE
 *       raises its OWN threshold and asks "I've been chatty — dial back?",
 *       rather than waiting for Zaal to complain.
 *
 * The morning brief stays an always-on floor (scheduler.ts) so "too quiet"
 * has a guaranteed anchor; everything here is threshold-gated.
 *
 * Pure scoring + gating (scoreThreadCandidate / pickBest / passesThreshold /
 * unackedInWindow / nextThreshold) so the safety logic is unit-testable with a
 * pinned clock. IO (threshold file, push log, decision log) is thin.
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from './memory';
import {
  listLiveThreads,
  nextEscalationAction,
  isOverdue,
  type OpenThread,
} from './threads';

const THRESHOLD_FILE = join(ZOE_PATHS.home, 'proactive-threshold.txt');
const PUSHES_FILE = join(ZOE_PATHS.home, 'proactive-pushes.json');
const LOG_FILE = join(ZOE_PATHS.home, 'proactive-log.jsonl');

/**
 * Default interrupt bar (tuned 2026-07-12). Lowered from 0.6 to allow due-soon
 * threads (score 0.6) and inactivity checks (0.62) to clear the base threshold.
 * The self-throttle (unacked pushes) still escalates aggressively: at 3+ unacked
 * it raises to 0.6, 6+ raises to 0.7, etc., so the bot doesn't spam even if the
 * base bar is lower. Tunable via ZOE_PROACTIVE_THRESHOLD env var.
 */
export const DEFAULT_THRESHOLD = Number.parseFloat(process.env.ZOE_PROACTIVE_THRESHOLD ?? '0.5');
export const MIN_THRESHOLD = 0.3;
export const MAX_THRESHOLD = 0.95;
/** Self-throttle: this many unacked pushes in the window raises the bar. */
export const UNACKED_LIMIT = 3;
export const UNACKED_WINDOW_MS = 24 * 60 * 60 * 1000;
const THRESHOLD_STEP = 0.1;

export type CandidateKind = 'thread-nudge' | 'thread-decision' | 'task-nudge' | 'inactivity' | 'calendar' | 'github-event' | 'graph-event';
export type CandidateTier = 'critical' | 'standard' | 'signal';

export interface Candidate {
  kind: CandidateKind;
  /** 0..1 relevance. Compared against the threshold. */
  score: number;
  /** Interrupt tier: critical (P0/blocker), standard (due/overdue), signal (inactivity). */
  tier: CandidateTier;
  /** The message ZOE would send (already in voice). */
  message: string;
  /** Linked open thread, when the candidate came from one. */
  threadId?: string;
}

/** A recorded proactive push, for the unacked self-throttle. */
export interface ProactivePush {
  id: string;
  sentAt: string;
  kind: CandidateKind;
  threadId?: string;
  acked: boolean;
}

export interface ProactiveDecision {
  speak: boolean;
  message?: string;
  candidate?: Candidate;
  threadId?: string;
  /** Threshold in force for this tick (after any self-throttle bump). */
  threshold: number;
  /** Every candidate's score this tick, for the log. */
  consideredScores: number[];
  /** Why it spoke or stayed silent. */
  reason:
    | 'spoke'
    | 'no-candidates'
    | 'below-threshold'
    | 'self-throttle-notice';
}

// ---- pure scoring -----------------------------------------------------------

/**
 * Score a thread as a proactive candidate. Returns null if the thread has no
 * escalation move right now. Overdue threads score highest and climb with how
 * far past due they are; a two-snooze "decision" scores high because it needs
 * resolution, not another identical ping.
 */
export function scoreThreadCandidate(t: OpenThread, now: number = Date.now()): Candidate | null {
  const action = nextEscalationAction(t, now);
  if (action.kind === 'none') return null;

  if (action.kind === 'decision') {
    return {
      kind: 'thread-decision',
      score: 0.8,
      tier: 'critical',
      threadId: t.id,
      message:
        `You've pushed "${t.summary}" twice now. Rather than ping again — ` +
        `reschedule it, drop it, or want me to break it down?`,
    };
  }

  // nudge
  let score = 0.6; // due-soon baseline
  let tier: CandidateTier = 'standard';
  if (action.overdue && t.dueAt) {
    const overdueHrs = (now - Date.parse(t.dueAt)) / 3_600_000;
    score = Math.min(0.75 + overdueHrs * 0.02, 0.95);
    if (overdueHrs > 24) {
      tier = 'critical'; // significantly overdue
    }
  }
  const when = action.overdue ? 'You said' : "You're on the hook for";
  const tail = action.overdue ? '— did it land?' : '— still on track?';
  return {
    kind: 'thread-nudge',
    score,
    tier,
    threadId: t.id,
    message: `${when} "${t.summary}" ${tail}`,
  };
}

/** The single best candidate (highest score), or null. Enforces guard (a). */
export function pickBest(candidates: Candidate[]): Candidate | null {
  if (candidates.length === 0) return null;
  return candidates.reduce((best, c) => (c.score > best.score ? c : best));
}

export function passesThreshold(score: number, threshold: number): boolean {
  return score >= threshold;
}

/** Count pushes in the trailing window that Zaal never acked. */
export function unackedInWindow(
  pushes: ProactivePush[],
  now: number = Date.now(),
  windowMs: number = UNACKED_WINDOW_MS,
): number {
  return pushes.filter((p) => !p.acked && now - Date.parse(p.sentAt) <= windowMs).length;
}

/**
 * The threshold for the next tick given recent unacked pushes (guard c). At or
 * above UNACKED_LIMIT unacked, raise by one step (capped). Otherwise unchanged.
 * Pure so the self-throttle curve is testable.
 */
export function nextThreshold(
  current: number,
  unacked: number,
  limit: number = UNACKED_LIMIT,
): number {
  if (unacked >= limit) return Math.min(MAX_THRESHOLD, round2(current + THRESHOLD_STEP));
  return current;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---- threshold state --------------------------------------------------------

export async function readThreshold(): Promise<number> {
  try {
    const raw = await fs.readFile(THRESHOLD_FILE, 'utf8');
    const n = Number.parseFloat(raw.trim());
    if (Number.isFinite(n)) return Math.min(MAX_THRESHOLD, Math.max(MIN_THRESHOLD, n));
  } catch {
    // no file — default
  }
  return DEFAULT_THRESHOLD;
}

export async function writeThreshold(value: number): Promise<void> {
  const clamped = Math.min(MAX_THRESHOLD, Math.max(MIN_THRESHOLD, round2(value)));
  await fs.mkdir(ZOE_PATHS.home, { recursive: true });
  await fs.writeFile(THRESHOLD_FILE, String(clamped), 'utf8');
}

/** Raise/lower the bar in dialogue ("too many pings" / "more nudges on X"). */
export async function nudgeThreshold(delta: number): Promise<number> {
  const next = round2((await readThreshold()) + delta);
  await writeThreshold(next);
  return Math.min(MAX_THRESHOLD, Math.max(MIN_THRESHOLD, next));
}

// ---- push log (self-throttle + ack tracking) --------------------------------

export async function readPushes(): Promise<ProactivePush[]> {
  try {
    const raw = await fs.readFile(PUSHES_FILE, 'utf8');
    const arr = JSON.parse(raw) as ProactivePush[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function writePushes(pushes: ProactivePush[]): Promise<void> {
  await fs.mkdir(ZOE_PATHS.home, { recursive: true });
  // keep a trailing window's worth + a little headroom
  const cutoff = Date.now() - 3 * UNACKED_WINDOW_MS;
  const trimmed = pushes.filter((p) => Date.parse(p.sentAt) >= cutoff);
  await fs.writeFile(PUSHES_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
}

export async function recordPush(c: Candidate, now: number = Date.now()): Promise<void> {
  const pushes = await readPushes();
  pushes.push({
    id: `px-${now}-${Math.random().toString(36).slice(2, 6)}`,
    sentAt: new Date(now).toISOString(),
    kind: c.kind,
    threadId: c.threadId,
    acked: false,
  });
  await writePushes(pushes);
}

/**
 * Mark the most recent unacked push for a thread (or the latest overall) as
 * acked. Called when Zaal replies to a proactive message. Keeps the
 * self-throttle honest — answered pushes don't count toward the chatty signal.
 */
export async function ackPush(threadId?: string): Promise<boolean> {
  const pushes = await readPushes();
  for (let i = pushes.length - 1; i >= 0; i--) {
    if (pushes[i].acked) continue;
    if (threadId && pushes[i].threadId !== threadId) continue;
    pushes[i].acked = true;
    await writePushes(pushes);
    return true;
  }
  return false;
}

async function appendLog(line: Record<string, unknown>): Promise<void> {
  try {
    await fs.mkdir(ZOE_PATHS.home, { recursive: true });
    await fs.appendFile(LOG_FILE, `${JSON.stringify({ ts: new Date().toISOString(), ...line })}\n`, 'utf8');
  } catch {
    // observability is best-effort
  }
}

// ---- the tick ---------------------------------------------------------------

export interface ReasoningTickDeps {
  now?: number;
  /** Optional extra candidates (inactivity check-in, calendar). Injected so the
   *  core gate stays pure/testable and event sources can evolve independently. */
  extraCandidates?: () => Promise<Candidate[]>;
}

/**
 * Run one reasoning tick. Gathers candidates, applies the self-throttle to pick
 * the live threshold, speaks the single best candidate iff it clears the bar,
 * and logs the decision either way. Returns the decision; the caller (scheduler)
 * does the actual send + recordPush so this stays IO-light and testable.
 */
export async function runReasoningTick(deps: ReasoningTickDeps = {}): Promise<ProactiveDecision> {
  const now = deps.now ?? Date.now();

  // Gather candidates: open threads with an escalation move + injected extras.
  const candidates: Candidate[] = [];
  for (const t of listLiveThreads(now)) {
    const c = scoreThreadCandidate(t, now);
    if (c) candidates.push(c);
  }
  if (deps.extraCandidates) {
    try {
      candidates.push(...(await deps.extraCandidates()));
    } catch (err) {
      console.warn('[zoe/proactive] extraCandidates failed (nbd):', (err as Error).message);
    }
  }

  const consideredScores = candidates.map((c) => c.score);

  // Self-throttle (guard c): compute the live threshold from recent acks.
  const baseThreshold = await readThreshold();
  const pushes = await readPushes();
  const unacked = unackedInWindow(pushes, now);
  const threshold = nextThreshold(baseThreshold, unacked);
  if (threshold !== baseThreshold) {
    await writeThreshold(threshold); // persist the raised bar
  }

  const best = pickBest(candidates);

  // No candidate at all → silent.
  if (!best) {
    await appendLog({ event: 'tick', spoke: false, reason: 'no-candidates', threshold, considered: 0, unacked });
    return { speak: false, threshold, consideredScores, reason: 'no-candidates' };
  }

  // Self-throttle just tripped → instead of the candidate, surface a dial-back
  // notice ONCE (and only when we'd otherwise have spoken). This is the chatty
  // safety valve replacing the missing quota.
  if (unacked >= UNACKED_LIMIT && threshold !== baseThreshold && passesThreshold(best.score, baseThreshold)) {
    const message =
      `I've sent ${unacked} things you haven't replied to. I'll dial back — ` +
      `raising my bar so I only ping when it really matters. Say "more pings" to undo.`;
    await appendLog({ event: 'tick', spoke: true, reason: 'self-throttle-notice', threshold, unacked });
    return {
      speak: true,
      message,
      threshold,
      consideredScores,
      reason: 'self-throttle-notice',
    };
  }

  // Gate on the threshold.
  if (!passesThreshold(best.score, threshold)) {
    await appendLog({
      event: 'tick',
      spoke: false,
      reason: 'below-threshold',
      threshold,
      best: round2(best.score),
      considered: candidates.length,
      unacked,
    });
    return { speak: false, threshold, consideredScores, reason: 'below-threshold' };
  }

  await appendLog({
    event: 'tick',
    spoke: true,
    reason: 'spoke',
    threshold,
    best: round2(best.score),
    kind: best.kind,
    tier: best.tier,
    threadId: best.threadId,
    considered: candidates.length,
    unacked,
  });
  return {
    speak: true,
    message: best.message,
    candidate: best,
    threadId: best.threadId,
    threshold,
    consideredScores,
    reason: 'spoke',
  };
}

/**
 * Silence rate over the last `n` logged ticks — the key observability metric
 * for tuning the threshold (guard b). Reads the decision log.
 */
export async function silenceRate(n = 50): Promise<{ ticks: number; silent: number; rate: number }> {
  let lines: string[];
  try {
    const raw = await fs.readFile(LOG_FILE, 'utf8');
    lines = raw.split('\n').filter((l) => l.trim()).slice(-n);
  } catch {
    return { ticks: 0, silent: 0, rate: 0 };
  }
  let silent = 0;
  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as { event?: string; spoke?: boolean };
      if (entry.event === 'tick' && entry.spoke === false) silent += 1;
    } catch {
      // skip corrupt line
    }
  }
  return { ticks: lines.length, silent, rate: lines.length ? round2(silent / lines.length) : 0 };
}
