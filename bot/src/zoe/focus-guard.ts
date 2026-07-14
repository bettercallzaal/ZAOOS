/**
 * focus-guard.ts — Hyperfocus protection for Zaal's deep work.
 *
 * When Zaal sends /focus (or /focus on), ZOE enters focus mode:
 * - All non-urgent pings are SUPPRESSED (not sent)
 * - Captures, ideas, and non-urgent notifications are QUEUED
 * - When focus ends (/focus off), queued items surface in ONE calm digest
 *
 * Urgent/ACT-NOW items ALWAYS get through (never queued).
 *
 * Storage: ~/.zao/zoe/focus_state.json
 * { focusMode: boolean; queuedPings: string[]; startedAt: string | null }
 */

import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface FocusState {
  focusMode: boolean;
  queuedPings: string[];
  startedAt: string | null; // ISO timestamp when focus began
}

function focusStateFile(): string {
  return join(homedir(), '.zao', 'zoe', 'focus_state.json');
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(join(homedir(), '.zao', 'zoe'), { recursive: true });
}

const DEFAULT_STATE: FocusState = {
  focusMode: false,
  queuedPings: [],
  startedAt: null,
};

/**
 * Read the current focus state. Returns default if file doesn't exist.
 */
export async function readFocusState(): Promise<FocusState> {
  try {
    const raw = await fs.readFile(focusStateFile(), 'utf8');
    const parsed = JSON.parse(raw);
    return {
      focusMode: Boolean(parsed.focusMode),
      queuedPings: Array.isArray(parsed.queuedPings) ? parsed.queuedPings : [],
      startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : null,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

/**
 * Write focus state to disk. Defensive: ensures dir exists.
 */
async function writeFocusState(state: FocusState): Promise<void> {
  await ensureDir();
  await fs.writeFile(focusStateFile(), JSON.stringify(state, null, 2));
}

/**
 * Enable focus mode. Records when it started.
 */
export async function startFocus(): Promise<void> {
  const state = await readFocusState();
  state.focusMode = true;
  state.queuedPings = [];
  state.startedAt = new Date().toISOString();
  await writeFocusState(state);
}

/**
 * Disable focus mode and return all queued pings (cleared from state).
 * Returns empty array if focus mode was not active.
 */
export async function endFocus(): Promise<string[]> {
  const state = await readFocusState();
  const queued = [...state.queuedPings];
  state.focusMode = false;
  state.queuedPings = [];
  state.startedAt = null;
  await writeFocusState(state);
  return queued;
}

/**
 * Check if focus mode is active. If true, non-urgent pings should be queued.
 */
export async function isFocusMode(): Promise<boolean> {
  const state = await readFocusState();
  return state.focusMode;
}

/**
 * Queue a ping (suppress it now, surface on focus end).
 * Only call this for NON-URGENT items. Urgent items bypass queueing entirely.
 */
export async function queuePing(pingText: string): Promise<void> {
  const state = await readFocusState();
  if (state.focusMode) {
    state.queuedPings.push(pingText);
    await writeFocusState(state);
  }
}

/**
 * Check if a message/ping should be queued or sent immediately.
 *
 * Returns:
 * - 'send' = send immediately (focus off, or urgent item)
 * - 'queue' = queue until focus ends
 *
 * Usage: before sending a non-urgent ping, call this. If it returns 'queue',
 * call queuePing() instead of sending.
 *
 * CRITICAL: ACT-NOW / urgent items must NEVER be queued. Only non-urgent
 * info/updates/ideas get queued.
 */
export async function decideQueueOrSend(isUrgent: boolean = false): Promise<'send' | 'queue'> {
  if (isUrgent) return 'send'; // Urgent always sends
  const inFocus = await isFocusMode();
  return inFocus ? 'queue' : 'send';
}

/**
 * Build a summary of queued pings for the end-of-focus digest.
 * Groups them for readability.
 */
export function buildFocusDigest(queuedPings: string[]): string {
  if (queuedPings.length === 0) {
    return 'No queued updates from your focus window.';
  }

  if (queuedPings.length === 1) {
    return `While you were focused: 1 update:\n\n${queuedPings[0]}`;
  }

  const listed = queuedPings.map((p) => `- ${p}`).join('\n');
  return `While you were focused: ${queuedPings.length} updates:\n\n${listed}`;
}
