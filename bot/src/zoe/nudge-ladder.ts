/**
 * nudge-ladder.ts - an escalating -> decaying Telegram nudge for a single
 * UNANSWERED needs-Zaal question. It catches Zaal on mobile in bursts and
 * STOPS the moment he answers.
 *
 * Zaal (2026-08-06, spec [[feedback_zoe_nudge_cadence]]): "on mobile especially
 * in bursts but I need to be pinged continuously on telegram like 5 times in 10
 * mins randomly and try that 3 times in an hour and then go to twice every 3
 * hours etc." - a persistent pager that hits hard early, then backs off.
 *
 * This is the cadence ENGINE + persistence. It is provider-agnostic: the caller
 * (orchestrator-tick / scheduler) supplies "send this re-ping" and "did Zaal
 * answer". Different from `nudge.ts` (daily stale/overdue) and `nudges.ts`
 * (forward next-task) - those are once-a-day / once-every-4h reminders, not a
 * per-question escalating pager.
 *
 * SAFETY: default OFF (set ZOE_NUDGE_LADDER=1 to enable), a hard MAX_PINGS
 * runaway cap, and it removes the track the instant an answer is recorded - so
 * a broken ladder can never become the spam it is meant to prevent.
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

/** Read ZOE_HOME lazily (at call-time) so tests can point it at a temp dir. */
function ladderHome(): string {
  return process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
}
function ladderPath(): string {
  return join(ladderHome(), 'nudge-ladder.json');
}

/** Hard runaway cap - stop pinging a single question after this many pings even
 *  if still unanswered (surface it as stuck instead). ~40 pings spans >1 week
 *  on the decaying tail, so this only trips on a genuinely-ignored item. */
export const MAX_PINGS = 40;

const MIN = 60_000;
const HOUR = 60 * MIN;

/** One tracked, unanswered needs-Zaal question being nudged. */
export interface NudgeTrack {
  /** Question id - matches the button-question qid so an answer stops it. */
  qid: string;
  /** Short human label for the re-ping line ("your Zuke direction call"). */
  label: string;
  /** The option labels, to rebuild the tap keyboard on a re-ping. */
  options: string[];
  /** When the original question was posted (ms). */
  startedMs: number;
  /** Timestamps of every ping incl. the original post (ms), ascending. */
  pingMs: number[];
}

/** Enabled only when explicitly turned on - safe-by-default for the first ship. */
export function nudgeLadderEnabled(): boolean {
  return process.env.ZOE_NUDGE_LADDER === '1';
}

/**
 * The target interval to the NEXT ping, given how long the question has been
 * open and how many pings have gone out. This encodes Zaal's ladder:
 *   - 0-10 min  : ~every 2 min  -> ~5 pings in the first 10 minutes
 *   - 10-60 min : ~every 3.3 min -> ~15 pings total by the end of hour 1
 *   - 1-3 hours : ~every 90 min  -> ~2 pings per 3 hours
 *   - 3-24 hours: every 6 hours  -> the decaying tail
 *   - >24 hours : every 24 hours -> never fully silent, but rare
 * A small deterministic jitter (by ping index) makes the spacing feel like a
 * real nudge ("randomly"), not a metronome, while staying test-deterministic.
 */
export function nextIntervalMs(elapsedMs: number, pingCount: number): number {
  const jitter = (base: number) => base + (pingCount % 2 === 0 ? base * 0.15 : -base * 0.1);
  if (elapsedMs < 10 * MIN) return jitter(2 * MIN); // phase 1 burst
  if (elapsedMs < HOUR) return jitter(3.3 * MIN); // phase 2 - fill hour 1
  if (elapsedMs < 3 * HOUR) return 90 * MIN; // phase 3 - twice per 3h
  if (elapsedMs < 24 * HOUR) return 6 * HOUR; // phase 4 - decay
  return 24 * HOUR; // long tail
}

/** True if this track is due for a re-ping now (and not past the runaway cap). */
export function isPingDue(track: NudgeTrack, nowMs: number): boolean {
  if (track.pingMs.length >= MAX_PINGS) return false;
  const lastPing = track.pingMs[track.pingMs.length - 1] ?? track.startedMs;
  const elapsed = nowMs - track.startedMs;
  const interval = nextIntervalMs(elapsed, track.pingMs.length);
  return nowMs - lastPing >= interval;
}

/** True if the track has exhausted the ladder unanswered - the caller should
 *  surface it as stuck (a human-needed item nobody is answering). */
export function isExhausted(track: NudgeTrack): boolean {
  return track.pingMs.length >= MAX_PINGS;
}

async function load(): Promise<NudgeTrack[]> {
  try {
    const parsed = JSON.parse(await fs.readFile(ladderPath(), 'utf8')) as unknown;
    // A hand-edited / truncated-then-repaired file can parse to a non-array
    // ({} or null). Callers immediately .filter()/.find() the result, so a
    // non-array would throw a TypeError out of dueTracks() and take the whole
    // orchestrator tick down. Treat anything that is not an array as "no tracks".
    return Array.isArray(parsed) ? (parsed as NudgeTrack[]) : [];
  } catch {
    return [];
  }
}

/** Persist. Returns false (best-effort) when the write failed - callers that are
 *  about to SEND a ping must treat false as "do not ping": an unrecorded ping
 *  means the schedule never advances and MAX_PINGS never trips (runaway pings). */
async function save(tracks: NudgeTrack[]): Promise<boolean> {
  try {
    await fs.mkdir(ladderHome(), { recursive: true });
    await fs.writeFile(ladderPath(), JSON.stringify(tracks, null, 2));
    return true;
  } catch {
    return false;
  }
}

/** Begin nudging a newly-posted question. Idempotent on qid (re-posting the
 *  same qid refreshes the label/options, keeps the existing schedule). */
export async function startNudge(qid: string, label: string, options: string[], nowMs: number): Promise<void> {
  const tracks = await load();
  const existing = tracks.find((t) => t.qid === qid);
  if (existing) {
    existing.label = label;
    existing.options = options;
  } else {
    tracks.push({ qid, label, options, startedMs: nowMs, pingMs: [nowMs] });
  }
  await save(tracks);
}

/** Stop nudging (Zaal answered, or the caller resolved it). Returns true if a
 *  track was removed. This is the ladder's kill switch - call it on every
 *  detected answer. */
export async function stopNudge(qid: string): Promise<boolean> {
  const tracks = await load();
  const next = tracks.filter((t) => t.qid !== qid);
  if (next.length === tracks.length) return false;
  await save(next);
  return true;
}

/** Record that a re-ping was just sent for a qid (advances the schedule).
 *  Returns true only if the advance was PERSISTED - a caller that pings-on-true
 *  then never pings a track it could not advance (else it would ping forever). */
export async function markPinged(qid: string, nowMs: number): Promise<boolean> {
  const tracks = await load();
  const t = tracks.find((x) => x.qid === qid);
  if (!t) return false;
  t.pingMs.push(nowMs);
  return save(tracks);
}

/** The open tracks that are due for a re-ping right now. */
export async function dueTracks(nowMs: number): Promise<NudgeTrack[]> {
  return (await load()).filter((t) => isPingDue(t, nowMs));
}

/** All open tracks (for observability / a stuck-item report). */
export async function openTracks(): Promise<NudgeTrack[]> {
  return load();
}
