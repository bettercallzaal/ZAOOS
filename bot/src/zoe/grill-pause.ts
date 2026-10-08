/**
 * grill-pause.ts - one button, always on the grill, that stops it.
 *
 * Zaal, 2026-10-07: "have one button be there always to stop grill". Every grill
 * message (the cockpit grill in grill.ts and the backlog cards in
 * backlog-grill-runner.ts) carries a Stop grill row. Tapping it writes a pause
 * file; every grill send reads that file first and sends nothing while it says
 * paused. Resume clears it. A file, not memory, because the bot restarts many
 * times a day (25 boots on 2026-10-06) and an in-memory pause would quietly
 * lift itself on the next deploy.
 *
 * Off unless ZOE_GRILL_STOP=1. With the flag off there is no button and the
 * file is never read, so behaviour is exactly what it was.
 */

import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

export type Button = { text: string; data: string };

export function grillStopEnabled(): boolean {
  return process.env.ZOE_GRILL_STOP === '1';
}

function pausePath(): string {
  return process.env.ZOE_GRILL_PAUSE_PATH || join(homedir(), '.zao', 'zoe', 'grill-pause.json');
}

/**
 * True while Zaal has the grill stopped. A missing file is "not paused". A file
 * that exists but cannot be read or parsed counts as PAUSED: the failure to
 * avoid is pings resuming after he said stop, not one quiet morning.
 */
export async function isGrillPaused(): Promise<boolean> {
  if (!grillStopEnabled()) return false;
  let raw: string;
  try {
    raw = await fs.readFile(pausePath(), 'utf8');
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return false;
    console.error('[zoe/grill-pause] pause file unreadable, holding the pause:', (error as Error)?.message);
    return true;
  }
  try {
    return (JSON.parse(raw) as { paused?: unknown }).paused !== false;
  } catch {
    console.error('[zoe/grill-pause] pause file is not JSON, holding the pause');
    return true;
  }
}

/** Store the pause. Written to a temp file then renamed, so a crash never leaves half a file. */
export async function setGrillPaused(paused: boolean, now = Date.now()): Promise<void> {
  const path = pausePath();
  await fs.mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  await fs.writeFile(tmp, JSON.stringify({ paused, at: new Date(now).toISOString() }));
  await fs.rename(tmp, path);
}

export const STOP_ROW: Button[] = [{ text: 'Stop grill', data: 'gpause:stop' }];
export const RESUME_ROW: Button[] = [{ text: 'Resume grill', data: 'gpause:resume' }];

/** Append the Stop grill row to a grill keyboard when the flag is on. */
export function withStopRow(buttons: Button[][]): Button[][] {
  return grillStopEnabled() ? [...buttons, STOP_ROW] : buttons;
}
