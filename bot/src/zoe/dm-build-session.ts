/**
 * dm-build-session.ts - make a DM build STEERABLE while it is running.
 *
 * PR #2956 wired the DM to the coder, which took "can I build from Telegram"
 * from a 1 to roughly a 4: you can start a build, and a PR link comes back. What
 * you could not do was talk to it. Send anything mid-run and it was treated as a
 * brand new turn - so "no, use the other table" either started a SECOND build on
 * top of the first, or vanished into the concierge while the wrong PR kept going.
 *
 * A build surface you cannot interrupt is a fire-and-forget button, not a
 * conversation. This module is the difference.
 *
 * WHAT IT HOLDS: one active run per chat, a cancel flag the runner polls at each
 * attempt boundary, and a single queued follow-up.
 *
 * WHY IN MEMORY: a run lives minutes and dies with the process. Persisting it
 * would mean reconciling "was that run still alive after a restart", and a stale
 * "a build is running" that blocks every message is far worse than losing the
 * handle on a restart. On restart there is no active run, and the next message
 * behaves normally - the safe direction to fail.
 *
 * ONE QUEUED FOLLOW-UP, NOT A LIST. If Zaal corrects himself three times while a
 * build runs, the LAST correction is the one he means; a queue of three would run
 * three builds and open three PRs. Replacing is the honest behavior, and the
 * reply says so.
 */

import { featureRan } from './feature-ran';

export interface ActiveBuild {
  /** Hermes run id, once the runner has created it. */
  runId?: string;
  /** What is being built - echoed back so a status reply is specific. */
  task: string;
  startedAt: number;
  /** Latest phase line, for "what is it doing right now". */
  phase: string;
  /** Set when Zaal asks to stop. The runner polls this between attempts. */
  cancelRequested: boolean;
  /** The one pending correction, if any. */
  followUp?: string;
}

const active = new Map<number, ActiveBuild>();

/** Messages that mean "stop", not "here is a correction". */
const STOP_WORDS = ['stop', 'cancel', 'abort', 'nevermind', 'never mind', 'no stop', 'kill it'];

export function isStopRequest(message: string): boolean {
  const t = (message || '').trim().toLowerCase().replace(/[.!]+$/, '');
  if (!t || t.length > 24) return false; // a long message is a correction, not a stop
  return STOP_WORDS.includes(t) || STOP_WORDS.some((w) => t === `${w} it` || t === `${w} please`);
}

export function beginBuild(chatId: number, task: string): ActiveBuild {
  featureRan('dm-build', `chat ${chatId}`);
  const b: ActiveBuild = {
    task,
    startedAt: Date.now(),
    phase: 'starting',
    cancelRequested: false,
  };
  active.set(chatId, b);
  return b;
}

export function getActiveBuild(chatId: number): ActiveBuild | undefined {
  return active.get(chatId);
}

export function setRunId(chatId: number, runId: string): void {
  const b = active.get(chatId);
  if (b) b.runId = runId;
}

export function setPhase(chatId: number, phase: string): void {
  const b = active.get(chatId);
  if (b) b.phase = phase;
}

/** Ask the current run to stop. Returns false if there is nothing running. */
export function requestCancel(chatId: number): boolean {
  const b = active.get(chatId);
  if (!b) return false;
  b.cancelRequested = true;
  return true;
}

export function isCancelRequested(chatId: number): boolean {
  return active.get(chatId)?.cancelRequested === true;
}

/** Store a correction to run once the current build finishes. Replaces any
 *  earlier one - see the header: the last correction is the one he means. */
export function queueFollowUp(chatId: number, text: string): { replaced: boolean } {
  const b = active.get(chatId);
  if (!b) return { replaced: false };
  const replaced = b.followUp !== undefined;
  b.followUp = text;
  return { replaced };
}

/** Take the queued follow-up and clear the slot, so it can only run once. */
export function takeFollowUp(chatId: number): string | undefined {
  const b = active.get(chatId);
  if (!b?.followUp) return undefined;
  const t = b.followUp;
  b.followUp = undefined;
  return t;
}

export function endBuild(chatId: number): void {
  active.delete(chatId);
}

/** Human-readable elapsed time, for a status reply that is worth reading. */
export function describeActive(b: ActiveBuild): string {
  const secs = Math.round((Date.now() - b.startedAt) / 1000);
  const elapsed = secs < 90 ? `${secs}s` : `${Math.round(secs / 60)}m`;
  return `${b.phase} - ${elapsed} in\n"${b.task.slice(0, 120)}"`;
}

/** Test seam only. Never call from the bot. */
export function __resetAllBuilds(): void {
  active.clear();
}
