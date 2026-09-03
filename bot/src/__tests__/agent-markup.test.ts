import { describe, it, expect } from 'vitest';
import {
  stripAgentMarkup,
  stripAgentMarkupSafe,
  containsAgentMarkup,
  AgentMarkupOnlyError,
  installAgentMarkupGuard,
  guardOutboundPayload,
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

// --------------------------------------------------------------------------
// The egress guard itself. ZAOOS#3383 was fixed by an inline transformer in
// src/index.ts, which left the ZOE bot - the one Zaal DMs, and the one whose
// cap-fallback runs on reasoning models - with no strip at all. These pin the
// installer so a second bot cannot be added without it.
// --------------------------------------------------------------------------

type Call = { method: string; payload: Record<string, unknown> };

function fakeBot() {
  const calls: Call[] = [];
  let transformer: (
    prev: (m: string, p: Record<string, unknown>) => Promise<unknown>,
    method: string,
    payload: Record<string, unknown>,
  ) => Promise<unknown>;
  const bot = {
    api: {
      config: {
        use: (t: typeof transformer) => {
          transformer = t;
        },
      },
    },
  };
  const send = async (method: string, payload: Record<string, unknown>) => {
    const prev = async (m: string, p: Record<string, unknown>) => {
      calls.push({ method: m, payload: p });
      return { ok: true, result: { message_id: 1 } };
    };
    return transformer(prev, method, payload);
  };
  return { bot, calls, send };
}

describe('installAgentMarkupGuard', () => {
  it('strips markup out of a sendMessage before it reaches Telegram', async () => {
    const { bot, calls, send } = fakeBot();
    installAgentMarkupGuard(bot as never);
    await send('sendMessage', { chat_id: 1, text: THE_ACTUAL_LEAK });
    expect(calls).toHaveLength(1);
    expect(calls[0].payload.text).toBe('Got it, the poster is on the confirmed list.');
  });

  it('blocks the send outright when the body is entirely scratchpad', async () => {
    const { bot, calls, send } = fakeBot();
    installAgentMarkupGuard(bot as never);
    const res = await send('sendMessage', {
      chat_id: 1,
      text: '<think>stalling, no answer yet</think>',
    });
    expect(calls).toHaveLength(0);
    expect(res).toEqual({ ok: true, result: true });
  });

  it('covers captions on media sends and editMessageText, not just sendMessage', async () => {
    for (const [method, field] of [
      ['editMessageText', 'text'],
      ['sendPhoto', 'caption'],
      ['sendDocument', 'caption'],
      ['sendVideo', 'caption'],
      ['sendAnimation', 'caption'],
    ] as const) {
      const { bot, calls, send } = fakeBot();
      installAgentMarkupGuard(bot as never);
      await send(method, { chat_id: 1, [field]: '<think>hidden</think>shown' });
      expect(calls[0].payload[field]).toBe('shown');
    }
  });

  it('leaves ordinary prose and unrelated methods untouched', async () => {
    const { bot, calls, send } = fakeBot();
    installAgentMarkupGuard(bot as never);
    await send('sendMessage', { chat_id: 1, text: 'I think the poster looks great' });
    await send('pinChatMessage', { chat_id: 1, message_id: 7 });
    expect(calls[0].payload.text).toBe('I think the poster looks great');
    expect(calls[1].method).toBe('pinChatMessage');
  });
});

describe('guardOutboundPayload', () => {
  it('passes a method that carries no human-visible body', () => {
    expect(guardOutboundPayload('answerCallbackQuery', { text: '<think>x</think>y' }).action).toBe(
      'pass',
    );
  });

  it('passes a non-string body rather than throwing on it', () => {
    expect(guardOutboundPayload('sendMessage', { text: 42 }).action).toBe('pass');
  });

  it('names the field it rewrote so the transformer writes back to the right one', () => {
    expect(guardOutboundPayload('sendPhoto', { caption: '<think>a</think>b' })).toEqual({
      action: 'rewrite',
      field: 'caption',
      text: 'b',
    });
  });
});
