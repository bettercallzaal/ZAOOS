// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Client, MessageMentions } from 'discord.js';
import {
  communityAskOutcome,
  discordChannelRead,
  discordScopeFor,
  discordShouldReply,
  discordTurnAllowed,
  discordTurnsPerHour,
  DISCORD_DEFAULT_PER_HOUR,
  formatChannelContext,
  mentionsZoe,
} from '../discord-scope';
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
  const intents = src.slice(src.indexOf('intents: ['), src.indexOf('],\n  });', src.indexOf('intents: [')));
  it('asks for Message Content only behind the channel-read switch (Zaal, 2026-10-18)', () => {
    expect(intents).toContain('GatewayIntentBits.DirectMessages');
    expect(intents).toContain('...(CHANNEL_READ ? [GatewayIntentBits.MessageContent] : [])');
  });
  it('fetches channel context only for guild channels, and only when channel read is on', () => {
    expect(src).toContain('if (CHANNEL_READ && !message.channel.isDMBased())');
    const fetchAt = src.indexOf('messages.fetch(');
    expect(fetchAt).toBeGreaterThan(src.indexOf('discordScopeFor({'));
    expect(fetchAt).toBeLessThan(src.indexOf('runConciergeTurn({'));
    expect(src).toContain('message: channelContext + messageText');
  });
  it('channel context does not change the memory scope: the turn still loads the channel scope', () => {
    expect(src).toContain('const blocks = await buildMemoryBlocks(scope, chatTitle);');
    expect(src).not.toMatch(/buildMemoryBlocks\('private'/);
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

// Real discord.js MessageMentions (14.14.0), no login: a client whose user
// cache holds ZOE, and a message object carrying that client.
describe('mentionsZoe (evaluator, #3998)', () => {
  const BOT = '900000000000000001';
  const client = new Client({ intents: [] });
  // biome-ignore lint/suspicious/noExplicitAny: private cache API, test only
  (client.users as any)._add({ id: BOT, username: 'ZOE', bot: true });
  const mentions = (users: string[], everyone: boolean) =>
    // The constructor is private in the typings; it is the class discord.js builds per message.
    // biome-ignore lint/suspicious/noExplicitAny: private constructor and minimal message shape, test only
    new (MessageMentions as any)({ client, guild: null }, users.map((id) => ({ id, username: 'u' })), [], everyone) as MessageMentions;

  it('an @everyone message does NOT trigger ZOE', () => {
    expect(mentionsZoe(mentions([], true), BOT)).toBe(false);
  });
  it('control: the bare has() the adapter used to call DOES treat @everyone as a mention', () => {
    expect(mentions([], true).has(BOT)).toBe(true);
  });
  it('a direct @ZOE mention triggers, with or without @everyone in it', () => {
    expect(mentionsZoe(mentions([BOT], false), BOT)).toBe(true);
    expect(mentionsZoe(mentions([BOT], true), BOT)).toBe(true);
  });
  it('a mention of someone else does not trigger', () => {
    expect(mentionsZoe(mentions(['222'], false), BOT)).toBe(false);
  });
  it('no bot id yet (client not ready) never triggers', () => {
    expect(mentionsZoe(mentions([BOT], true), undefined)).toBe(false);
  });
  it('wiring: discord.ts triggers channel replies through mentionsZoe, not a bare has()', () => {
    const src = readFileSync(new URL('../discord.ts', import.meta.url), 'utf8');
    expect(src).toContain('mentionsZoe(message.mentions, client.user?.id)');
    expect(src).not.toContain('mentions.has(');
  });
});

describe('discordChannelRead', () => {
  it.each([
    [undefined, true],
    ['1', true],
    ['', true],
    ['0', false],
  ])('DISCORD_CHANNEL_READ=%s -> %s', (v, want) => {
    expect(discordChannelRead(v === undefined ? {} : { DISCORD_CHANNEL_READ: v })).toBe(want);
  });
});

describe('formatChannelContext', () => {
  it('lists the channel oldest first, then marks the message to answer', () => {
    const out = formatChannelContext([
      { author: 'ana', content: 'when is the next fractal?' },
      { author: 'ZOE', content: 'Monday' },
    ]);
    expect(out).toBe(
      'Recent messages in this channel, oldest first:\nana: when is the next fractal?\nZOE: Monday\n\nThe message to answer:\n',
    );
  });
  it('drops empty messages (attachments, embeds) and collapses whitespace', () => {
    const out = formatChannelContext([
      { author: 'a', content: '   ' },
      { author: 'b', content: 'two\n\nlines' },
    ]);
    expect(out).toContain('b: two lines');
    expect(out).not.toContain('a:');
  });
  it('nothing to show gives an empty string, so the question goes alone', () => {
    expect(formatChannelContext([])).toBe('');
    expect(formatChannelContext([{ author: 'a', content: '' }])).toBe('');
  });
  it('over the cap, the oldest lines go first and the newest stay', () => {
    const msgs = Array.from({ length: 40 }, (_, i) => ({ author: `u${i}`, content: 'x'.repeat(200) }));
    const out = formatChannelContext(msgs);
    expect(out.length).toBeLessThan(3200);
    expect(out).toContain('u39:');
    expect(out).not.toContain('u0:');
  });
});

describe('(a) reading a channel never makes ZOE reply in it (Zaal, 2026-10-18, option A)', () => {
  it('a guild message with no @mention of ZOE gets no reply', () => {
    expect(discordShouldReply({ isDM: false, isGuildText: true, mentioned: false })).toBe(false);
  });
  it('an @mention of ZOE in a guild text channel gets a reply', () => {
    expect(discordShouldReply({ isDM: false, isGuildText: true, mentioned: true })).toBe(true);
  });
  it('a DM gets a reply', () => {
    expect(discordShouldReply({ isDM: true, isGuildText: false, mentioned: false })).toBe(true);
  });
  it('a mention outside a guild text channel (thread, voice, forum) gets no reply', () => {
    expect(discordShouldReply({ isDM: false, isGuildText: false, mentioned: true })).toBe(false);
  });
  it('wiring: nothing replies, types or fetches before the reply gate returns', () => {
    const src = readFileSync(new URL('../discord.ts', import.meta.url), 'utf8');
    const gate = src.indexOf('if (!triggered) return;');
    expect(src.indexOf('const triggered = discordShouldReply({')).toBeGreaterThan(-1);
    expect(gate).toBeGreaterThan(src.indexOf("client.on('messageCreate'"));
    for (const effect of ['message.reply(', 'sendTyping()', 'messages.fetch(', 'runConciergeTurn({']) {
      expect(src.indexOf(effect, src.indexOf("client.on('messageCreate'"))).toBeGreaterThan(gate);
    }
  });
});

describe('(b) no private memory reaches a guild reply', () => {
  it('a guild message is never private scope, from anyone, Zaal included', () => {
    for (const authorId of [OWNER, '999']) {
      expect(discordScopeFor({ isDM: false, authorId, channelId: 'c1', ownerId: OWNER })).not.toBe('private');
    }
  });
  it('wiring: memory is loaded only through that scope, never as a literal private', () => {
    const src = readFileSync(new URL('../discord.ts', import.meta.url), 'utf8');
    expect(src.match(/buildMemoryBlocks\(/g)).toHaveLength(1);
    expect(src).toContain('const blocks = await buildMemoryBlocks(scope, chatTitle);');
  });
  it('the channel context block holds only that channel\'s own messages', () => {
    const out = formatChannelContext([{ author: 'ana', content: 'hi' }]);
    expect(out.split('\n').filter((l) => l.includes(':') && !l.startsWith('Recent') && !l.startsWith('The message'))).toEqual([
      'ana: hi',
    ]);
  });
});
