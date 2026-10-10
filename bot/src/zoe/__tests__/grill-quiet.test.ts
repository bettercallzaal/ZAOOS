import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory state file (same shape as grill-blocked-send.test.ts).
const files = new Map<string, string>();
vi.mock('node:fs', () => ({
  promises: {
    readFile: async (p: string) => {
      const v = files.get(p);
      if (v === undefined) throw new Error('ENOENT');
      return v;
    },
    writeFile: async (p: string, data: string) => {
      files.set(p, data);
    },
    mkdir: async () => undefined,
  },
}));

import { surfaceGrill, type GrillEvent } from '../grill';

const EVENT: GrillEvent = { key: 'evt-1', title: '5:30pm - Promotions Committee' };
const NIGHT = Date.parse('2026-10-14T03:00:00Z'); // 23:00 Eastern
const DAY = Date.parse('2026-10-13T18:00:00Z'); // 14:00 Eastern
const deps = (now: number, sendDM: () => Promise<unknown>, extra: Record<string, unknown> = {}) => ({
  sendDM,
  now,
  fetchTasks: async () => [],
  fetchPRs: async () => [],
  fetchEvents: async () => [EVENT],
  ...extra,
});

describe('surfaceGrill and the quiet window', () => {
  beforeEach(() => files.clear());
  afterEach(() => vi.unstubAllEnvs());

  it('at night the grill does not even try to send', async () => {
    vi.stubEnv('ZOE_QUIET', '1');
    const send = vi.fn(async () => ({ message_id: 1 }));
    expect(await surfaceGrill(deps(NIGHT, send))).toEqual({ sent: false });
    expect(send).not.toHaveBeenCalled();
  });

  it('/grill (bypassCap) is him asking: it still answers at night', async () => {
    vi.stubEnv('ZOE_QUIET', '1');
    const send = vi.fn(async () => ({ message_id: 1 }));
    expect((await surfaceGrill(deps(NIGHT, send, { bypassCap: true }))).sent).toBe(true);
  });

  it('in the daytime it sends as before', async () => {
    vi.stubEnv('ZOE_QUIET', '1');
    const send = vi.fn(async () => ({ message_id: 1 }));
    expect((await surfaceGrill(deps(DAY, send))).sent).toBe(true);
  });

  it('red control: flag off, the grill sends at night', async () => {
    const send = vi.fn(async () => ({ message_id: 1 }));
    expect((await surfaceGrill(deps(NIGHT, send))).sent).toBe(true);
  });
});
