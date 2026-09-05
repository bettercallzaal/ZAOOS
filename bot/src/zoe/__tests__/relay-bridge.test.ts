import { describe, it, expect, vi } from 'vitest';
import {
  pendingInbound,
  markPushed,
  appendReply,
  relayReplyQid,
  laneFromReplyQid,
  formatInboundDm,
  pushInboundRelays,
  tryInstantRelayReply,
  type RelayMsg,
} from '../relay-bridge';

const rel = (o: Partial<RelayMsg>): RelayMsg => ({
  from: 'cowork',
  to: 'zoe',
  msg: 'hi',
  ts: '2026-07-29T13:00:00Z',
  ...o,
});

describe('pendingInbound', () => {
  it('returns only zoe-addressed relays not yet pushed to TG', () => {
    const relays = [
      rel({ to: 'zoe', tg_pushed: false, ts: 'a' }),
      rel({ to: 'zoe', tg_pushed: true, ts: 'b' }), // already pushed
      rel({ to: 'cowork', tg_pushed: false, ts: 'c' }), // not for zoe
      rel({ to: 'zoe', ts: 'd' }), // undefined tg_pushed = pending
    ];
    expect(pendingInbound(relays).map((r) => r.ts)).toEqual(['a', 'd']);
  });

  it('ignores the read flag (a terminal-read relay can still be unpushed)', () => {
    const relays = [rel({ to: 'zoe', read: true, tg_pushed: false, ts: 'x' })];
    expect(pendingInbound(relays).map((r) => r.ts)).toEqual(['x']);
  });
});

describe('markPushed', () => {
  it('sets tg_pushed only on the matched timestamps, immutably', () => {
    const relays = [rel({ ts: 'a' }), rel({ ts: 'b' }), rel({ ts: 'c' })];
    const out = markPushed(relays, new Set(['a', 'c']));
    expect(out.map((r) => Boolean(r.tg_pushed))).toEqual([true, false, true]);
    expect(relays.every((r) => r.tg_pushed === undefined)).toBe(true); // original untouched
  });
});

describe('appendReply', () => {
  it('appends a zoe->lane reply with read:false, immutably', () => {
    const relays = [rel({ ts: 'a' })];
    const out = appendReply(relays, 'cowork', 'on it', 'z');
    expect(out).toHaveLength(2);
    expect(out[1]).toEqual({ from: 'zoe', to: 'cowork', msg: 'on it', ts: 'z', read: false });
    expect(relays).toHaveLength(1); // original untouched
  });
});

describe('qid encode/decode', () => {
  it('round-trips a lane through the qid', () => {
    expect(relayReplyQid('cowork')).toBe('rl-cowork');
    expect(laneFromReplyQid('rl-cowork')).toBe('cowork');
    expect(laneFromReplyQid('rl-zabalgamez')).toBe('zabalgamez');
  });

  it('rejects non-relay qids', () => {
    expect(laneFromReplyQid('q1')).toBeNull();
    expect(laneFromReplyQid('research-topic')).toBeNull();
    expect(laneFromReplyQid('rl-')).toBeNull(); // empty lane
  });

  it('qid never contains the callback delimiter', () => {
    expect(relayReplyQid('cowork')).not.toContain(':');
  });
});

describe('formatInboundDm', () => {
  it('shows sender, time, and body', () => {
    const out = formatInboundDm(rel({ from: 'zoostr', msg: 'shipped', ts: '2026-07-29T13:45:00Z' }));
    expect(out).toContain('zoostr');
    expect(out).toContain('13:45');
    expect(out).toContain('shipped');
  });
});

describe('tryInstantRelayReply', () => {
  it('returns false for a non-relay qid and does no IO', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await tryInstantRelayReply('q1', 'hi', 't')).toBe(false);
    expect(await tryInstantRelayReply('research-topic', 'hi', 't')).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('routes a relay qid to its lane and returns true', async () => {
    process.env.COWORK_TRACKER_URL = 'https://x.test';
    process.env.COWORK_TRACKER_KEY = 'k';
    const hub = { id: 'h1', metadata: { relays: [] as RelayMsg[] } };
    let merged: unknown;
    let mergeUrl = '';
    const fetchMock = vi.fn(async (url: string, init?: { method?: string; body?: string }) => {
      // The write goes through the atomic relay_hub_merge RPC (POST), NOT a
      // whole-object PATCH - a PATCH of { metadata: { relays } } replaces the
      // whole metadata column and wipes metadata.holds (doc 2170 R0).
      if (init?.method === 'POST') {
        mergeUrl = url;
        merged = JSON.parse(init.body || '{}');
        return { ok: true, text: async () => '' } as unknown as Response;
      }
      return { ok: true, text: async () => JSON.stringify([hub]) } as unknown as Response;
    });
    vi.stubGlobal('fetch', fetchMock);
    const ok = await tryInstantRelayReply('rl-cowork', 'on it', 'ts1');
    expect(ok).toBe(true);
    // it hit the merge RPC, and the patch touches ONLY the relays key
    expect(mergeUrl).toContain('/rest/v1/rpc/relay_hub_merge');
    const patch = (merged as { p_patch: { relays: RelayMsg[] } }).p_patch;
    expect(Object.keys(patch)).toEqual(['relays']);
    // the appended reply targets the cowork lane with from:zoe
    expect(patch.relays.at(-1)).toMatchObject({ from: 'zoe', to: 'cowork', msg: 'on it', read: false });
    vi.unstubAllGlobals();
    delete process.env.COWORK_TRACKER_URL;
    delete process.env.COWORK_TRACKER_KEY;
  });
});

describe('pushInboundRelays', () => {
  it('returns 0 and never sends when unconfigured (no creds)', async () => {
    const prevUrl = process.env.COWORK_TRACKER_URL;
    const prevKey = process.env.COWORK_TRACKER_KEY;
    delete process.env.COWORK_TRACKER_URL;
    delete process.env.COWORK_TRACKER_KEY;
    const sendMessage = vi.fn();
    const n = await pushInboundRelays({ chatId: 123, sendMessage, now: () => 't' });
    expect(n).toBe(0);
    expect(sendMessage).not.toHaveBeenCalled();
    if (prevUrl) process.env.COWORK_TRACKER_URL = prevUrl;
    if (prevKey) process.env.COWORK_TRACKER_KEY = prevKey;
  });

  it('registers message_id -> rl-<lane> so a native reply can route back', async () => {
    process.env.COWORK_TRACKER_URL = 'https://x.test';
    process.env.COWORK_TRACKER_KEY = 'k';
    const hub = { id: 'h1', metadata: { relays: [rel({ from: 'cowork', to: 'zoe', ts: 'a', tg_pushed: false })] } };
    // GET hub -> row; PATCH -> ok. fetchHub is called twice (initial + re-fetch before mark).
    const fetchMock = vi.fn(async (_url: string, init?: { method?: string }) => {
      if (init?.method === 'PATCH') return { ok: true, text: async () => '' } as unknown as Response;
      return { ok: true, text: async () => JSON.stringify([hub]) } as unknown as Response;
    });
    vi.stubGlobal('fetch', fetchMock);
    const sendMessage = vi.fn(async () => ({ message_id: 42 }));
    const recordContext = vi.fn(async () => {});
    const armPending = vi.fn();
    const n = await pushInboundRelays({ chatId: 999, sendMessage, now: () => 't', recordContext, armPending });
    expect(n).toBe(1);
    expect(sendMessage).toHaveBeenCalledOnce();
    expect(recordContext).toHaveBeenCalledWith(42, 'rl-cowork');
    // gesture-free path: General armed so the next plain message answers this relay
    expect(armPending).toHaveBeenCalledWith(999, 'rl-cowork');
    vi.unstubAllGlobals();
    delete process.env.COWORK_TRACKER_URL;
    delete process.env.COWORK_TRACKER_KEY;
  });

  it('does NOT mark pushed (or arm the reply path) when every Telegram send fails', async () => {
    process.env.COWORK_TRACKER_URL = 'https://x.test';
    process.env.COWORK_TRACKER_KEY = 'k';
    const hub = { id: 'h1', metadata: { relays: [rel({ from: 'cowork', to: 'zoe', ts: 'a', tg_pushed: false })] } };
    const writes: string[] = [];
    const fetchMock = vi.fn(async (url: string, init?: { method?: string }) => {
      if (init?.method === 'POST') writes.push(url);
      return { ok: true, text: async () => JSON.stringify([hub]) } as unknown as Response;
    });
    vi.stubGlobal('fetch', fetchMock);
    const sendMessage = vi.fn(async () => {
      throw new Error('telegram 429');
    });
    const recordContext = vi.fn(async () => {});
    const armPending = vi.fn();
    const n = await pushInboundRelays({ chatId: 999, sendMessage, now: () => 't', recordContext, armPending });
    // the relay stays pending so the next tick retries it - not silently dropped
    expect(n).toBe(0);
    expect(writes).toEqual([]);
    expect(recordContext).not.toHaveBeenCalled();
    expect(armPending).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    delete process.env.COWORK_TRACKER_URL;
    delete process.env.COWORK_TRACKER_KEY;
  });

  it('does NOT mark pushed when the send budget dropped the send', async () => {
    process.env.COWORK_TRACKER_URL = 'https://x.test';
    process.env.COWORK_TRACKER_KEY = 'k';
    const hub = { id: 'h1', metadata: { relays: [rel({ from: 'cowork', to: 'zoe', ts: 'a', tg_pushed: false })] } };
    const writes: string[] = [];
    const fetchMock = vi.fn(async (url: string, init?: { method?: string }) => {
      if (init?.method === 'POST') writes.push(url);
      return { ok: true, text: async () => JSON.stringify([hub]) } as unknown as Response;
    });
    vi.stubGlobal('fetch', fetchMock);
    // The exact value gateSend() resolves with when a send is over the cap:
    // it neither throws nor returns null, which is what made this a silent drop.
    const sendMessage = vi.fn(async () => ({ message_id: 0, zoeSendBudget: 'dropped' }));
    const recordContext = vi.fn(async () => {});
    const armPending = vi.fn();
    const n = await pushInboundRelays({ chatId: 999, sendMessage, now: () => 't', recordContext, armPending });
    // tg_pushed is the ONLY dedup gate and is never re-evaluated - marking it
    // here would lose the relay for good. Leave it pending for the next tick.
    expect(n).toBe(0);
    expect(writes).toEqual([]);
    expect(recordContext).not.toHaveBeenCalled();
    expect(armPending).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    delete process.env.COWORK_TRACKER_URL;
    delete process.env.COWORK_TRACKER_KEY;
  });
});
