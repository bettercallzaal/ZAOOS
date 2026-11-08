import { describe, expect, it, vi } from 'vitest';
import {
  buildOneVoiceNarrator,
  checkFixGates,
  commandArg,
  type DevzFoldConfig,
  type DevzFoldDeps,
  fixStatusReply,
  inDevzChat,
  maybeHandleMentionFix,
  parseMentionFix,
  readDevzFoldConfig,
  registerDevzFoldCommands,
} from '../devz-fold';

// Ruling 304 (2026-11-07): ZAO Devz's /fix, "fix:" after a mention and /fix_status move into
// ZOE, one voice, same gates, OFF unless ZOE_DEVZ_FOLD=1 (plan: bot/src/devz/FOLD-INTO-ZOE.md).

const DEVZ = -1001234;
const ADMIN = 11;
const cfg: DevzFoldConfig = { chatId: DEVZ, adminIds: [ADMIN], zaalId: 99 };

function deps(over: Partial<DevzFoldDeps> = {}): DevzFoldDeps {
  return {
    dispatch: vi.fn(async () => ({})),
    listOpenRuns: vi.fn(async () => []),
    getRun: vi.fn(async () => null),
    claudeAvailable: vi.fn(async () => true),
    featureRan: vi.fn(),
    ...over,
  };
}

function ctxIn(chatId: number, fromId: number, text = '', threadId?: number) {
  return {
    chat: { id: chatId },
    from: { id: fromId },
    message: { text, message_thread_id: threadId },
    reply: vi.fn(async (_t: string) => ({})),
    api: { sendMessage: vi.fn(async (_c: number, _t: string, _o?: unknown) => ({})) },
  };
}

describe('readDevzFoldConfig', () => {
  it.each([
    ['flag unset', { ZAO_DEVZ_CHAT_ID: String(DEVZ) }],
    ['flag not exactly 1', { ZOE_DEVZ_FOLD: 'true', ZAO_DEVZ_CHAT_ID: String(DEVZ) }],
    ['chat id missing', { ZOE_DEVZ_FOLD: '1' }],
    ['chat id not a number', { ZOE_DEVZ_FOLD: '1', ZAO_DEVZ_CHAT_ID: 'devz' }],
  ])('is off when %s', (_label, env) => {
    expect(readDevzFoldConfig(env as NodeJS.ProcessEnv)).toBeNull();
  });

  it('is on with the flag and a numeric chat id, and parses admins', () => {
    const c = readDevzFoldConfig({
      ZOE_DEVZ_FOLD: '1',
      ZAO_DEVZ_CHAT_ID: String(DEVZ),
      BOT_ADMIN_TELEGRAM_IDS: '11, 22,bad,-3',
      ZAAL_TELEGRAM_ID: '99',
    } as NodeJS.ProcessEnv);
    expect(c).toEqual({ chatId: DEVZ, adminIds: [11, 22], zaalId: 99 });
  });

  it('leaves no admins when BOT_ADMIN_TELEGRAM_IDS is unset (fails closed)', () => {
    const c = readDevzFoldConfig({ ZOE_DEVZ_FOLD: '1', ZAO_DEVZ_CHAT_ID: String(DEVZ) } as NodeJS.ProcessEnv);
    expect(c?.adminIds).toEqual([]);
  });
});

describe('parseMentionFix', () => {
  it.each([
    ['@zaoclaw_bot fix: add a healthcheck command', 'add a healthcheck command'],
    ['@ZAOCLAW_BOT Fix: add a healthcheck command', 'add a healthcheck command'],
    ['  @zaoclaw_bot, fix:add a healthcheck', 'add a healthcheck'],
  ])('reads %j', (text, issue) => {
    expect(parseMentionFix(text, 'zaoclaw_bot')).toBe(issue);
  });

  it.each([
    ['a plain mention stays a concierge turn', '@zaoclaw_bot add a healthcheck command'],
    ['fix: without the mention', 'fix: add a healthcheck command'],
    ['a mention of another bot', '@zaodevz_bot fix: add a healthcheck'],
    ['fix: later in the sentence', '@zaoclaw_bot can you fix: the thing'],
  ])('returns null for %s', (_label, text) => {
    expect(parseMentionFix(text, 'zaoclaw_bot')).toBeNull();
  });

  it('returns null before boot knows the username', () => {
    expect(parseMentionFix('@zaoclaw_bot fix: something long enough', null)).toBeNull();
  });
});

describe('commandArg', () => {
  it('strips the command and an @bot suffix', () => {
    expect(commandArg('/fix@zaoclaw_bot   add a thing', 'fix')).toBe('add a thing');
    expect(commandArg('/fix_status abcd1234', 'fix_status')).toBe('abcd1234');
  });
});

describe('checkFixGates, in the Devz order', () => {
  const ok = async () => true;
  it('refuses a non-admin first', async () => {
    const r = await checkFixGates(cfg, { chatId: DEVZ, fromId: 5, issue: 'long enough issue' }, ok);
    expect(r).toEqual({ ok: false, reply: expect.stringContaining('admin-only') });
  });
  it('refuses another chat', async () => {
    const r = await checkFixGates(cfg, { chatId: 42, fromId: ADMIN, issue: 'long enough issue' }, ok);
    expect(r).toEqual({ ok: false, reply: expect.stringContaining('ZAO Devz chat') });
  });
  it('refuses when the claude CLI is missing', async () => {
    const r = await checkFixGates(cfg, { chatId: DEVZ, fromId: ADMIN, issue: 'long enough issue' }, async () => false);
    expect(r).toEqual({ ok: false, reply: expect.stringContaining("'claude' CLI") });
  });
  it('refuses an issue under 10 characters', async () => {
    const r = await checkFixGates(cfg, { chatId: DEVZ, fromId: ADMIN, issue: 'short' }, ok);
    expect(r).toEqual({ ok: false, reply: expect.stringContaining('10 characters') });
  });
  it('passes an admin in the Devz chat with a real issue', async () => {
    expect(await checkFixGates(cfg, { chatId: DEVZ, fromId: ADMIN, issue: 'add a healthcheck' }, ok)).toEqual({ ok: true });
  });
});

describe('buildOneVoiceNarrator', () => {
  it('speaks as Coder and Critic in one voice', async () => {
    const say = vi.fn(async (_t: string, _o?: unknown) => ({}));
    const n = buildOneVoiceNarrator(say, 99);
    await n.onCoderStart?.('abcdef1234', 1, 3, 'issue');
    await n.onCriticDone?.('abcdef1234', 82, 'good');
    await n.onPrOpened?.('abcdef1234', 7, 'https://github.com/x/y/pull/7', 82);
    const lines = say.mock.calls.map((c) => c[0]);
    expect(lines[0]).toMatch(/^Coder: starting \(attempt 1\/3\) on run abcdef12/);
    expect(lines[1]).toMatch(/^Critic: score 82\/100 \(PASS\)/);
    expect(lines[2]).toContain('PR #7');
    expect(say.mock.calls[2][1]).toEqual({ parse_mode: 'HTML' });
  });
});

describe('fixStatusReply', () => {
  const run = { id: 'abcdef12-0000', status: 'critic_review', fixer_attempts: 1, critic_score: null, pr_url: null, issue_text: 'x' };
  it('says when nothing is open', async () => {
    expect(await fixStatusReply('', deps())).toBe('No open Hermes runs.');
  });
  it('finds one run by prefix and logs the Devz feature name', async () => {
    const d = deps({ listOpenRuns: vi.fn(async () => [run]) as DevzFoldDeps['listOpenRuns'] });
    expect(await fixStatusReply('abcdef', d)).toContain('abcdef12 | critic_review');
    expect(d.featureRan).toHaveBeenCalledWith('devz-fix-status', 'zoe one run');
  });
  it('says no match', async () => {
    expect(await fixStatusReply('zzzz', deps())).toBe('No run matching zzzz');
  });
});

describe('maybeHandleMentionFix', () => {
  it('does nothing when the fold is off', async () => {
    const d = deps();
    const ctx = ctxIn(DEVZ, ADMIN);
    expect(await maybeHandleMentionFix(ctx as never, '@zaoclaw_bot fix: add a healthcheck', 'zaoclaw_bot', null, d)).toBe(false);
    expect(d.dispatch).not.toHaveBeenCalled();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('does nothing in another chat', async () => {
    const d = deps();
    expect(await maybeHandleMentionFix(ctxIn(42, ADMIN) as never, '@zaoclaw_bot fix: add a healthcheck', 'zaoclaw_bot', cfg, d)).toBe(false);
    expect(d.dispatch).not.toHaveBeenCalled();
  });

  it('lets a plain mention fall through to the concierge', async () => {
    const d = deps();
    expect(await maybeHandleMentionFix(ctxIn(DEVZ, ADMIN) as never, '@zaoclaw_bot what is live?', 'zaoclaw_bot', cfg, d)).toBe(false);
    expect(d.dispatch).not.toHaveBeenCalled();
  });

  it('owns "@zoe fix:" and dispatches once, narrating into the same thread', async () => {
    const d = deps();
    const ctx = ctxIn(DEVZ, ADMIN, '', 5);
    expect(await maybeHandleMentionFix(ctx as never, '@zaoclaw_bot fix: add a healthcheck', 'zaoclaw_bot', cfg, d)).toBe(true);
    expect(d.dispatch).toHaveBeenCalledTimes(1);
    const [input, narrator] = (d.dispatch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(input).toEqual({ triggered_by_telegram_id: ADMIN, triggered_in_chat_id: DEVZ, issue_text: 'add a healthcheck' });
    expect(d.featureRan).toHaveBeenCalledWith('devz-fix', 'zoe mention');
    await narrator.onFailed('abcdef1234', 'boom');
    expect(ctx.api.sendMessage).toHaveBeenCalledWith(DEVZ, expect.stringContaining('FAILED'), { message_thread_id: 5 });
  });

  it('owns the message but refuses a non-admin, and never dispatches', async () => {
    const d = deps();
    const ctx = ctxIn(DEVZ, 5);
    expect(await maybeHandleMentionFix(ctx as never, '@zaoclaw_bot fix: add a healthcheck', 'zaoclaw_bot', cfg, d)).toBe(true);
    expect(d.dispatch).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('admin-only'));
  });
});

describe('registerDevzFoldCommands', () => {
  function fakeBot() {
    const handlers = new Map<string, (ctx: unknown) => Promise<void>>();
    const bot = { command: vi.fn((name: string, h: (ctx: unknown) => Promise<void>) => handlers.set(name, h)) };
    return { bot, handlers };
  }

  it('registers /fix and /fix_status only', () => {
    const { bot, handlers } = fakeBot();
    registerDevzFoldCommands(bot as never, cfg, deps());
    expect([...handlers.keys()].sort()).toEqual(['fix', 'fix_status']);
  });

  it('/fix runs the loop for an admin in the Devz chat', async () => {
    const { bot, handlers } = fakeBot();
    const d = deps();
    registerDevzFoldCommands(bot as never, cfg, d);
    await handlers.get('fix')?.(ctxIn(DEVZ, ADMIN, '/fix@zaoclaw_bot add a healthcheck command'));
    expect(d.dispatch).toHaveBeenCalledTimes(1);
    expect(d.featureRan).toHaveBeenCalledWith('devz-fix', 'zoe command');
  });

  it('/fix is silent in any other chat', async () => {
    const { bot, handlers } = fakeBot();
    const d = deps();
    registerDevzFoldCommands(bot as never, cfg, d);
    const ctx = ctxIn(42, ADMIN, '/fix add a healthcheck command');
    await handlers.get('fix')?.(ctx);
    expect(ctx.reply).not.toHaveBeenCalled();
    expect(d.dispatch).not.toHaveBeenCalled();
  });

  it('/fix from a non-admin in the Devz chat is refused and never dispatches', async () => {
    const { bot, handlers } = fakeBot();
    const d = deps();
    registerDevzFoldCommands(bot as never, cfg, d);
    const ctx = ctxIn(DEVZ, 77, '/fix add a healthcheck command');
    await handlers.get('fix')?.(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('admin-only'));
    expect(d.dispatch).not.toHaveBeenCalled();
    expect(d.featureRan).not.toHaveBeenCalled();
  });

  it('/fix with no text shows usage and does not dispatch', async () => {
    const { bot, handlers } = fakeBot();
    const d = deps();
    registerDevzFoldCommands(bot as never, cfg, d);
    const ctx = ctxIn(DEVZ, ADMIN, '/fix');
    await handlers.get('fix')?.(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Usage'));
    expect(d.dispatch).not.toHaveBeenCalled();
  });

  it('/fix_status replies with the run list', async () => {
    const { bot, handlers } = fakeBot();
    registerDevzFoldCommands(bot as never, cfg, deps());
    const ctx = ctxIn(DEVZ, ADMIN, '/fix_status');
    await handlers.get('fix_status')?.(ctx);
    expect(ctx.reply).toHaveBeenCalledWith('No open Hermes runs.');
  });
});

describe('inDevzChat (reuses memory.ts isDevzGroup)', () => {
  it('is true only for the Devz chat id', () => {
    expect(inDevzChat(cfg, DEVZ)).toBe(true);
    expect(inDevzChat(cfg, 42)).toBe(false);
    expect(inDevzChat(cfg, undefined)).toBe(false);
  });
});
