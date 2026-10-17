// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { communityAskOutcome, discordScopeFor, discordTurnAllowed, discordTurnsPerHour, DISCORD_DEFAULT_PER_HOUR } from '../discord-scope';
import { newMemberDmLimiter } from '../member-dm';

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

// Doc 2685 D1: before 2026-10-17 any Discord user got unlimited model turns.
describe('discordTurnAllowed', () => {
  it('a non-owner gets perHour turns in an hour, then is refused', () => {
    const lim = newMemberDmLimiter();
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i++) expect(discordTurnAllowed(lim, '222', OWNER, t0 + i, 3)).toBe(true);
    expect(discordTurnAllowed(lim, '222', OWNER, t0 + 10, 3)).toBe(false);
  });
  it('the window slides: an hour later the same user is allowed again', () => {
    const lim = newMemberDmLimiter();
    expect(discordTurnAllowed(lim, '222', OWNER, 0, 1)).toBe(true);
    expect(discordTurnAllowed(lim, '222', OWNER, 1_000, 1)).toBe(false);
    expect(discordTurnAllowed(lim, '222', OWNER, 60 * 60 * 1000 + 1, 1)).toBe(true);
  });
  it('users are counted separately', () => {
    const lim = newMemberDmLimiter();
    expect(discordTurnAllowed(lim, '222', OWNER, 0, 1)).toBe(true);
    expect(discordTurnAllowed(lim, '333', OWNER, 0, 1)).toBe(true);
  });
  it('Zaal is never limited, and is not counted', () => {
    const lim = newMemberDmLimiter();
    for (let i = 0; i < 50; i++) expect(discordTurnAllowed(lim, OWNER, OWNER, i, 1)).toBe(true);
    expect(lim.turns.size).toBe(0);
  });
  it('with no owner id configured, nobody is exempt', () => {
    const lim = newMemberDmLimiter();
    expect(discordTurnAllowed(lim, OWNER, undefined, 0, 1)).toBe(true);
    expect(discordTurnAllowed(lim, OWNER, undefined, 1, 1)).toBe(false);
  });
  it('snowflake ids keep their full precision as string keys', () => {
    const lim = newMemberDmLimiter();
    // These differ only past 2^53, so as Numbers they would collide.
    expect(discordTurnAllowed(lim, '1234567890123456789', OWNER, 0, 1)).toBe(true);
    expect(discordTurnAllowed(lim, '1234567890123456788', OWNER, 0, 1)).toBe(true);
  });
});

describe('discordTurnsPerHour', () => {
  it.each([
    [undefined, DISCORD_DEFAULT_PER_HOUR],
    ['12', 12],
    ['2.9', 2],
    ['0', DISCORD_DEFAULT_PER_HOUR],
    ['abc', DISCORD_DEFAULT_PER_HOUR],
    ['Infinity', DISCORD_DEFAULT_PER_HOUR],
  ])('%s -> %s', (raw, want) => {
    expect(discordTurnsPerHour(raw === undefined ? {} : { DISCORD_TURNS_PER_HOUR: raw })).toBe(want);
  });
});

describe('discord.ts wiring (read as text; the module boots a client)', () => {
  const src = readFileSync(new URL('../discord.ts', import.meta.url), 'utf8');
  const intents = src.slice(src.indexOf('intents: ['), src.indexOf(']', src.indexOf('intents: [')));
  it('asks for no privileged Message Content intent (doc 2685 D2)', () => {
    expect(intents).toContain('GatewayIntentBits.DirectMessages');
    expect(intents).not.toContain('MessageContent');
  });
  it('checks the turn cap before any model work', () => {
    const cap = src.indexOf('discordTurnAllowed(');
    expect(cap).toBeGreaterThan(-1);
    expect(cap).toBeLessThan(src.indexOf('runConciergeTurn({'));
    expect(cap).toBeLessThan(src.indexOf('sendTyping()'));
  });
  it('announces the first reply per boot (doc 2685 D3)', () => {
    expect(src).toContain("featureRan('discord-reply'");
  });
});
