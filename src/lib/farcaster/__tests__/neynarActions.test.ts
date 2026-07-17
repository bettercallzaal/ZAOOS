// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  blockUserAction,
  deleteCastAction,
  followUser,
  getCastSummary,
  likeCast,
  muteUserAction,
  publishCast,
  recastCast,
  unblockUserAction,
  unmuteUserAction,
} from '../neynarActions';

const CASES = [
  {
    name: 'publishCast',
    fn: () => publishCast('hello', ['https://link.com']),
    endpoint: '/api/neynar/cast',
    method: 'POST',
    body: { text: 'hello', embeds: ['https://link.com'] },
    errorMsg: 'Failed to publish cast',
  },
  {
    name: 'publishCast defaults embeds to []',
    fn: () => publishCast('hi'),
    endpoint: '/api/neynar/cast',
    method: 'POST',
    body: { text: 'hi', embeds: [] },
    errorMsg: 'Failed to publish cast',
  },
  {
    name: 'likeCast',
    fn: () => likeCast('0xabc'),
    endpoint: '/api/neynar/like',
    method: 'POST',
    body: { castHash: '0xabc' },
    errorMsg: 'Failed to like cast',
  },
  {
    name: 'recastCast',
    fn: () => recastCast('0xdef'),
    endpoint: '/api/neynar/recast',
    method: 'POST',
    body: { castHash: '0xdef' },
    errorMsg: 'Failed to recast',
  },
  {
    name: 'followUser',
    fn: () => followUser(42),
    endpoint: '/api/neynar/follow',
    method: 'POST',
    body: { targetFid: 42 },
    errorMsg: 'Failed to follow user',
  },
  {
    name: 'muteUserAction',
    fn: () => muteUserAction(7),
    endpoint: '/api/users/mute',
    method: 'POST',
    body: { targetFid: 7 },
    errorMsg: 'Failed to mute user',
  },
  {
    name: 'unmuteUserAction',
    fn: () => unmuteUserAction(7),
    endpoint: '/api/users/mute',
    method: 'DELETE',
    body: { targetFid: 7 },
    errorMsg: 'Failed to unmute user',
  },
  {
    name: 'blockUserAction',
    fn: () => blockUserAction(99),
    endpoint: '/api/users/block',
    method: 'POST',
    body: { targetFid: 99 },
    errorMsg: 'Failed to block user',
  },
  {
    name: 'unblockUserAction',
    fn: () => unblockUserAction(99),
    endpoint: '/api/users/block',
    method: 'DELETE',
    body: { targetFid: 99 },
    errorMsg: 'Failed to unblock user',
  },
  {
    name: 'deleteCastAction',
    fn: () => deleteCastAction('0xhash'),
    endpoint: '/api/casts/delete',
    method: 'POST',
    body: { castHash: '0xhash' },
    errorMsg: 'Failed to delete cast',
  },
  {
    name: 'getCastSummary',
    fn: () => getCastSummary('0xhash'),
    endpoint: '/api/casts/summary',
    method: 'POST',
    body: { castHash: '0xhash' },
    errorMsg: 'Failed to get summary',
  },
];

describe('neynarActions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe.each(CASES)('$name', (c) => {
    it('resolves with JSON on success', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ ok: true }),
        }),
      );

      const result = await c.fn();
      expect(result).toEqual({ ok: true });

      const [calledUrl, calledOpts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
        string,
        RequestInit,
      ];
      expect(calledUrl).toBe(c.endpoint);
      expect(calledOpts.method).toBe(c.method);
      expect(JSON.parse(calledOpts.body as string)).toEqual(c.body);
    });

    it('throws with error message on non-ok response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: () => Promise.resolve({}),
        }),
      );

      await expect(c.fn()).rejects.toThrow(c.errorMsg);
    });
  });
});
