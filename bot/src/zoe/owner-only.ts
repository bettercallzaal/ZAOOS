/**
 * owner-only.ts - what a non-owner hears when they type an owner command.
 *
 * Measured 2026-09-18 (zj audit): 32 of ZOE's 34 slash commands were
 * `if (!isFromZaal(ctx)) return;`, so anyone else typing /cockpit or /board got
 * nothing at all, which reads as a broken bot. Zaal's ruling the same evening,
 * by picker: "One line: that one is Zaal's", plain, no jargon, once per user
 * per hour so it cannot be used to make ZOE spam a group.
 *
 * Pure: the limiter takes a clock and its own state, so the test needs no bot.
 */

export const OWNER_ONLY_LINE = "That one is Zaal's.";

export const OWNER_ONLY_WINDOW_MS = 60 * 60 * 1000;

export interface OwnerOnlyState {
  /** user id -> epoch ms of the last line sent to them */
  lastSent: Map<number, number>;
}

export function newOwnerOnlyState(): OwnerOnlyState {
  return { lastSent: new Map() };
}

/**
 * True when the line should be sent to this user now. Records the send.
 * The same user inside the window gets silence, which is the old behaviour
 * and the right one for a repeat.
 */
export function shouldSendOwnerOnlyLine(state: OwnerOnlyState, userId: number, nowMs: number): boolean {
  const last = state.lastSent.get(userId);
  if (last !== undefined && nowMs - last < OWNER_ONLY_WINDOW_MS) return false;
  state.lastSent.set(userId, nowMs);
  // Keep the map small: forget anyone outside the window.
  for (const [id, t] of state.lastSent) {
    if (nowMs - t >= OWNER_ONLY_WINDOW_MS) state.lastSent.delete(id);
  }
  return true;
}
