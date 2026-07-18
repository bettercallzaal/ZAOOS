import { test } from 'vitest';
import assert from 'node:assert/strict';

import { renderConciergePrompt } from '../memory.ts';
import type { MemoryBlocks } from '../memory.ts';

const baseBlocks: MemoryBlocks = {
  persona: 'You are ZOE.',
  human: 'Zaal is the founder.',
  working: '[12:00] Zaal: hello',
  tasks: '1. [high] [pending] Fix the thing\n   Do the fix',
  quests: '',
  chat_scope: 'private',
};

// ===========================
// renderConciergePrompt shape
// ===========================

test('includes all core XML sections', () => {
  const out = renderConciergePrompt(baseBlocks, 'Zaal', 'test message');
  assert.ok(out.includes('<persona>'));
  assert.ok(out.includes('</persona>'));
  assert.ok(out.includes('<human>'));
  assert.ok(out.includes('</human>'));
  assert.ok(out.includes('<working_memory>'));
  assert.ok(out.includes('</working_memory>'));
  assert.ok(out.includes('<tasks>'));
  assert.ok(out.includes('</tasks>'));
});

test('private scope emits DM label', () => {
  const out = renderConciergePrompt(baseBlocks, 'Zaal', 'hi');
  assert.ok(out.includes('Chat: DM with Zaal'));
});

test('group scope emits group label with title and id', () => {
  const blocks: MemoryBlocks = { ...baseBlocks, chat_scope: 'group-123', chat_title: 'ZAO Team' };
  const out = renderConciergePrompt(blocks, 'Zaal', 'hi');
  assert.ok(out.includes('Chat: group "ZAO Team" (id group-123)'));
});

test('group scope without title falls back to scope id', () => {
  const blocks: MemoryBlocks = { ...baseBlocks, chat_scope: 'abc', chat_title: undefined };
  const out = renderConciergePrompt(blocks, 'Zaal', 'hi');
  assert.ok(out.includes('Chat: group "abc" (id abc)'));
});

test('message appears at the end prefixed by senderLabel', () => {
  const out = renderConciergePrompt(baseBlocks, 'Zaal', 'what is the plan?');
  assert.ok(out.endsWith('Zaal: what is the plan?'));
});

test('quests block is omitted when empty', () => {
  const out = renderConciergePrompt({ ...baseBlocks, quests: '' }, 'Zaal', 'x');
  assert.ok(!out.includes('<quests>'));
});

test('quests block is included when non-empty', () => {
  const out = renderConciergePrompt({ ...baseBlocks, quests: 'Q1: ship COC #8' }, 'Zaal', 'x');
  assert.ok(out.includes('<quests>'));
  assert.ok(out.includes('Q1: ship COC #8'));
});

test('decisions block is omitted when not set', () => {
  const out = renderConciergePrompt({ ...baseBlocks, decisions: undefined }, 'Zaal', 'x');
  assert.ok(!out.includes('<decisions>'));
});

test('decisions block is included when set', () => {
  const out = renderConciergePrompt({ ...baseBlocks, decisions: '- chose Supabase\n  Why: hosted' }, 'Zaal', 'x');
  assert.ok(out.includes('<decisions>'));
  assert.ok(out.includes('chose Supabase'));
});

test('build_state block is omitted when not set', () => {
  const out = renderConciergePrompt({ ...baseBlocks, build_state: undefined }, 'Zaal', 'x');
  assert.ok(!out.includes('<build_state>'));
});

test('build_state block is included when set', () => {
  const out = renderConciergePrompt({ ...baseBlocks, build_state: '- feat-x [merged] (PR 42)' }, 'Zaal', 'x');
  assert.ok(out.includes('<build_state>'));
  assert.ok(out.includes('PR 42'));
});

test('inbox_context block is omitted when not set', () => {
  const out = renderConciergePrompt({ ...baseBlocks, inbox_context: undefined }, 'Zaal', 'x');
  assert.ok(!out.includes('<inbox_context>'));
});

test('inbox_context block is included with PII-scrubbed caveat', () => {
  const out = renderConciergePrompt({ ...baseBlocks, inbox_context: '- invoice from vendor' }, 'Zaal', 'x');
  assert.ok(out.includes('<inbox_context>'));
  assert.ok(out.includes('PII-scrubbed summaries'));
  assert.ok(out.includes('invoice from vendor'));
});

test('persona and human content are rendered verbatim', () => {
  const out = renderConciergePrompt(
    { ...baseBlocks, persona: 'PERSONA_TEXT', human: 'HUMAN_TEXT' },
    'Zaal',
    'x',
  );
  assert.ok(out.includes('PERSONA_TEXT'));
  assert.ok(out.includes('HUMAN_TEXT'));
});
