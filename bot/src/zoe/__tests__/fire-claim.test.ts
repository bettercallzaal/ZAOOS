import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { claimFireIn, releaseFireIn } from '../fire-claim';

// seat-merge on #4281: claimFire had no behavioural test.
describe('claimFireIn', () => {
  const root = mkdtempSync(join(tmpdir(), 'zoe-fire-claim-'));
  afterAll(() => {
    if (root) rmSync(root, { recursive: true, force: true });
  });
  const day1 = new Date('2026-11-08T00:10:00Z');
  const day2 = new Date('2026-11-09T00:10:00Z');

  it('wins once a day: a second claim the same day returns false', async () => {
    const dir = join(root, 'a');
    expect(await claimFireIn(dir, 'group-memory-roll', day1)).toBe(true);
    expect(await claimFireIn(dir, 'group-memory-roll', day1)).toBe(false);
    expect(await claimFireIn(dir, 'other-trigger', day1)).toBe(true);
    expect(await claimFireIn(dir, 'group-memory-roll', day2)).toBe(true);
  });

  it('a released claim can be won again', async () => {
    const dir = join(root, 'b');
    expect(await claimFireIn(dir, 't', day1)).toBe(true);
    await releaseFireIn(dir, 't', day1);
    expect(await claimFireIn(dir, 't', day1)).toBe(true);
    await expect(releaseFireIn(join(root, 'missing'), 't', day1)).resolves.toBeUndefined();
  });

  it('an unwritable sentinel dir returns false and logs, never throws', async () => {
    const blocker = join(root, 'not-a-dir');
    writeFileSync(blocker, 'x');
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(claimFireIn(join(blocker, 'sentinels'), 't', day1)).resolves.toBe(false);
    expect(err).toHaveBeenCalledWith(expect.stringContaining('could not claim t'));
    err.mockRestore();
  });

  it('an already-claimed day does not log an error', async () => {
    const dir = join(root, 'c');
    await claimFireIn(dir, 't', day1);
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await claimFireIn(dir, 't', day1)).toBe(false);
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
  });
});
