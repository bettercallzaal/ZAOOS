import { chmodSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ADMIN_REFUSAL_LINE,
  type AdminEnv,
  appendAdminLog,
  ARCHIVE_CATEGORY,
  cleanChannelName,
  cleanLabel,
  discordAdminEnabled,
  isDiscordOwner,
  parseAdminCommand,
  runAdminCommand,
} from '../discord-admin';

describe('flag and owner', () => {
  it.each([
    [undefined, false],
    ['0', false],
    ['true', false],
    ['1', true],
  ])('ZOE_DISCORD_ADMIN=%j is %s', (v, want) => {
    expect(discordAdminEnabled({ ZOE_DISCORD_ADMIN: v } as NodeJS.ProcessEnv)).toBe(want);
  });

  it('only the owner id, and nobody when it is unset', () => {
    expect(isDiscordOwner('42', '42')).toBe(true);
    expect(isDiscordOwner('43', '42')).toBe(false);
    expect(isDiscordOwner('42', undefined)).toBe(false);
    expect(isDiscordOwner('', '')).toBe(false);
  });
});

describe('names', () => {
  it.each([
    ['ZAOstock 2027 Planning', 'zaostock-2027-planning'],
    ['  new   music!! ', 'new-music'],
    ['@everyone', 'everyone'],
    ['--a--b--', 'a-b'],
    ['!!!', ''],
  ])('channel name %j -> %j', (raw, want) => {
    expect(cleanChannelName(raw)).toBe(want);
  });

  it('labels keep case but lose mentions and control characters', () => {
    expect(cleanLabel('ZAO Festivals')).toBe('ZAO Festivals');
    expect(cleanLabel('<@123> hi\nthere')).toBe('123 hi there');
    expect(cleanLabel('x'.repeat(150))).toHaveLength(100);
  });
});

describe('parseAdminCommand', () => {
  it('not an admin command: null, so the normal turn runs', () => {
    expect(parseAdminCommand('what is ZABAL Gamez?')).toBeNull();
    expect(parseAdminCommand('the admin: said hi')).toBeNull();
  });

  it.each([
    ['admin:', { kind: 'help' }],
    ['ADMIN: help', { kind: 'help' }],
    ['admin: new channel Festival Planning', { kind: 'new-channel', name: 'festival-planning' }],
    ['admin: new channel mixz-feedback in ZAO Music', { kind: 'new-channel', name: 'mixz-feedback', category: 'ZAO Music' }],
    ['admin: new category ZAO Festivals', { kind: 'new-category', name: 'ZAO Festivals' }],
    ['admin: rename <#1234567> to Old Stuff', { kind: 'rename', channelId: '1234567', name: 'old-stuff' }],
    ['admin: archive <#1234567>', { kind: 'archive', channelId: '1234567' }],
    ['admin: new thread Set list ideas', { kind: 'new-thread', name: 'Set list ideas' }],
    [
      'admin: pin https://discord.com/channels/111111/2222222/3333333',
      { kind: 'pin', pin: true, channelId: '2222222', messageId: '3333333' },
    ],
    [
      'admin: unpin https://discord.com/channels/111111/2222222/3333333',
      { kind: 'pin', pin: false, channelId: '2222222', messageId: '3333333' },
    ],
  ])('%j', (text, want) => {
    expect(parseAdminCommand(text)).toEqual(want);
  });

  it('"admin: pin" as a reply pins the replied-to message', () => {
    expect(parseAdminCommand('admin: pin', '9999999')).toEqual({ kind: 'pin', pin: true, messageId: '9999999' });
    expect(parseAdminCommand('admin: pin')).toEqual({ kind: 'unknown', text: 'pin' });
  });

  it.each([
    'admin: delete everything',
    'admin: archive general',
    'admin: rename general to x',
    'admin: pin https://evil.example/channels/1/2/3',
    'admin: new channel !!!',
    'admin: ban someone',
  ])('does not parse, so nothing runs: %j', (text) => {
    expect(parseAdminCommand(text)?.kind).toBe('unknown');
  });
});

function fakeGuild(archiveCleared = 0) {
  const calls: string[] = [];
  const cats = new Map<string, string>([['c1', 'ZAO Music']]);
  const chans = new Map<string, string>([['1234567', 'general']]);
  let n = 100;
  const env: AdminEnv = {
    async findCategory(name) {
      for (const [id, nm] of cats) if (nm.toLowerCase() === name.toLowerCase()) return { id, name: nm };
      return null;
    },
    async createCategory(name) {
      const id = `c${n++}`;
      cats.set(id, name);
      calls.push(`createCategory ${name}`);
      return { id, name };
    },
    async createTextChannel(name, parentId) {
      const id = `${n++}`;
      chans.set(id, name);
      calls.push(`createTextChannel ${name} ${parentId ?? '-'}`);
      return { id, name };
    },
    async channelName(id) {
      return chans.get(id) ?? null;
    },
    async renameChannel(id, name) {
      chans.set(id, name);
      calls.push(`rename ${id} ${name}`);
    },
    async archiveChannel(id, catId) {
      calls.push(`archive ${id} ${catId}`);
      return { cleared: archiveCleared };
    },
    async createThread(name) {
      calls.push(`thread ${name}`);
      return { id: 't1', name };
    },
    async setPinned(channelId, messageId, pin) {
      calls.push(`${pin ? 'pin' : 'unpin'} ${channelId ?? 'here'} ${messageId}`);
    },
  };
  return { env, calls };
}

describe('runAdminCommand on a fake guild', () => {
  it('new channel, with and without a category', async () => {
    const g = fakeGuild();
    expect((await runAdminCommand({ kind: 'new-channel', name: 'plans' }, g.env)).ok).toBe(true);
    const r = await runAdminCommand({ kind: 'new-channel', name: 'mixz', category: 'zao music' }, g.env);
    expect(r.ok).toBe(true);
    expect(g.calls).toEqual(['createTextChannel plans -', 'createTextChannel mixz c1']);
  });

  it('a missing category is not created by "new channel"; it says how', async () => {
    const g = fakeGuild();
    const r = await runAdminCommand({ kind: 'new-channel', name: 'x', category: 'Nope' }, g.env);
    expect(r.ok).toBe(false);
    expect(r.reply).toContain('admin: new category Nope');
    expect(g.calls).toEqual([]);
  });

  it('new category is idempotent', async () => {
    const g = fakeGuild();
    expect((await runAdminCommand({ kind: 'new-category', name: 'ZAO Music' }, g.env)).reply).toContain('already exists');
    expect(g.calls).toEqual([]);
  });

  it('archive makes the archive category once, then moves the channel', async () => {
    const g = fakeGuild();
    await runAdminCommand({ kind: 'archive', channelId: '1234567' }, g.env);
    await runAdminCommand({ kind: 'archive', channelId: '1234567' }, g.env);
    expect(g.calls.filter((c) => c.startsWith('createCategory'))).toEqual([`createCategory ${ARCHIVE_CATEGORY}`]);
    expect(g.calls.filter((c) => c.startsWith('archive'))).toHaveLength(2);
  });

  it('the archive reply says read-only, counts cleared overrides, and names who can still post', async () => {
    const none = await runAdminCommand({ kind: 'archive', channelId: '1234567' }, fakeGuild(0).env);
    expect(none.reply).toBe('Archived <#1234567>: moved to "archive" and read-only. Server administrators can still post there.');
    const two = await runAdminCommand({ kind: 'archive', channelId: '1234567' }, fakeGuild(2).env);
    expect(two.reply).toContain('Cleared 2 role or member overrides that allowed posting.');
    expect((await runAdminCommand({ kind: 'archive', channelId: '1234567' }, fakeGuild(1).env)).reply).toContain('Cleared 1 role or member override that');
  });

  it('a channel from another server is refused before anything changes', async () => {
    const g = fakeGuild();
    expect((await runAdminCommand({ kind: 'archive', channelId: '7777777' }, g.env)).ok).toBe(false);
    expect((await runAdminCommand({ kind: 'rename', channelId: '7777777', name: 'x' }, g.env)).ok).toBe(false);
    expect(g.calls).toEqual([]);
  });

  it('rename, thread, pin and unpin', async () => {
    const g = fakeGuild();
    expect((await runAdminCommand({ kind: 'rename', channelId: '1234567', name: 'lobby' }, g.env)).reply).toBe(
      'Renamed #general to <#1234567>.',
    );
    await runAdminCommand({ kind: 'new-thread', name: 'Ideas' }, g.env);
    await runAdminCommand({ kind: 'pin', pin: true, messageId: '9' }, g.env);
    await runAdminCommand({ kind: 'pin', pin: false, channelId: '2', messageId: '9' }, g.env);
    expect(g.calls).toEqual(['rename 1234567 lobby', 'thread Ideas', 'pin here 9', 'unpin 2 9']);
  });

  it('a Discord error becomes the reply, never a throw', async () => {
    const g = fakeGuild();
    g.env.createThread = async () => {
      throw new Error('Missing Permissions');
    };
    const r = await runAdminCommand({ kind: 'new-thread', name: 'x' }, g.env);
    expect(r).toMatchObject({ ok: false, action: 'new-thread' });
    expect(r.reply).toContain('Missing Permissions');
  });

  it('unknown and help touch nothing', async () => {
    const g = fakeGuild();
    expect((await runAdminCommand({ kind: 'unknown', text: 'ban x' }, g.env)).ok).toBe(false);
    expect((await runAdminCommand({ kind: 'help' }, g.env)).reply).toContain('admin: archive #channel');
    expect(g.calls).toEqual([]);
  });
});

describe('appendAdminLog', () => {
  it('writes one owner-only JSON line per call', async () => {
    const path = join(mkdtempSync(join(tmpdir(), 'zoe-admin-')), 'discord-admin.jsonl');
    await appendAdminLog({ action: 'archive', ok: true, target: '1', by: '42' }, new Date('2026-10-18T20:00:00Z'), path);
    await appendAdminLog({ action: 'archive', ok: false, by: '43', refused: 'not owner' }, new Date('2026-10-18T20:01:00Z'), path);
    const lines = readFileSync(path, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    expect(lines).toEqual([
      { ts: '2026-10-18T20:00:00.000Z', action: 'archive', ok: true, target: '1', by: '42' },
      { ts: '2026-10-18T20:01:00.000Z', action: 'archive', ok: false, by: '43', refused: 'not owner' },
    ]);
    expect(statSync(path).mode & 0o777).toBe(0o600);
  });

  it('a log file that already exists with wider permissions is narrowed to 0600 on the next write', async () => {
    const path = join(mkdtempSync(join(tmpdir(), 'zoe-admin-')), 'discord-admin.jsonl');
    writeFileSync(path, '');
    chmodSync(path, 0o644);
    await appendAdminLog({ action: 'help', ok: true, by: '42' }, new Date(), path);
    expect(statSync(path).mode & 0o777).toBe(0o600);
  });
});

describe('wiring in discord.ts', () => {
  const d = readFileSync(join(__dirname, '..', 'discord.ts'), 'utf8');

  it('flag-gated, after the rate limit, before the model turn, and owner-checked', () => {
    const gate = d.indexOf('if (discordAdminEnabled()) {');
    expect(gate).toBeGreaterThan(d.indexOf('if (!discordTurnAllowed('));
    expect(gate).toBeLessThan(d.indexOf('const result = await runConciergeTurn({'));
    expect(gate).toBeLessThan(d.indexOf('await message.channel.sendTyping();'));
    expect(d).toContain('if (!isDiscordOwner(by, DISCORD_ZAAL_ID)) {');
    expect(d.indexOf('if (!isDiscordOwner(by, DISCORD_ZAAL_ID)) {')).toBeLessThan(d.indexOf('runAdminCommand(cmd, discordAdminEnv(message))'));
  });

  it('a non-owner is refused by DM, never in the channel, and nothing runs', () => {
    const block = d.slice(d.indexOf('if (!isDiscordOwner(by, DISCORD_ZAAL_ID)) {'), d.indexOf('} else if (!message.inGuild()) {'));
    expect(block).toContain('await message.author.send({ content: ADMIN_REFUSAL_LINE, allowedMentions: { parse: [] } }).catch(() => undefined);');
    expect(block).toContain('return;');
    expect(block).not.toContain('message.reply(');
    expect(block).not.toContain('runAdminCommand(');
    expect(ADMIN_REFUSAL_LINE).toContain('Nothing was changed');
  });

  it('archive clears role and member overrides that allow posting, never @everyone', () => {
    const env = d.slice(d.indexOf('async archiveChannel('), d.indexOf('async createThread('));
    expect(env).toContain('if (ow.id === guild.roles.everyone.id) continue;');
    expect(env).toContain('SendMessages: null, SendMessagesInThreads: null, CreatePublicThreads: null');
    expect(env).toContain('return { cleared };');
  });

  it('every branch logs, and the reply can ping nobody', () => {
    const block = d.slice(d.indexOf('if (discordAdminEnabled()) {'), d.indexOf('await message.channel.sendTyping();'));
    expect(block.match(/await appendAdminLog\(/g)).toHaveLength(3);
    expect(block).toContain("allowedMentions: { parse: [], repliedUser: false }");
    expect(block).toContain('return;');
  });

  it('nothing in the admin env deletes, bans or kicks', () => {
    const env = d.slice(d.indexOf('function discordAdminEnv('), d.indexOf('function buildApprovalRow('));
    expect(env).not.toMatch(/\.delete\(|\.ban\(|\.kick\(|bulkDelete/);
  });
});
