// @vitest-environment node
// Tests for pure utility functions in zoe/types.ts and zoe/memory.ts:
//   selectModel          — cost-routing heuristic (no mocks: tests against exported constants)
//   isConversationalTurn — chat vs work classifier
//   renderConciergePrompt — memory blocks → prompt string
import { describe, expect, it } from 'vitest';
import {
  selectModel,
  isConversationalTurn,
  ZOE_DEFAULT_MODEL,
  ZOE_HARD_MODEL,
  ZOE_QUICK_MODEL,
} from '../types';
import { renderConciergePrompt } from '../memory';
import type { MemoryBlocks } from '../memory';

const BASE_BLOCKS: MemoryBlocks = {
  persona: 'ZOE — Zaal concierge.',
  human: 'Zaal builds ZAO.',
  working: '(no recent turns)',
  tasks: '(no open tasks)',
  quests: 'Main: become the ZAO case study',
  chat_scope: 'private',
};

// ── selectModel ───────────────────────────────────────────────────────────────

describe('selectModel — hard model (strategic keyword or long message)', () => {
  it.each([
    ['plan', 'plan the ZAO launch'],
    ['strategy', 'discuss strategy for ZAOstock'],
    ['should i', 'should i take this sponsorship deal'],
    ['tradeoff', 'tradeoff between Solana and Base'],
    ['vs', 'solana vs ethereum for WaveWarZ'],
    ['decide', 'decide what to ship next quarter'],
    ['compare', 'compare these two contract structures'],
    ['whitepaper', 'review the whitepaper draft'],
    ['architecture', 'design the architecture for ZAO OS'],
  ])('returns hard model for "%s" keyword', (_kw, msg) => {
    expect(selectModel(msg)).toBe(ZOE_HARD_MODEL);
  });

  it('returns hard model when message length exceeds 280 chars', () => {
    expect(selectModel('z'.repeat(281))).toBe(ZOE_HARD_MODEL);
  });

  it('strategic keyword wins over quick keyword in the same message', () => {
    // 'time' is a quick keyword but 'plan' is strategic — strategic fires first
    expect(selectModel('what time should we plan the release')).toBe(ZOE_HARD_MODEL);
  });
});

describe('selectModel — quick model (simple factual + short message)', () => {
  it.each([
    ['what is', 'what is ZAO?'],
    ['when', 'when is the show?'],
    ['where', 'where is Ellsworth?'],
    ['who', 'who is Cassie?'],
    ['time', 'what time is it?'],
    ['date', 'what date is today?'],
  ])('returns quick model for "%s" + short message', (_kw, msg) => {
    expect(selectModel(msg)).toBe(ZOE_QUICK_MODEL);
  });

  it('falls through to default when quick keyword but message is >= 80 chars', () => {
    // length exactly 80 is not < 80
    const msg = 'when ' + 'x'.repeat(75); // 5 + 75 = 80
    expect(selectModel(msg)).toBe(ZOE_DEFAULT_MODEL);
  });
});

describe('selectModel — default model (catch-all)', () => {
  it('returns default model for a plain short message without keywords', () => {
    expect(selectModel('hello')).toBe(ZOE_DEFAULT_MODEL);
  });

  it('returns default model for a casual reply', () => {
    expect(selectModel('sounds good, thanks')).toBe(ZOE_DEFAULT_MODEL);
  });

  it('returns default model for a message at exactly 280 chars (not over)', () => {
    expect(selectModel('a'.repeat(280))).toBe(ZOE_DEFAULT_MODEL);
  });
});

// ── isConversationalTurn ──────────────────────────────────────────────────────

describe('isConversationalTurn — returns false', () => {
  it('returns false for an empty string', () => {
    expect(isConversationalTurn('')).toBe(false);
  });

  it('returns false for whitespace-only input', () => {
    expect(isConversationalTurn('   ')).toBe(false);
  });

  it('returns false when message contains a URL', () => {
    expect(isConversationalTurn('check out https://zaoos.com for me')).toBe(false);
  });

  it.each([
    ['plan', 'plan the next drop'],
    ['strategy', 'strategy for ZAOstock'],
    ['should i', 'should i merge this PR'],
    ['research', 'research WaveWarZ competitors'],
    ['analyze', 'analyze the dashboard metrics'],
    ['draft ', 'draft a message to the sponsors'],
    ['write a', 'write a post for Farcaster'],
    ['write up', 'write up the recap from tonight'],
    ['build ', 'build a new feature for ZAO OS'],
    ['design ', 'design a landing page for COC'],
    ['spec ', 'spec the music module integration'],
    ['audit', 'audit the current integrations'],
    ['decompose', 'decompose this goal into tasks'],
    ['dispatch', 'dispatch the research agent'],
    ['compare', 'compare these two approaches'],
    ['architecture', 'architecture for the new pipeline'],
  ])('returns false for work keyword "%s"', (_kw, msg) => {
    expect(isConversationalTurn(msg)).toBe(false);
  });

  it('is case-insensitive for work keywords', () => {
    expect(isConversationalTurn('RESEARCH this topic')).toBe(false);
    expect(isConversationalTurn('Plan the event')).toBe(false);
  });

  it('returns false for a message exceeding 220 chars', () => {
    expect(isConversationalTurn('x'.repeat(221))).toBe(false);
  });
});

describe('isConversationalTurn — returns true', () => {
  it('returns true for a short factual question with no work keywords', () => {
    expect(isConversationalTurn('what time is the show?')).toBe(true);
  });

  it('returns true for a casual back-and-forth reply', () => {
    expect(isConversationalTurn('sounds good, thanks')).toBe(true);
  });

  it('returns true for a short greeting', () => {
    expect(isConversationalTurn('hey, how are things?')).toBe(true);
  });

  it('returns true for a message of exactly 220 chars (boundary — not > 220)', () => {
    expect(isConversationalTurn('a'.repeat(220))).toBe(true);
  });
});

// ── renderConciergePrompt ─────────────────────────────────────────────────────

describe('renderConciergePrompt — structural sections', () => {
  it('wraps persona in <persona> tags', () => {
    const out = renderConciergePrompt(BASE_BLOCKS, 'Zaal', 'hello');
    expect(out).toContain('<persona>');
    expect(out).toContain('ZOE — Zaal concierge.');
    expect(out).toContain('</persona>');
  });

  it('wraps human in <human> tags', () => {
    const out = renderConciergePrompt(BASE_BLOCKS, 'Zaal', 'hello');
    expect(out).toContain('<human>');
    expect(out).toContain('Zaal builds ZAO.');
    expect(out).toContain('</human>');
  });

  it('wraps content in <working_memory> tags', () => {
    const out = renderConciergePrompt(BASE_BLOCKS, 'Zaal', 'hello');
    expect(out).toContain('<working_memory>');
    expect(out).toContain('</working_memory>');
  });

  it('wraps tasks in <tasks> tags', () => {
    const out = renderConciergePrompt(BASE_BLOCKS, 'Zaal', 'hello');
    expect(out).toContain('<tasks>');
    expect(out).toContain('(no open tasks)');
    expect(out).toContain('</tasks>');
  });

  it('ends with "senderLabel: userMessage" on the final non-empty line', () => {
    const out = renderConciergePrompt(BASE_BLOCKS, 'Zaal', 'what is the status?');
    const lastLine = out.split('\n').filter(Boolean).at(-1);
    expect(lastLine).toBe('Zaal: what is the status?');
  });
});

describe('renderConciergePrompt — chat scope', () => {
  it('uses "Chat: DM with Zaal" for private scope', () => {
    const out = renderConciergePrompt(BASE_BLOCKS, 'Zaal', 'hello');
    expect(out).toContain('Chat: DM with Zaal');
  });

  it('uses group title and scope id for non-private scope with chat_title', () => {
    const blocks: MemoryBlocks = { ...BASE_BLOCKS, chat_scope: '100', chat_title: 'ZAO HQ' };
    const out = renderConciergePrompt(blocks, 'Ali', 'hi');
    expect(out).toContain('Chat: group "ZAO HQ" (id 100)');
  });

  it('falls back to scope id as title when chat_title is absent', () => {
    const blocks: MemoryBlocks = { ...BASE_BLOCKS, chat_scope: '200', chat_title: undefined };
    const out = renderConciergePrompt(blocks, 'Ali', 'hi');
    expect(out).toContain('Chat: group "200" (id 200)');
  });
});

describe('renderConciergePrompt — optional blocks', () => {
  it('includes <quests> block when quests is non-empty', () => {
    const out = renderConciergePrompt(BASE_BLOCKS, 'Zaal', 'hi');
    expect(out).toContain('<quests>');
    expect(out).toContain('Main: become the ZAO case study');
    expect(out).toContain('</quests>');
  });

  it('omits <quests> block when quests is an empty string', () => {
    const blocks: MemoryBlocks = { ...BASE_BLOCKS, quests: '' };
    const out = renderConciergePrompt(blocks, 'Zaal', 'hi');
    expect(out).not.toContain('<quests>');
  });

  it('includes <decisions> block when decisions is set', () => {
    const blocks: MemoryBlocks = {
      ...BASE_BLOCKS,
      decisions: '- Ship ZAO v2\n  Why: Q3 goal',
    };
    const out = renderConciergePrompt(blocks, 'Zaal', 'hi');
    expect(out).toContain('<decisions>');
    expect(out).toContain('Ship ZAO v2');
    expect(out).toContain('</decisions>');
  });

  it('omits <decisions> block when decisions is undefined', () => {
    const blocks: MemoryBlocks = { ...BASE_BLOCKS, decisions: undefined };
    expect(renderConciergePrompt(blocks, 'Zaal', 'hi')).not.toContain('<decisions>');
  });

  it('includes <build_state> block when build_state is set', () => {
    const blocks: MemoryBlocks = { ...BASE_BLOCKS, build_state: '- ZAO OS [open]' };
    const out = renderConciergePrompt(blocks, 'Zaal', 'hi');
    expect(out).toContain('<build_state>');
    expect(out).toContain('ZAO OS [open]');
    expect(out).toContain('</build_state>');
  });

  it('omits <build_state> block when build_state is undefined', () => {
    const blocks: MemoryBlocks = { ...BASE_BLOCKS, build_state: undefined };
    expect(renderConciergePrompt(blocks, 'Zaal', 'hi')).not.toContain('<build_state>');
  });

  it('includes <inbox_context> block with PII disclaimer when inbox_context is set', () => {
    const blocks: MemoryBlocks = {
      ...BASE_BLOCKS,
      inbox_context: '- Sponsor outreach from Alice',
    };
    const out = renderConciergePrompt(blocks, 'Zaal', 'hi');
    expect(out).toContain('<inbox_context>');
    expect(out).toContain('PII-scrubbed');
    expect(out).toContain('Sponsor outreach from Alice');
    expect(out).toContain('</inbox_context>');
  });

  it('omits <inbox_context> block when inbox_context is undefined', () => {
    const blocks: MemoryBlocks = { ...BASE_BLOCKS, inbox_context: undefined };
    expect(renderConciergePrompt(blocks, 'Zaal', 'hi')).not.toContain('<inbox_context>');
  });

  it('reflects the sender label on the final line', () => {
    const out = renderConciergePrompt(BASE_BLOCKS, 'Alex', 'are you free?');
    const lastLine = out.split('\n').filter(Boolean).at(-1);
    expect(lastLine).toBe('Alex: are you free?');
  });
});
