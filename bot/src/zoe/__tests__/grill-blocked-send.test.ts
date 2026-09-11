import { beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory ~/.zao/zoe/grill_state.json, so a surfaced card can be checked
// without touching the real state file.
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

import { surfaceGrill, readGrillState, type GrillEvent } from '../grill';

const NOW = Date.parse('2026-09-11T14:00:00Z');
const EVENT: GrillEvent = { key: 'evt-1', title: '5:30pm - Promotions Committee' };

function deps(sendDM: () => Promise<unknown>) {
  return {
    sendDM,
    now: NOW,
    fetchTasks: async () => [],
    fetchPRs: async () => [],
    fetchEvents: async () => [EVENT],
  };
}

/** The one write this path makes; absent means nothing was recorded. */
function state(): Record<string, unknown> | null {
  const raw = [...files.entries()].find(([p]) => p.endsWith('grill_state.json'))?.[1];
  return raw ? JSON.parse(raw) : null;
}

describe('surfaceGrill when the send budget blocks the card', () => {
  beforeEach(() => files.clear());

  it('records nothing: an unseen card must not become the one active question', async () => {
    const blocked = vi.fn(async () => ({ message_id: 0, zoeSendBudget: 'dropped' }));
    const result = await surfaceGrill(deps(blocked) as never);
    expect(blocked).toHaveBeenCalledTimes(1);
    expect(result.sent).toBe(false);
    expect(state()).toBeNull(); // no asked item, no activeKey, no daily-cap slot burned
  });

  it('the next tick offers the same card again', async () => {
    const blocked = vi.fn(async () => ({ message_id: 0, zoeSendBudget: 'deferred' }));
    await surfaceGrill(deps(blocked) as never);
    const delivered = vi.fn(async () => ({ message_id: 5 }));
    const result = await surfaceGrill(deps(delivered) as never);
    expect(result.sent).toBe(true);
    expect(result.item?.key).toBe('evt-1');
    const s = state() as { activeKey: string; items: Record<string, { status: string }> };
    expect(s.activeKey).toBe('evt-1');
    expect(s.items['evt-1'].status).toBe('asked');
  });

  it('a delivered card is recorded as asked, as before', async () => {
    const result = await surfaceGrill(deps(vi.fn(async () => ({ message_id: 9 }))) as never);
    expect(result.sent).toBe(true);
    const s = state() as { activeMessageId: number; daySurfaced: { count: number } };
    expect(s.activeMessageId).toBe(9);
    expect(s.daySurfaced.count).toBe(1);
  });
});

describe('readGrillState hands out a fresh default', () => {
  beforeEach(() => files.clear());

  it('a card written after one missing-file read is not visible to the next', async () => {
    await surfaceGrill(deps(vi.fn(async () => ({ message_id: 3 }))) as never);
    files.clear(); // the state file is gone again
    const second = await readGrillState();
    expect(second.items).toEqual({});
    expect(second.activeKey).toBeNull();
  });
});
