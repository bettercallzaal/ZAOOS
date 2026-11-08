import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { GroupConfig } from '../groups';
import type { TeamTask } from '../team-tracker';
import { handleTeamView, readTeamViewConfig, resolveMember, TEAM_VIEW_MAX_CHARS, type TeamViewConfig, type TeamViewDeps } from '../team-view';

// iman-desk #168 item 3: the per-person team view in allowlisted groups.

const CHAT = -1011;
const MEMBER = 41;
const cfg: TeamViewConfig = { chats: [CHAT] };

function task(title: string, owner: string, status = 'todo', priority: string | null = 'P2'): TeamTask {
  return { title, status, priority, due: null, project: 'zaodevz', legacy_id: null, owner_id: owner };
}
const TASKS = [task('Hub repo files', 'm-iman', 'in_progress', 'P1'), task('Five-file README', 'm-iman'), task('Mix the set', 'm-gc')];
const MEMBERS = new Map([
  ['m-iman', 'Iman'],
  ['m-gc', 'GC'],
]);

function group(over: Partial<GroupConfig> = {}): GroupConfig {
  return { chat_id: CHAT, chat_title: 't', mode: 'mention', member_allowlist: [MEMBER], created_at: '', updated_at: '', ...over };
}
function deps(over: Partial<TeamViewDeps> = {}): TeamViewDeps {
  return {
    getGroupConfig: vi.fn(async () => group()),
    trackerConfigured: () => true,
    getTasks: vi.fn(async () => TASKS),
    getMembers: vi.fn(async () => MEMBERS),
    featureRan: vi.fn(),
    botUsername: () => 'zaoclaw_bot',
    botId: () => 1,
    ...over,
  };
}
function ctxIn(chatId: number, fromId: number, firstName = 'Iman') {
  return { chat: { id: chatId }, from: { id: fromId, first_name: firstName }, reply: vi.fn(async (_t: string) => ({})) };
}

describe('readTeamViewConfig', () => {
  it.each([[{}], [{ ZOE_TEAM_VIEW: '1' }], [{ ZOE_TEAM_VIEW: '1', ZOE_TEAM_VIEW_CHATS: 'x' }], [{ ZOE_TEAM_VIEW: '0', ZOE_TEAM_VIEW_CHATS: '-5' }]])(
    'is off for %j',
    (env) => {
      expect(readTeamViewConfig(env as NodeJS.ProcessEnv)).toBeNull();
    },
  );
  it('reads the chat list', () => {
    expect(readTeamViewConfig({ ZOE_TEAM_VIEW: '1', ZOE_TEAM_VIEW_CHATS: '-5, -6' } as NodeJS.ProcessEnv)).toEqual({ chats: [-5, -6], exclude: [] });
  });
});

describe('handleTeamView', () => {
  it('an allowlisted member with no name gets their own view, matched by first name', async () => {
    const d = deps();
    const ctx = ctxIn(CHAT, MEMBER, 'Iman');
    await handleTeamView(ctx as never, '', cfg, d);
    const text = ctx.reply.mock.calls[0][0];
    expect(text).toContain('Iman - 2 open, 1 in progress');
    expect(text).toContain('Hub repo files [doing]');
    expect(text).not.toContain('Mix the set');
    expect(d.featureRan).toHaveBeenCalledWith('team-view', 'self');
  });

  it('a named teammate gets that one person only', async () => {
    const d = deps();
    const ctx = ctxIn(CHAT, MEMBER);
    await handleTeamView(ctx as never, 'gc', cfg, d);
    expect(ctx.reply.mock.calls[0][0]).toContain('GC - 1 open');
    expect(ctx.reply.mock.calls[0][0]).not.toContain('Hub repo files');
    expect(d.featureRan).toHaveBeenCalledWith('team-view', 'named');
  });

  it.each([
    ['a chat not on the list', ctxIn(42, MEMBER), group()],
    ['a member the group refuses', ctxIn(CHAT, 999), group()],
    ['a silent group', ctxIn(CHAT, MEMBER), group({ mode: 'silent' })],
    ['an unconfigured group', ctxIn(CHAT, MEMBER), null],
  ])('reads nothing and says nothing in %s', async (_l, ctx, g) => {
    const d = deps({ getGroupConfig: vi.fn(async () => g) });
    await handleTeamView(ctx as never, '', cfg, d);
    expect(d.getTasks).not.toHaveBeenCalled();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('says so when the board is not connected, without reading it', async () => {
    const d = deps({ trackerConfigured: () => false });
    const ctx = ctxIn(CHAT, MEMBER);
    await handleTeamView(ctx as never, '', cfg, d);
    expect(ctx.reply).toHaveBeenCalledWith('The team board is not connected yet.');
    expect(d.getTasks).not.toHaveBeenCalled();
  });

  it('a failed board read says so', async () => {
    const d = deps({ getTasks: vi.fn(async () => Promise.reject(new Error('down'))) });
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const ctx = ctxIn(CHAT, MEMBER);
    await handleTeamView(ctx as never, '', cfg, d);
    err.mockRestore();
    expect(ctx.reply).toHaveBeenCalledWith('I could not read the team board just now.');
    expect(d.featureRan).not.toHaveBeenCalled();
  });

  it('caps a long view', async () => {
    const many = Array.from({ length: 200 }, (_, i) => task(`Task number ${i} with a long title to fill the reply`, 'm-iman'));
    const ctx = ctxIn(CHAT, MEMBER);
    await handleTeamView(ctx as never, 'iman', cfg, deps({ getTasks: vi.fn(async () => many) }));
    expect(ctx.reply.mock.calls[0][0].length).toBeLessThanOrEqual(TEAM_VIEW_MAX_CHARS);
  });
});

describe('the private task queue is never on this path', () => {
  it('team-view.ts imports neither memory.ts nor the task queue', () => {
    const src = readFileSync(join(__dirname, '..', 'team-view.ts'), 'utf8');
    const imports = src.split('\n').filter((l) => l.startsWith('import '));
    expect(imports.length).toBeGreaterThan(0);
    expect(imports.join('\n')).not.toMatch(/\.\/memory|readTasks|tasks\.json/);
  });
});

describe('index.ts wiring (read as text; index.ts boots the bot and is never imported)', () => {
  const src = readFileSync(join(__dirname, '..', 'index.ts'), 'utf8');

  it('registers /teamview only behind the config, above the generic text handler', () => {
    const cfgAt = src.indexOf('const teamViewCfg = readTeamViewConfig();');
    const regAt = src.indexOf('registerTeamView(bot, teamViewCfg');
    const textAt = src.indexOf("bot.on('message:text'");
    expect(cfgAt).toBeGreaterThan(-1);
    expect(src.slice(cfgAt, regAt)).toContain('if (teamViewCfg) {');
    expect(regAt).toBeGreaterThan(cfgAt);
    expect(textAt).toBeGreaterThan(regAt);
  });
});

describe('one member only, never a substring (seat-merge on #4276)', () => {
  const WIDE = new Map([
    ['m-iman', 'Iman Ali'],
    ['m-gc', 'GC'],
    ['m-ana', 'Ana'],
    ['m-sam1', 'Sam Lee'],
    ['m-sam2', 'Sam Ortiz'],
    ['m-zaal', 'Zaal'],
  ]);
  const WIDE_TASKS = [task('Hub repo files', 'm-iman'), task('Mix the set', 'm-gc'), task('Poster', 'm-ana'), task('Private row', 'm-zaal')];
  const wideDeps = (over: Partial<TeamViewDeps> = {}) => deps({ getMembers: vi.fn(async () => WIDE), getTasks: vi.fn(async () => WIDE_TASKS), ...over });

  it('resolveMember matches full name, first name or id, ignoring case', () => {
    expect(resolveMember(WIDE, 'iman')).toEqual({ kind: 'one', id: 'm-iman', name: 'Iman Ali' });
    expect(resolveMember(WIDE, 'Iman Ali')).toMatchObject({ kind: 'one', id: 'm-iman' });
    expect(resolveMember(WIDE, 'M-GC')).toMatchObject({ kind: 'one', id: 'm-gc' });
    expect(resolveMember(WIDE, 'a')).toEqual({ kind: 'none' });
    expect(resolveMember(WIDE, 'im')).toEqual({ kind: 'none' });
    expect(resolveMember(WIDE, 'sam')).toEqual({ kind: 'many' });
  });

  it('/teamview a posts nobody\'s rows', async () => {
    const ctx = ctxIn(CHAT, MEMBER);
    const d = wideDeps();
    await handleTeamView(ctx as never, 'a', cfg, d);
    const text = ctx.reply.mock.calls[0][0];
    expect(text).toBe('No teammate named "a" on the board.');
    for (const t of WIDE_TASKS) expect(text).not.toContain(t.title);
    expect(d.featureRan).not.toHaveBeenCalled();
  });

  it('two members with the same first name: asks for the full name, no rows', async () => {
    const ctx = ctxIn(CHAT, MEMBER);
    await handleTeamView(ctx as never, 'sam', cfg, wideDeps());
    expect(ctx.reply.mock.calls[0][0]).toBe('More than one teammate matches "sam". Use the full name.');
  });

  it('a named member gets only their own rows', async () => {
    const ctx = ctxIn(CHAT, MEMBER);
    await handleTeamView(ctx as never, 'iman', cfg, wideDeps());
    const text = ctx.reply.mock.calls[0][0];
    expect(text).toContain('Hub repo files');
    for (const t of ['Mix the set', 'Poster', 'Private row']) expect(text).not.toContain(t);
  });

  it('ZOE_TEAM_VIEW_EXCLUDE keeps a member out; empty by default', async () => {
    expect(readTeamViewConfig({ ZOE_TEAM_VIEW: '1', ZOE_TEAM_VIEW_CHATS: '-5', ZOE_TEAM_VIEW_EXCLUDE: ' Zaal ' } as NodeJS.ProcessEnv)).toEqual({
      chats: [-5],
      exclude: ['zaal'],
    });
    const ex: TeamViewConfig = { chats: [CHAT], exclude: ['zaal'] };
    const ctx = ctxIn(CHAT, MEMBER);
    const d = wideDeps();
    await handleTeamView(ctx as never, 'zaal', ex, d);
    expect(ctx.reply.mock.calls[0][0]).toBe('That board is not shown in this chat.');
    expect(d.featureRan).not.toHaveBeenCalled();
    const open = ctxIn(CHAT, MEMBER);
    await handleTeamView(open as never, 'zaal', cfg, wideDeps());
    expect(open.reply.mock.calls[0][0]).toContain('Private row');
  });
});
