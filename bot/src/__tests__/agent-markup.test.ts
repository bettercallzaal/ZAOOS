import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  stripAgentMarkup,
  stripAgentMarkupSafe,
  containsAgentMarkup,
  stripMarkupInPlace,
  AgentMarkupOnlyError,
} from '../agent-markup';

// The real leak, ZAOOS#3383: this reached Telegram #marketing on 2026-05-13 as
// the message body, and nothing errored.
const THE_ACTUAL_LEAK =
  '<think>The user typed a short note about the poster. They probably want me to ' +
  'confirm it landed, so I should keep this brief.</think>Got it, the poster is on ' +
  'the confirmed list.';

describe('the message that actually leaked', () => {
  it('keeps the reply and drops the reasoning', () => {
    expect(stripAgentMarkup(THE_ACTUAL_LEAK)).toBe('Got it, the poster is on the confirmed list.');
  });

  it('leaves nothing recognisable as scratchpad behind', () => {
    const out = stripAgentMarkup(THE_ACTUAL_LEAK);
    expect(containsAgentMarkup(out)).toBe(false);
    expect(out).not.toContain('The user typed');
  });
});

describe('stripAgentMarkup', () => {
  it('strips every tag variant, not just think', () => {
    for (const tag of ['think', 'thinking', 'scratchpad', 'reasoning', 'reflection']) {
      expect(stripAgentMarkup(`<${tag}>hidden</${tag}>visible`)).toBe('visible');
    }
  });

  it('is case insensitive and tolerates attributes', () => {
    expect(stripAgentMarkup('<THINK>x</THINK>kept')).toBe('kept');
    expect(stripAgentMarkup('<think depth="3">x</think>kept')).toBe('kept');
  });

  it('strips multiple blocks in one message', () => {
    expect(stripAgentMarkup('<think>a</think>one<think>b</think>two')).toBe('onetwo');
  });

  // The paired regex cannot match this, so without a separate rule the whole
  // scratchpad would ship. A truncated stream produces exactly this shape.
  it('drops an unclosed opener and everything after it', () => {
    expect(stripAgentMarkup('Real answer.<think>then it got cut off mid sen')).toBe('Real answer.');
  });

  it('removes an orphan closer left by an upstream partial strip', () => {
    expect(stripAgentMarkup('kept</think>')).toBe('kept');
  });

  it('leaves ordinary text completely alone', () => {
    const plain = 'Soundcheck is Friday at 6. Bring the wireless mic.';
    expect(stripAgentMarkup(plain)).toBe(plain);
  });

  it('does not eat a legitimate mention of the word think', () => {
    const plain = 'I think the parklet is the better option.';
    expect(stripAgentMarkup(plain)).toBe(plain);
  });

  it('handles an empty string without throwing', () => {
    expect(stripAgentMarkup('')).toBe('');
  });
});

describe('when the body is ENTIRELY scratchpad', () => {
  const allMarkup = '<think>I am not sure what to say here, so I will stall.</think>';

  // Both alternatives are wrong. Sending '' posts a confusing empty message;
  // falling back to the original posts the exact thing being stripped.
  it('throws rather than sending an empty message or the raw reasoning', () => {
    expect(() => stripAgentMarkup(allMarkup)).toThrow(AgentMarkupOnlyError);
  });

  it('carries the original on the error so it can be logged, not sent', () => {
    try {
      stripAgentMarkup(allMarkup);
      expect.unreachable('should have thrown');
    } catch (e) {
      expect((e as AgentMarkupOnlyError).original).toBe(allMarkup);
    }
  });

  it('the safe variant returns null instead of throwing', () => {
    expect(stripAgentMarkupSafe(allMarkup)).toBeNull();
    expect(stripAgentMarkupSafe(THE_ACTUAL_LEAK)).toBe('Got it, the poster is on the confirmed list.');
  });
});

// The egress guard every bot installs. Pins the behaviour the transformer
// depends on, so a bot wiring it in gets the same answers as the one that
// already had it.
describe('stripMarkupInPlace', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('cleans the text field of a sendMessage payload in place', () => {
    const payload: Record<string, unknown> = { chat_id: 42, text: THE_ACTUAL_LEAK };
    expect(stripMarkupInPlace('sendMessage', payload)).toBe('cleaned');
    expect(payload.text).toBe('Got it, the poster is on the confirmed list.');
  });

  it('cleans the caption field on the media methods', () => {
    for (const method of ['sendPhoto', 'sendDocument', 'sendVideo', 'sendAnimation']) {
      const payload: Record<string, unknown> = { chat_id: 1, caption: THE_ACTUAL_LEAK };
      expect(stripMarkupInPlace(method, payload)).toBe('cleaned');
      expect(payload.caption).toBe('Got it, the poster is on the confirmed list.');
    }
  });

  it('covers editMessageText, which rewrites a body a human is already reading', () => {
    const payload: Record<string, unknown> = { chat_id: 1, text: THE_ACTUAL_LEAK };
    expect(stripMarkupInPlace('editMessageText', payload)).toBe('cleaned');
    expect(payload.text).toBe('Got it, the poster is on the confirmed list.');
  });

  it('blocks a body that was entirely scratchpad, and leaves it unsent', () => {
    const payload: Record<string, unknown> = { chat_id: 7, text: '<think>only reasoning</think>' };
    expect(stripMarkupInPlace('sendMessage', payload)).toBe('blocked');
    // Unchanged: the caller must drop the send, never send a mangled body.
    expect(payload.text).toBe('<think>only reasoning</think>');
  });

  it('passes clean text through untouched', () => {
    const payload: Record<string, unknown> = { chat_id: 1, text: 'Poster is confirmed.' };
    expect(stripMarkupInPlace('sendMessage', payload)).toBe('pass');
    expect(payload.text).toBe('Poster is confirmed.');
  });

  it('ignores methods that carry no human-visible body', () => {
    const payload: Record<string, unknown> = { chat_id: 1, text: THE_ACTUAL_LEAK };
    expect(stripMarkupInPlace('answerCallbackQuery', payload)).toBe('pass');
    expect(payload.text).toBe(THE_ACTUAL_LEAK);
  });

  it('ignores a non-string body rather than throwing on it', () => {
    const payload: Record<string, unknown> = { chat_id: 1, text: undefined };
    expect(stripMarkupInPlace('sendMessage', payload)).toBe('pass');
  });

  it('says what it did, because a silently reshaped send is the failure mode', () => {
    const payload: Record<string, unknown> = { chat_id: 42, text: THE_ACTUAL_LEAK };
    stripMarkupInPlace('sendMessage', payload);
    expect(console.error).toHaveBeenCalledWith(
      '[agent-markup] stripped agent markup from an outbound message',
      { method: 'sendMessage', chat_id: 42 },
    );
  });
});
