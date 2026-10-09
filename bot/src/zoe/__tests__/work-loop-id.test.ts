// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

let tmp: string;
beforeEach(async () => {
  tmp = join(tmpdir(), 'zoe-wl-id-' + Math.random().toString(36).slice(2));
  await fs.mkdir(tmp, { recursive: true });
  vi.stubEnv('ZOE_HOME', tmp);
});
afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await fs.rm(tmp, { recursive: true, force: true });
});

describe('work item ids', () => {
  // Found 2026-10-10 by the #3868 review: ids were 'wk-' + Date.now() alone,
  // so two items queued in the same millisecond shared an id, and finishing
  // one (the queue is filtered by id) silently removed the other too.
  it('two items queued in the same millisecond get different ids', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1760000000000);
    const { enqueueWork } = await import('../work-loop');
    const a = await enqueueWork('first');
    const b = await enqueueWork('second');
    expect(a.id).toMatch(/^wk-/);
    expect(b.id).not.toBe(a.id);
  });
});
