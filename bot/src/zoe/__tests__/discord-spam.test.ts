import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  allowAlert,
  defangLinks,
  newAlertLimiter,
  newRecentPosts,
  parseSpamButton,
  recordPost,
  SPAM_ALERT_SCORE,
  type SpamInput,
  spamAlertText,
  spamButtonId,
  spamWatchEnabled,
  scoreSpam,
} from '../discord-spam';

const DAY = 24 * 60 * 60 * 1000;
const base: SpamInput = { content: '', accountAgeMs: 400 * DAY, canMentionEveryone: false, sameTextOtherChannels: 0 };
const score = (over: Partial<SpamInput>): number => scoreSpam({ ...base, ...over }).score;

describe('flag', () => {
  it.each([
    [undefined, false],
    ['true', false],
    ['1', true],
  ])('ZOE_DISCORD_SPAM_WATCH=%j is %s', (v, want) => {
    expect(spamWatchEnabled({ ZOE_DISCORD_SPAM_WATCH: v } as NodeJS.ProcessEnv)).toBe(want);
  });
});

describe('scoreSpam: alerts', () => {
  it.each([
    ['a Discord lookalike link', { content: 'claim here https://dlscord-gift.com/nitro' }],
    ['a Steam lookalike link', { content: 'trade offer https://steamcommunlty.ru/offer' }],
    ['a nitro lure with a link', { content: 'Free Nitro for everyone https://bit.ly/x', accountAgeMs: 2 * DAY }],
    ['a wallet lure with a link from a new account', { content: 'connect your wallet to claim https://mint.xyz', accountAgeMs: DAY }],
    ['an invite from a new account', { content: 'join us discord.gg/abc123', accountAgeMs: DAY }],
    ['the same text in three channels', { content: 'hello', sameTextOtherChannels: 2 }],
    ['a member pinging everyone with a lure', { content: '@everyone airdrop live now' }],
  ])('%s', (_name, over) => {
    expect(score(over)).toBeGreaterThanOrEqual(SPAM_ALERT_SCORE);
  });
});

describe('scoreSpam: ordinary messages stay quiet', () => {
  it.each([
    ['a plain message', { content: 'great set last night' }],
    ['a real Discord link', { content: 'see https://discord.com/channels/1/2/3' }],
    ['a YouTube link from an old account', { content: 'new mix https://youtube.com/watch?v=x' }],
    ['a link from a new account, nothing else', { content: 'my track https://soundcloud.com/me/song', accountAgeMs: DAY }],
    ['an admin pinging everyone', { content: '@everyone stream at 8', canMentionEveryone: true }],
    ['talking about a mint without a link', { content: 'when does the mint go live?' }],
    ['the same text in two channels', { content: 'gm', sameTextOtherChannels: 1 }],
  ])('%s', (_name, over) => {
    expect(score(over)).toBeLessThan(SPAM_ALERT_SCORE);
  });

  it('pinging everyone counts only for someone not allowed to', () => {
    expect(scoreSpam({ ...base, content: '@everyone stream at 8', canMentionEveryone: true }).reasons).toEqual([]);
    expect(scoreSpam({ ...base, content: '@everyone stream at 8' }).reasons).toEqual(['tries to ping everyone']);
  });

  it('every point comes with a reason', () => {
    const v = scoreSpam({ ...base, content: 'Free Nitro https://dlscord-gift.com', accountAgeMs: DAY });
    expect(v.reasons.length).toBeGreaterThanOrEqual(2);
    expect(v.reasons.join(' ')).toContain('imitates Discord');
  });
});

describe('recordPost', () => {
  it('counts other channels with the same text inside two minutes only', () => {
    const s = newRecentPosts();
    expect(recordPost(s, 'u', 'c1', 'Buy Now', 0)).toBe(0);
    expect(recordPost(s, 'u', 'c2', 'buy  now', 1000)).toBe(1);
    expect(recordPost(s, 'u', 'c3', 'BUY NOW', 2000)).toBe(2);
    expect(recordPost(s, 'u', 'c1', 'buy now', 3000)).toBe(2);
    expect(recordPost(s, 'other', 'c4', 'buy now', 3000)).toBe(0);
    expect(recordPost(s, 'u', 'c4', 'buy now', 10 * 60 * 1000)).toBe(0);
  });
});

describe('allowAlert', () => {
  it('one alert per person per ten minutes, 30 a day', () => {
    const s = newAlertLimiter();
    expect(allowAlert(s, 'u', 0)).toBe(true);
    expect(allowAlert(s, 'u', 60_000)).toBe(false);
    expect(allowAlert(s, 'u', 11 * 60_000)).toBe(true);
    const d = newAlertLimiter();
    for (let i = 0; i < 30; i++) expect(allowAlert(d, `u${i}`, i)).toBe(true);
    expect(allowAlert(d, 'late', 100)).toBe(false);
  });
});

describe('alert text and buttons', () => {
  it('cleans member text, says nothing was done, and leaves deleting to Zaal', () => {
    const t = spamAlertText({
      authorName: '@scammer',
      channelName: 'general',
      content: '<@1> @everyone free nitro `x` https://dlscord.gift',
      url: 'https://discord.com/channels/1/2/3',
      verdict: { score: 5, reasons: ['a link that imitates Discord or Steam'] },
    });
    expect(t).not.toMatch(/[@<>`]/);
    expect(t).toContain('Nothing has been done.');
    expect(t).toContain('Deleting the message is yours');
    expect(t).toContain('Why: a link that imitates Discord or Steam.');
  });

  it('member links in the alert are dead, and the message link stays live', () => {
    const url = 'https://discord.com/channels/1/2/3';
    const t = spamAlertText({
      authorName: 'x',
      channelName: 'general',
      content: 'claim at https://discorcl-nitro.gift/claim or www.steamgift.ru now, also dlscord.gift/x',
      url,
      verdict: { score: 9, reasons: ['r'] },
    });
    const quoted = t.split('\n')[1];
    expect(quoted).toContain('hxxps://discorcl-nitro[.]gift/claim');
    expect(quoted).toContain('www[.]steamgift[.]ru');
    expect(quoted).toContain('dlscord[.]gift/x');
    expect(quoted).not.toMatch(/https?:\/\/|www\.|\w\.(?:gift|ru|com)\b/);
    expect(t.split('\n')[2]).toBe(url);
  });

  it('defangLinks leaves ordinary words alone', () => {
    expect(defangLinks('see you at 8. bring snacks.')).toBe('see you at 8. bring snacks.');
  });

  it('button ids round-trip and reject anything else', () => {
    const id = spamButtonId('to60', '111111', '222222');
    expect(parseSpamButton(id)).toEqual({ action: 'to60', guildId: '111111', userId: '222222' });
    expect(parseSpamButton(spamButtonId('kickyes', '111111', '222222'))?.action).toBe('kickyes');
    expect(parseSpamButton('zadm_spam_ban_111111_222222')).toBeNull();
    expect(parseSpamButton('zadm_spam_to60_abc_222222')).toBeNull();
    expect(id.length).toBeLessThanOrEqual(100);
  });
});

describe('wiring in discord.ts', () => {
  const d = readFileSync(join(__dirname, '..', 'discord.ts'), 'utf8');
  const watch = d.slice(d.indexOf('async function watchForSpam('), d.indexOf('async function handleSpamButton('));
  const button = d.slice(d.indexOf('async function handleSpamButton('), d.indexOf('/** Register the admin slash commands'));

  it('only with the flag, before the mention gate, fire and forget', () => {
    const hook = d.indexOf('if (spamWatchEnabled() && message.inGuild()) {');
    expect(hook).toBeGreaterThan(d.indexOf("client.on('messageCreate'"));
    expect(hook).toBeLessThan(d.indexOf('const triggered = discordShouldReply({'));
    expect(d).toContain('void watchForSpam(message, client)');
  });

  it('the watcher only DMs Zaal: no delete, timeout, kick or post in the server', () => {
    expect(watch).not.toMatch(/\.delete\(|\.timeout\(|\.kick\(|runAdminCommand|message\.reply|channel\.send/);
    expect(watch.match(/\.send\(/g)).toHaveLength(1);
    expect(watch).toContain('zaal.send({ content: text, components, allowedMentions: { parse: [] }, flags: MessageFlags.SuppressEmbeds })');
    expect(d).toContain('if (spamWatchEnabled() && !CHANNEL_READ) {');
    expect(watch).toContain('if (perms?.has(PermissionFlagsBits.Administrator) || perms?.has(PermissionFlagsBits.ManageMessages)) return;');
    expect(watch).toContain('const components = discordAdminEnabled()');
  });

  it('a button is Zaal only with admin on, and a kick needs the second press in time', () => {
    const gate = button.indexOf('if (!b || !guild || !discordAdminEnabled() || !isDiscordOwner(by, DISCORD_ZAAL_ID)) {');
    expect(gate).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(button.indexOf('runAdminCommand('));
    expect(button).toContain('if (!at || Date.now() - at > KICK_CONFIRM_MS) {');
    expect(button.indexOf("if (b.action === 'kick') {")).toBeLessThan(button.indexOf("if (b.action === 'kickyes') {"));
    const kickStep = button.slice(button.indexOf("if (b.action === 'kick') {"), button.indexOf("if (b.action === 'kickyes') {"));
    expect(kickStep).not.toContain('runAdminCommand(');
  });

  it('spam buttons are routed before the other buttons', () => {
    const handler = d.slice(d.indexOf("client.on('interactionCreate'"));
    expect(handler.indexOf('await handleSpamButton(interaction, client);')).toBeGreaterThan(-1);
    expect(handler.indexOf('await handleSpamButton(interaction, client);')).toBeLessThan(handler.indexOf("startsWith('zask_')"));
  });
});
