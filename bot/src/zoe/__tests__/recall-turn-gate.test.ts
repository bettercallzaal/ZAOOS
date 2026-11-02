// @vitest-environment node
// The one predicate that decides whether a turn reads Bonfire recall. It was
// an inline condition in index.ts until 1 Nov 2026, so nothing could pin it;
// a review that removed the private check found the touched tests still green.
import { describe, expect, it } from 'vitest';
import { recallAllowedForTurn } from '../recall';

const LONG = 'what does the zao do for independent artists';

describe('recallAllowedForTurn', () => {
  it('allows a substantive private (Zaal DM) message', () => {
    expect(recallAllowedForTurn('private', LONG, false)).toBe(true);
  });

  it('refuses every non-private scope: Telegram group, member DM, Discord, board', () => {
    for (const scope of ['-1000000000001', 'member-dm-424242', 'discord:123456', 'discord-dm:424242', 'cowork-board-untrusted']) {
      expect(recallAllowedForTurn(scope, LONG, false)).toBe(false);
    }
  });

  it('refuses a short ack and a link-research message even in private', () => {
    expect(recallAllowedForTurn('private', 'ok', false)).toBe(false);
    expect(recallAllowedForTurn('private', '   y  ', false)).toBe(false);
    expect(recallAllowedForTurn('private', LONG, true)).toBe(false);
  });
});
