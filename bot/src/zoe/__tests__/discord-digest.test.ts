import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildDiscordDigest, claimDigestDay, type DigestChannel, type DigestMessage, discordDigestEnabled } from '../discord-digest';

let seq = 0;
function msg(authorId: string, content: string, extra: Partial<DigestMessage> = {}): DigestMessage {
  seq += 1;
  return {
    id: `m${seq}`,
    authorId,
    authorName: authorId === 'zaal' ? 'Zaal' : `User ${authorId}`,
    bot: false,
    content,
    createdAt: seq,
    mentionsOwner: false,
    ...extra,
  };
}
const ch = (name: string, messages: DigestMessage[], capped = false): DigestChannel => ({ id: `c-${name}`, name, messages, capped });

describe('flag', () => {
  it.each([
    [undefined, false],
    ['0', false],
    ['true', false],
    ['1', true],
  ])('ZOE_DISCORD_DIGEST=%j is %s', (v, want) => {
    expect(discordDigestEnabled({ ZOE_DISCORD_DIGEST: v } as NodeJS.ProcessEnv)).toBe(want);
  });
});

describe('buildDiscordDigest', () => {
  it('a quiet day, or one with only bot posts, sends nothing', () => {
    expect(buildDiscordDigest('ZM', 'g', [], 'zaal')).toBeNull();
    expect(buildDiscordDigest('ZM', 'g', [ch('general', [msg('zoe', 'hi', { bot: true })])], 'zaal')).toBeNull();
  });

  it('counts people messages per channel, busiest first, and people once', () => {
    const text = buildDiscordDigest(
      'ZM',
      'g',
      [ch('mixz', [msg('a', 'x')]), ch('general', [msg('a', 'x'), msg('b', 'y'), msg('zoe', 'z', { bot: true })])],
      'zaal',
    );
    expect(text?.split('\n').slice(0, 4)).toEqual(['ZM, last 24 hours: 3 messages from 2 people in 2 channels.', '', '#general: 2', '#mixz: 1']);
  });

  it('a capped channel is marked as a floor', () => {
    expect(buildDiscordDigest('ZM', 'g', [ch('general', [msg('a', 'x')], true)], 'zaal')).toContain('#general: 1+');
  });

  it('lists a question nobody answered, with a link, and not one that got an answer', () => {
    const open = msg('a', 'When is the next listening party?');
    const asked = msg('b', 'Is MixZ free?');
    const answer = msg('c', 'yes', { replyToId: asked.id });
    const followUp = msg('d', 'anyone know the stream link?');
    const someoneElse = msg('e', 'here it is');
    const text = buildDiscordDigest('ZM', 'g1', [ch('general', [open, asked, answer, followUp, someoneElse])], 'zaal') ?? '';
    expect(text).toContain('Questions nobody answered (1):');
    expect(text).toContain(`- #general, User a: "When is the next listening party?" https://discord.com/channels/g1/c-general/${open.id}`);
    expect(text).not.toContain('Is MixZ free?');
    expect(text).not.toContain('stream link');
  });

  it('a Discord reply answers a question even when another question came in between', () => {
    const q = msg('a', 'what time is the stream?');
    const other = msg('b', 'is there a replay?');
    const reply = msg('c', '8pm ET', { replyToId: q.id });
    const text = buildDiscordDigest('ZM', 'g', [ch('general', [q, other, reply])], 'zaal') ?? '';
    expect(text).not.toContain('what time is the stream');
  });

  it('a person adding to their own question does not count as an answer', () => {
    const q = msg('a', 'how do I join ZABAL Gamez?');
    const more = msg('a', 'I have a repo ready');
    expect(buildDiscordDigest('ZM', 'g', [ch('general', [q, more])], 'zaal')).toContain('Questions nobody answered (1):');
  });

  it('lists mentions of Zaal he has not answered in that channel, and drops ones he has', () => {
    const open = msg('a', '@Zaal can you check the flyer', { mentionsOwner: true });
    const done = msg('b', '@Zaal mixz is down', { mentionsOwner: true });
    const text =
      buildDiscordDigest(
        'ZM',
        'g',
        [ch('design', [open]), ch('mixz', [done, msg('zaal', 'on it')])],
        'zaal',
      ) ?? '';
    expect(text).toContain('Mentioned you, no reply from you yet (1):');
    expect(text).toContain('#design, User a: "Zaal can you check the flyer"');
    expect(text).not.toContain('mixz is down');
  });

  it('snippets are cleaned and cut, so the DM cannot ping or carry markup', () => {
    const text = buildDiscordDigest('ZM', 'g', [ch('general', [msg('a', `<@123> @everyone ${'x'.repeat(300)}?`)])], 'zaal') ?? '';
    const line = text.split('\n').find((l) => l.startsWith('- #general')) ?? '';
    expect(line).not.toMatch(/<@|@everyone/);
    expect(line).toContain('...');
  });
});

describe('claimDigestDay', () => {
  it('once per server per New York day', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'zoe-digest-'));
    const evening = new Date('2026-10-18T22:00:00Z'); // 18:00 EDT
    expect(await claimDigestDay('g1', evening, dir)).toBe(true);
    expect(await claimDigestDay('g1', evening, dir)).toBe(false);
    expect(await claimDigestDay('g2', evening, dir)).toBe(true);
    expect(await claimDigestDay('g1', new Date('2026-10-19T22:00:00Z'), dir)).toBe(true);
  });
});

describe('wiring in discord.ts', () => {
  const d = readFileSync(join(__dirname, '..', 'discord.ts'), 'utf8');
  const run = d.slice(d.indexOf('async function runDiscordDigest('), d.indexOf('/** Register the admin slash commands'));

  it('scheduled only with the flag on, at 18:00 New York time', () => {
    expect(d).toContain('if (discordDigestEnabled()) {');
    expect(d).toContain("cron.schedule(DIGEST_CRON, () => void runDiscordDigest(client)");
    expect(d).toContain("timezone: 'America/New_York'");
  });

  it('reads only channels ZOE may read, claims the day first, and sends only to Zaal without pings', () => {
    expect(run).toContain('PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory');
    expect(run.indexOf('claimDigestDay(guild.id)')).toBeLessThan(run.indexOf('client.users.fetch(DISCORD_ZAAL_ID)'));
    expect(run.match(/\.send\(/g)).toHaveLength(1);
    expect(run).toContain('zaal.send({ content: chunk, allowedMentions: { parse: [] } })');
    expect(run).not.toMatch(/channel\.send|ch\.send|\.reply\(/);
  });
});
