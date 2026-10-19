import { mkdtempSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PermissionFlagsBits, PermissionsBitField } from 'discord.js';
import { describe, expect, it } from 'vitest';
import {
  appendJoinLog,
  inRows,
  inviteUsed,
  parseRoleButton,
  ROLE_PICKER_TEXT,
  roleButtonId,
  safeSelfRole,
  STAFF_PERMISSIONS,
  selfRoleNames,
  welcomeChannelName,
  welcomeEnabled,
  welcomeText,
} from '../discord-welcome';

describe('config', () => {
  it('self roles: comma list, trimmed, de-duplicated without case, at most 25', () => {
    expect(selfRoleNames({ ZOE_DISCORD_SELF_ROLES: ' Artist, Builder,,artist, ZABAL Gamez ' } as NodeJS.ProcessEnv)).toEqual([
      'Artist',
      'Builder',
      'ZABAL Gamez',
    ]);
    expect(selfRoleNames({} as NodeJS.ProcessEnv)).toEqual([]);
    const many = Array.from({ length: 30 }, (_, i) => `r${i}`).join(',');
    expect(selfRoleNames({ ZOE_DISCORD_SELF_ROLES: many } as NodeJS.ProcessEnv)).toHaveLength(25);
  });

  it('welcome is off unless exactly 1; channel defaults to welcome', () => {
    expect(welcomeEnabled({} as NodeJS.ProcessEnv)).toBe(false);
    expect(welcomeEnabled({ ZOE_DISCORD_WELCOME: 'true' } as NodeJS.ProcessEnv)).toBe(false);
    expect(welcomeEnabled({ ZOE_DISCORD_WELCOME: '1' } as NodeJS.ProcessEnv)).toBe(true);
    expect(welcomeChannelName({} as NodeJS.ProcessEnv)).toBe('welcome');
    expect(welcomeChannelName({ ZOE_DISCORD_WELCOME_CHANNEL: '#Say-Hi' } as NodeJS.ProcessEnv)).toBe('say-hi');
  });
});

describe('wording (approved by Zaal)', () => {
  it('no dashes or emoji, and the welcome names only the new member', () => {
    for (const t of [ROLE_PICKER_TEXT, welcomeText('<@42>')]) {
      expect(t).not.toMatch(/[–—]/);
      expect(t).not.toMatch(/\p{Extended_Pictographic}/u);
    }
    expect(welcomeText('<@42>')).toContain('<@42>');
    expect(welcomeText('<@42>')).not.toMatch(/@everyone|@here/);
  });
});

describe('buttons', () => {
  it('role button ids round-trip and reject anything else', () => {
    expect(parseRoleButton(roleButtonId('123456789'))).toBe('123456789');
    expect(parseRoleButton('zrole_abc')).toBeNull();
    expect(parseRoleButton('zadm_kick_123456')).toBeNull();
  });

  it('rows of five, at most five rows', () => {
    expect(inRows([1, 2, 3, 4, 5, 6, 7]).map((r) => r.length)).toEqual([5, 2]);
    expect(inRows(Array.from({ length: 30 }, (_, i) => i))).toHaveLength(5);
    expect(inRows([])).toEqual([]);
  });
});

describe('safeSelfRole', () => {
  it('a plain member role is safe', () => {
    expect(safeSelfRole(new PermissionsBitField([PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect]))).toBe(true);
  });

  it.each(STAFF_PERMISSIONS.map((b) => [new PermissionsBitField(b).toArray()[0], b] as const))('a role with %s is refused', (_name, bit) => {
    expect(safeSelfRole(new PermissionsBitField([PermissionFlagsBits.SendMessages, bit]))).toBe(false);
  });
});

describe('inviteUsed', () => {
  it('the one invite whose count went up, including a new one', () => {
    expect(inviteUsed(new Map([['a', 3], ['b', 1]]), new Map([['a', 4], ['b', 1]]))).toBe('a');
    expect(inviteUsed(new Map([['a', 3]]), new Map([['a', 3], ['new', 1]]))).toBe('new');
  });

  it('none or two at once is unknown, never a guess', () => {
    expect(inviteUsed(new Map([['a', 3]]), new Map([['a', 3]]))).toBeNull();
    expect(inviteUsed(new Map([['a', 3], ['b', 1]]), new Map([['a', 4], ['b', 2]]))).toBeNull();
  });
});

describe('appendJoinLog', () => {
  it('owner-only JSON lines', async () => {
    const path = join(mkdtempSync(join(tmpdir(), 'zoe-joins-')), 'discord-joins.jsonl');
    await appendJoinLog({ guildId: 'g', userId: 'u', invite: 'abc', inviter: 'z' }, new Date('2026-10-18T20:00:00Z'), path);
    await appendJoinLog({ guildId: 'g', userId: 'v', invite: null }, new Date('2026-10-18T20:01:00Z'), path);
    expect(readFileSync(path, 'utf8').trim().split('\n').map((l) => JSON.parse(l))).toEqual([
      { ts: '2026-10-18T20:00:00.000Z', guildId: 'g', userId: 'u', invite: 'abc', inviter: 'z' },
      { ts: '2026-10-18T20:01:00.000Z', guildId: 'g', userId: 'v', invite: null },
    ]);
    expect(statSync(path).mode & 0o777).toBe(0o600);
  });
});

describe('wiring in discord.ts', () => {
  const d = readFileSync(join(__dirname, '..', 'discord.ts'), 'utf8');
  const button = d.slice(d.indexOf('async function handleRoleButton('), d.indexOf('/** Invite use counts per server'));
  const welcome = d.slice(d.indexOf('async function welcomeMember('), d.indexOf('/** Register the admin slash commands'));
  const picker = d.slice(d.indexOf('async function postRolePicker('), d.indexOf('async function handleRoleButton('));
  const rows = d.slice(d.indexOf('function roleRows('), d.indexOf('async function postRolePicker('));

  it('the members intent and the join handler exist only with welcome on', () => {
    expect(d).toContain('...(welcomeEnabled() ? [GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildInvites] : []),');
    const on = d.indexOf('if (welcomeEnabled()) {\n    client.on(\'guildMemberAdd\'');
    expect(on).toBeGreaterThan(-1);
  });

  it('only listed roles below ZOE are offered, and a press re-checks both', () => {
    expect(rows).toContain('wanted.has(r.name.toLowerCase()) && r.editable && safeSelfRole(r.permissions) && r.id !== guild.roles.everyone.id');
    expect(button).toContain('if (!role || !allowed.has(role.name.toLowerCase()) || !role.editable || !safeSelfRole(role.permissions)) {');
    expect(button.indexOf('!role.editable')).toBeLessThan(button.indexOf('member.roles.add('));
  });

  it('a press changes only the presser, and answers only them', () => {
    expect(button).toContain('const member: GuildMember = i.member;');
    expect(button).not.toMatch(/members\.fetch|guild\.members/);
    expect(button.match(/flags: MessageFlags\.Ephemeral/g)?.length).toBe(3);
  });

  it('the picker is posted by /roles only after the owner check', () => {
    const slash = d.slice(d.indexOf('async function handleAdminSlash('), d.indexOf('async function handleKickButton('));
    expect(slash.indexOf('await postRolePicker(i);')).toBeGreaterThan(slash.indexOf('if (!isDiscordOwner(by, DISCORD_ZAAL_ID)) {'));
    expect(picker).toContain('allowedMentions: { parse: [] }');
  });

  it('the welcome pings only the new member and writes the join log first', () => {
    expect(welcome).toContain('allowedMentions: { users: [member.id] }');
    expect(welcome.indexOf('appendJoinLog(')).toBeLessThan(welcome.indexOf('channel.send('));
  });

  it('role buttons are routed before the approval buttons', () => {
    const handler = d.slice(d.indexOf("client.on('interactionCreate'"));
    expect(handler.indexOf('await handleRoleButton(interaction);')).toBeGreaterThan(-1);
    expect(handler.indexOf('await handleRoleButton(interaction);')).toBeLessThan(handler.indexOf("startsWith('zask_')"));
  });
});
