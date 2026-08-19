// @vitest-environment node
// doc 2314 phase 1b: per-topic needs-you question routing + reaction callbacks.
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockGetTopicThread = vi.hoisted(() => vi.fn());

vi.mock('../topics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../topics')>();
  return { ...actual, getTopicThread: mockGetTopicThread };
});

import {
  encodeReaction,
  parseReactionCallback,
  reactionKeyboard,
  REACTION_TYPES,
} from '../questions';
import {
  resolveQuestionTopic,
  routeQuestionToTopic,
  type TelegramRoutingDeps,
} from '../telegram-routing';

afterEach(() => vi.clearAllMocks());

function makeDeps(overrides: Partial<TelegramRoutingDeps> = {}): TelegramRoutingDeps & {
  sendMessage: ReturnType<typeof vi.fn>;
} {
  return {
    sendMessage: vi.fn().mockResolvedValue(undefined),
    zaalId: 111,
    groupId: 222,
    ...overrides,
  } as TelegramRoutingDeps & { sendMessage: ReturnType<typeof vi.fn> };
}

// ── resolveQuestionTopic ─────────────────────────────────────────────────────

describe('resolveQuestionTopic', () => {
  it('routes a brand that is a standard topic to that topic', () => {
    expect(resolveQuestionTopic('ZABAL Games')).toBe('ZABAL Games');
    expect(resolveQuestionTopic('WaveWarZ')).toBe('WaveWarZ');
  });

  it('routes unbranded and unknown brands to Claude Code', () => {
    expect(resolveQuestionTopic(undefined)).toBe('Claude Code');
    expect(resolveQuestionTopic('')).toBe('Claude Code');
    expect(resolveQuestionTopic('Not A Topic')).toBe('Claude Code');
  });
});

// ── routeQuestionToTopic ─────────────────────────────────────────────────────

describe('routeQuestionToTopic', () => {
  const q = { qid: 'qb1', text: 'Ship it?', options: ['Yes', 'No'] };

  it('posts to the mapped thread with a question keyboard', async () => {
    mockGetTopicThread.mockResolvedValue(12);
    const deps = makeDeps();
    await routeQuestionToTopic(deps, 'ZABAL Games', q);
    expect(mockGetTopicThread).toHaveBeenCalledWith('ZABAL Games');
    const [chatId, text, opts] = deps.sendMessage.mock.calls[0];
    expect(chatId).toBe(222);
    expect(text).toBe('Ship it?');
    expect(opts.message_thread_id).toBe(12);
    const labels = opts.reply_markup.inline_keyboard.flat().map((b: { text: string }) => b.text);
    expect(labels).toEqual(['Yes', 'No', 'Type my own']);
  });

  it('posts an unmapped topic to the group root and logs loud', async () => {
    mockGetTopicThread.mockResolvedValue(undefined);
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const deps = makeDeps();
    await routeQuestionToTopic(deps, 'ZABAL Games', q);
    const [chatId, , opts] = deps.sendMessage.mock.calls[0];
    expect(chatId).toBe(222);
    expect(opts.message_thread_id).toBeUndefined();
    expect(err).toHaveBeenCalledWith(expect.stringContaining('not in topics.json'));
    err.mockRestore();
  });

  it('posts General (sentinel 0) to the group root without an error', async () => {
    mockGetTopicThread.mockResolvedValue(0);
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const deps = makeDeps();
    await routeQuestionToTopic(deps, 'General', q);
    const [, , opts] = deps.sendMessage.mock.calls[0];
    expect(opts.message_thread_id).toBeUndefined();
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
  });

  it('falls back to the DM when no groupId is configured', async () => {
    const deps = makeDeps({ groupId: undefined });
    await routeQuestionToTopic(deps, 'ZABAL Games', q);
    const [chatId, , opts] = deps.sendMessage.mock.calls[0];
    expect(chatId).toBe(111);
    expect(opts.message_thread_id).toBeUndefined();
    expect(mockGetTopicThread).not.toHaveBeenCalled();
  });

  it('uses the reaction keyboard when options is empty', async () => {
    mockGetTopicThread.mockResolvedValue(12);
    const deps = makeDeps();
    await routeQuestionToTopic(deps, 'ZABAL Games', { qid: 'qb2', text: 'PR up.', options: [] });
    const [, , opts] = deps.sendMessage.mock.calls[0];
    const labels = opts.reply_markup.inline_keyboard.flat().map((b: { text: string }) => b.text);
    expect(labels).toEqual(['Approve', 'Done']);
  });
});

// ── reaction callbacks ───────────────────────────────────────────────────────

describe('reaction callbacks', () => {
  it('encode/parse roundtrips every reaction type', () => {
    for (const r of REACTION_TYPES) {
      expect(parseReactionCallback(encodeReaction('qb1', r))).toEqual({ qid: 'qb1', reaction: r });
    }
  });

  it('rejects non-reaction callbacks and unknown reaction values', () => {
    expect(parseReactionCallback('q:qb1:eWVz')).toBeNull();
    expect(parseReactionCallback('r:qb1')).toBeNull();
    expect(parseReactionCallback('r::YXBwcm92ZQ')).toBeNull();
    expect(
      parseReactionCallback(`r:qb1:${Buffer.from('explode', 'utf8').toString('base64url')}`),
    ).toBeNull();
  });

  it('reactionKeyboard puts Approve + Done on one row with r: callbacks', () => {
    const kb = reactionKeyboard('qb1');
    expect(kb.inline_keyboard).toHaveLength(1);
    const [approve, done] = kb.inline_keyboard[0];
    expect(approve.text).toBe('Approve');
    expect(approve.callback_data.startsWith('r:qb1:')).toBe(true);
    expect(done.text).toBe('Done');
  });

  it('throws when callback_data would exceed the 64-byte cap', () => {
    expect(() => encodeReaction('x'.repeat(60), 'approve')).toThrow(/64/);
  });
});
