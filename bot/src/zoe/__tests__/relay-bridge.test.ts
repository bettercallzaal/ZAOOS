import { describe, it, expect, vi } from 'vitest';
import {
  pendingInbound,
  markPushed,
  appendReply,
  relayReplyQid,
  laneFromReplyQid,
  formatInboundDm,
  pushInboundRelays,
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
});
