// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { communityAskOutcome, discordScopeFor } from '../discord-scope';

const OWNER = '111';

describe('discordScopeFor', () => {
  it("is 'private' only for Zaal's own DM", () => {
    expect(discordScopeFor({ isDM: true, authorId: OWNER, channelId: 'c1', ownerId: OWNER })).toBe('private');
  });
  it('a DM from anyone else is scoped to that user, never private', () => {
    const s = discordScopeFor({ isDM: true, authorId: '222', channelId: 'c1', ownerId: OWNER });
    expect(s).toBe('discord-dm:222');
    expect(s).not.toBe('private');
  });
  it('a guild channel mention is scoped to the channel, never private, even from Zaal', () => {
    expect(discordScopeFor({ isDM: false, authorId: OWNER, channelId: 'chan9', ownerId: OWNER })).toBe('discord:chan9');
  });
  it('with no owner id configured nothing is private', () => {
    expect(discordScopeFor({ isDM: true, authorId: OWNER, channelId: 'c1', ownerId: undefined })).toBe(`discord-dm:${OWNER}`);
  });
});

describe('communityAskOutcome', () => {
  it('queues when Zaal was reached', () => {
    expect(communityAskOutcome(true)).toBe('queued');
  });
  it('holds, does not send, when Zaal could not be reached', () => {
    expect(communityAskOutcome(false)).toBe('held');
  });
});
