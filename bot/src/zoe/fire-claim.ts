/**
 * fire-claim.ts - once-a-day claims for scheduler.ts jobs (doc 770 MED).
 *
 * Moved out of scheduler.ts unchanged in shape so it can be tested by
 * behaviour (seat-merge on #4281: with claimFire forced to return true, no
 * test failed). A claim writes <dir>/<trigger>-<yyyy-mm-dd>.flag with O_EXCL
 * ('wx') BEFORE the side effect, so a restart mid-send cannot double-fire and
 * two racing ticks cannot both proceed. The day is the UTC date.
 *
 * One change: a claim that cannot be written for any reason other than "already
 * claimed today" (an unwritable or missing dir) returns false and logs at error
 * level. Before, a failed mkdir threw out of the cron callback.
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

export function sentinelPathIn(dir: string, trigger: string, now: Date = new Date()): string {
  return join(dir, `${trigger}-${now.toISOString().slice(0, 10)}.flag`);
}

/** True iff THIS call won today's claim. Never throws. */
export async function claimFireIn(dir: string, trigger: string, now: Date = new Date()): Promise<boolean> {
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(sentinelPathIn(dir, trigger, now), now.toISOString(), { flag: 'wx' });
    return true;
  } catch (e) {
    const code = (e as NodeJS.ErrnoException)?.code;
    if (code !== 'EEXIST') {
      console.error(`[zoe/fire-claim] could not claim ${trigger}: ${code ?? (e as Error)?.message}`);
    }
    return false;
  }
}

/** Release a claim so a later tick can retry. Never throws. */
export async function releaseFireIn(dir: string, trigger: string, now: Date = new Date()): Promise<void> {
  try {
    await fs.unlink(sentinelPathIn(dir, trigger, now));
  } catch {
    // already gone - nothing to release
  }
}
