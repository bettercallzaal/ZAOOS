import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  BODY_MAX_CHARS,
  docPath,
  type FetchFn,
  type GroupGithubConfig,
  type GroupGithubDeps,
  handleGithubAsk,
  parseAsk,
  REPLY_MAX_CHARS,
  readDoc,
  readGroupGithubConfig,
  readIssue,
} from '../group-github';
import type { GroupConfig } from '../groups';

// iman-desk #168 item 1: read-only GitHub in allowlisted groups.

const CHAT = -1007;
const MEMBER = 31;
const cfg: GroupGithubConfig = { token: 'stub-token', chats: [CHAT], repos: ['ZAODEVZ/iman-desk'], docsRepo: 'ZAODEVZ/ZAOresearch' };

type Route = Record<string, { status?: number; body: unknown }>;
function fakeFetch(routes: Route): FetchFn & { calls: Array<{ url: string; headers: Record<string, string> }> } {
  const calls: Array<{ url: string; headers: Record<string, string> }> = [];
  const fn = (async (url: string, init: { headers: Record<string, string> }) => {
    calls.push({ url, headers: init.headers });
    const r = routes[url];
    const status = r ? (r.status ?? 200) : 404;
    return { ok: status < 400, status, text: async () => (typeof r?.body === 'string' ? r.body : JSON.stringify(r?.body ?? {})) };
  }) as FetchFn & { calls: typeof calls };
  fn.calls = calls;
  return fn;
}

const ISSUE_URL = 'https://api.github.com/repos/ZAODEVZ/iman-desk/issues/175';
const ISSUE = {
  number: 175,
  title: 'Set up the hub repo',
  state: 'open',
  html_url: 'https://github.com/ZAODEVZ/iman-desk/issues/175',
  body: 'Five files, one each.',
  comments: 2,
  updated_at: '2026-11-08T10:00:00Z',
  labels: [{ name: 'ops' }],
};

function group(over: Partial<GroupConfig> = {}): GroupConfig {
  return { chat_id: CHAT, chat_title: 't', mode: 'mention', member_allowlist: [MEMBER], created_at: '', updated_at: '', ...over };
}
function deps(fetchFn: FetchFn, over: Partial<GroupGithubDeps> = {}): GroupGithubDeps {
  return { getGroupConfig: vi.fn(async () => group()), fetch: fetchFn, featureRan: vi.fn(), botUsername: () => 'zaoclaw_bot', botId: () => 1, ...over };
}
function ctxIn(chatId: number, fromId: number) {
  return { chat: { id: chatId }, from: { id: fromId }, reply: vi.fn(async (_t: string, _o?: unknown) => ({})) };
}

describe('readGroupGithubConfig', () => {
  const on = { ZOE_GROUP_GITHUB: '1', ZOE_GROUP_GITHUB_TOKEN: 'stub-a', ZOE_GROUP_GITHUB_CHATS: '-5, x, -6' };
  it.each([
    [{}],
    [{ ...on, ZOE_GROUP_GITHUB: '0' }],
    [{ ...on, ZOE_GROUP_GITHUB_TOKEN: '' }],
    [{ ...on, ZOE_GROUP_GITHUB_CHATS: 'x' }],
    [{ ...on, ZOE_GROUP_GITHUB_DOCS_REPO: 'bad repo' }],
  ])('is off for %j', (env) => {
    expect(readGroupGithubConfig(env as NodeJS.ProcessEnv)).toBeNull();
  });
  it('reads chats and the default repos', () => {
    expect(readGroupGithubConfig(on as NodeJS.ProcessEnv)).toEqual({
      token: 'stub-a',
      chats: [-5, -6],
      repos: ['ZAODEVZ/iman-desk'],
      docsRepo: 'ZAODEVZ/ZAOresearch',
    });
  });
  it('never falls back to another token', () => {
    const env = { ...on, ZOE_GROUP_GITHUB_TOKEN: undefined, GH_TOKEN: 'stub-b', GITHUB_TOKEN: 'stub-c' };
    expect(readGroupGithubConfig(env as NodeJS.ProcessEnv)).toBeNull();
  });
});

describe('parseAsk', () => {
  it('reads /issue N, /issue owner/repo N and /doc N', () => {
    expect(parseAsk('issue', '175', cfg)).toEqual({ kind: 'issue', repo: 'ZAODEVZ/iman-desk', number: 175 });
    expect(parseAsk('issue', 'zaodevz/iman-desk #12', cfg)).toEqual({ kind: 'issue', repo: 'zaodevz/iman-desk', number: 12 });
    expect(parseAsk('doc', '2732', cfg)).toEqual({ kind: 'doc', number: 2732 });
  });
  it.each([
    ['issue', ''],
    ['issue', 'abc'],
    ['issue', 'bettercallzaal/ZAOOS 1'],
    ['issue', '1 2 3'],
    ['doc', ''],
    ['doc', 'slug'],
  ] as const)('%s %j is a usage reply, never a read', (cmd, arg) => {
    expect(parseAsk(cmd, arg, cfg).kind).toBe('usage');
  });
});

describe('readIssue', () => {
  it('returns title, state, labels, body, newest comment and link; token only in the header', async () => {
    const f = fakeFetch({
      [ISSUE_URL]: { body: ISSUE },
      [`${ISSUE_URL}/comments?per_page=1&page=2`]: { body: [{ body: 'Done, link posted.', created_at: '2026-11-08T11:00:00Z' }] },
    });
    const out = await readIssue(cfg, 'ZAODEVZ/iman-desk', 175, f);
    expect(out).toContain('ZAODEVZ/iman-desk #175: Set up the hub repo (open; ops; updated 2026-11-08)');
    expect(out).toContain('Five files, one each.');
    expect(out).toContain('Newest comment (2026-11-08): Done, link posted.');
    expect(out).toContain('https://github.com/ZAODEVZ/iman-desk/issues/175');
    expect(out).not.toContain('stub-token');
    expect(f.calls.every((c) => c.url.startsWith('https://api.github.com/') && c.headers.Authorization === 'Bearer stub-token')).toBe(true);
  });
  it('caps the body and the whole reply', async () => {
    const f = fakeFetch({ [ISSUE_URL]: { body: { ...ISSUE, comments: 0, body: 'x'.repeat(5000), title: 'y'.repeat(3000) } } });
    const out = (await readIssue(cfg, 'ZAODEVZ/iman-desk', 175, f)) ?? '';
    expect(out.length).toBeLessThanOrEqual(REPLY_MAX_CHARS);
    expect(out).not.toContain('x'.repeat(BODY_MAX_CHARS + 1));
  });
  it('returns null on a 404 or a body that is not an issue', async () => {
    expect(await readIssue(cfg, 'ZAODEVZ/iman-desk', 175, fakeFetch({}))).toBeNull();
    expect(await readIssue(cfg, 'ZAODEVZ/iman-desk', 175, fakeFetch({ [ISSUE_URL]: { body: { nope: 1 } } }))).toBeNull();
  });
});

describe('readDoc', () => {
  const TREE = 'https://api.github.com/repos/ZAODEVZ/ZAOresearch/git/trees/HEAD?recursive=1';
  const PATH = 'research/agents/2732-zao-devz-coordination-surface/README.md';
  it('finds doc N by its folder number and returns title and opening', async () => {
    const f = fakeFetch({
      [TREE]: { body: { tree: [{ path: PATH, type: 'blob' }, { path: 'research/agents/2733-other/README.md', type: 'blob' }] } },
      [`https://api.github.com/repos/ZAODEVZ/ZAOresearch/contents/${PATH}`]: { body: '---\ntier: QUICK\n---\n# ZAO Devz coordination\n\nThe plan in eight steps.' },
    });
    const out = await readDoc(cfg, 2732, f);
    expect(out).toContain('Doc 2732: ZAO Devz coordination');
    expect(out).toContain('The plan in eight steps.');
    expect(out).not.toContain('tier: QUICK');
  });
  it('says so when no doc has that number', async () => {
    expect(await readDoc(cfg, 9999, fakeFetch({ [TREE]: { body: { tree: [{ path: PATH, type: 'blob' }] } } }))).toBe('No doc 9999 in ZAODEVZ/ZAOresearch.');
  });
  it('docPath prefers a live doc over an archived one and does not match 27321', () => {
    const paths = ['research/_archive/001-x/README.md', 'research/a/001-y/README.md', 'research/a/27321-z/README.md'];
    expect(docPath(paths, 1)).toBe('research/a/001-y/README.md');
    expect(docPath(paths, 2732)).toBeNull();
  });
});

describe('handleGithubAsk', () => {
  const okFetch = () => fakeFetch({ [ISSUE_URL]: { body: { ...ISSUE, comments: 0 } } });

  it('an allowlisted member in an allowlisted chat gets the issue', async () => {
    const f = okFetch();
    const d = deps(f);
    const ctx = ctxIn(CHAT, MEMBER);
    await handleGithubAsk(ctx as never, 'issue', '175', cfg, d);
    expect(ctx.reply.mock.calls[0][0]).toContain('#175: Set up the hub repo');
    expect(d.featureRan).toHaveBeenCalledWith('group-github', 'issue');
  });

  it.each([
    ['a chat not on the list', ctxIn(42, MEMBER), group()],
    ['a member the group refuses', ctxIn(CHAT, 999), group()],
    ['a silent group', ctxIn(CHAT, MEMBER), group({ mode: 'silent' })],
    ['an unconfigured group', ctxIn(CHAT, MEMBER), null],
  ])('reads nothing and says nothing in %s', async (_l, ctx, g) => {
    const f = okFetch();
    await handleGithubAsk(ctx as never, 'issue', '175', cfg, deps(f, { getGroupConfig: vi.fn(async () => g) }));
    expect(f.calls).toHaveLength(0);
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('a repo off the allowlist gets usage, with no fetch', async () => {
    const f = okFetch();
    const ctx = ctxIn(CHAT, MEMBER);
    await handleGithubAsk(ctx as never, 'issue', 'bettercallzaal/ZAOOS 1', cfg, deps(f));
    expect(f.calls).toHaveLength(0);
    expect(ctx.reply.mock.calls[0][0]).toContain('Use: /issue');
  });

  it('a failed read says so and logs no feature run', async () => {
    const d = deps(fakeFetch({}));
    const ctx = ctxIn(CHAT, MEMBER);
    await handleGithubAsk(ctx as never, 'issue', '175', cfg, d);
    expect(ctx.reply).toHaveBeenCalledWith('I could not read that from GitHub just now.');
    expect(d.featureRan).not.toHaveBeenCalled();
  });
});

describe('index.ts wiring (read as text; index.ts boots the bot and is never imported)', () => {
  const src = readFileSync(join(__dirname, '..', 'index.ts'), 'utf8');

  it('registers /issue and /doc only behind the config, above the generic text handler', () => {
    const cfgAt = src.indexOf('const groupGithubCfg = readGroupGithubConfig();');
    const regAt = src.indexOf('registerGroupGithubCommands(bot, groupGithubCfg');
    const textAt = src.indexOf("bot.on('message:text'");
    expect(cfgAt).toBeGreaterThan(-1);
    expect(src.slice(cfgAt, regAt)).toContain('if (groupGithubCfg) {');
    expect(regAt).toBeGreaterThan(cfgAt);
    expect(textAt).toBeGreaterThan(regAt);
  });
});
