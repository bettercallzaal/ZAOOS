import { describe, it, expect } from 'vitest';
import {
  stripAgentMarkup,
  stripAgentMarkupSafe,
  containsAgentMarkup,
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
