import { describe, it, expect, vi } from 'vitest';
// Mock the heavy deps so loading mention-listener does not pull the full caster/grammy chain.
vi.mock('../index', () => ({ runCasterPipeline: vi.fn() }));
vi.mock('../../farcaster/event-stream', () => ({ subscribeToCasts: vi.fn() }));

import { mentionToTrigger } from '../mention-listener';
import type { IncomingCast } from '../../farcaster/event-stream';

const cast: IncomingCast = {
  fid: 42,
  hash: '0xabc123' as `0x${string}`,
  text: 'hey @zolbot what is good in the ZAO music scene?',
  mentions: [3338501],
};

describe('mentionToTrigger', () => {
  it('maps a mention into a reply trigger (parent set to the mentioner)', () => {
    const t = mentionToTrigger(cast, { zaalId: 1, persona: 'You are ZOL' });
    expect(t.agentId).toBe('zol');
    expect(t.persona).toBe('You are ZOL');
    expect(t.context).toBe(cast.text);
    expect(t.parent).toEqual({ fid: 42, hash: '0xabc123' });
  });
  it('honors agentId + model overrides', () => {
    const t = mentionToTrigger(cast, { zaalId: 1, persona: 'p', agentId: 'zol-test', model: 'x' });
    expect(t.agentId).toBe('zol-test');
    expect(t.model).toBe('x');
  });
});
