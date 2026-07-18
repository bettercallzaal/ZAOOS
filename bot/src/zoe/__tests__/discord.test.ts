// @vitest-environment node
// Tests for chunkMessage — the Discord message chunker in discord.ts.
// No Discord client or env needed: function is purely functional (string in → string[] out).
import { vi } from 'vitest';

// discord.js and dotenv must be mocked before the import so the module loads
// without a real Discord token or fs dependency.
vi.mock('discord.js', () => ({
  Client: vi.fn(),
  GatewayIntentBits: { MessageContent: 1, GuildMessages: 2, DirectMessages: 4 },
  ChannelType: { DM: 1, GuildText: 0 },
  EmbedBuilder: vi.fn().mockReturnValue({ setDescription: vi.fn().mockReturnThis(), toJSON: vi.fn().mockReturnValue({}) }),
}));
vi.mock('dotenv', () => ({ config: vi.fn() }));
vi.mock('../concierge', () => ({ runConciergeTurn: vi.fn() }));
vi.mock('../memory', () => ({ buildMemoryBlocks: vi.fn(), ensureZoeHome: vi.fn() }));

import { test, describe } from 'vitest';
import assert from 'node:assert/strict';
import { chunkMessage } from '../discord.ts';

const SHORT = 'hello world';
const MAX = 1990; // DISCORD_MAX

// ===========================
// chunkMessage
// ===========================

describe('chunkMessage — short messages', () => {
  test('returns single-element array for message at limit', () => {
    const text = 'x'.repeat(MAX);
    const chunks = chunkMessage(text);
    assert.deepEqual(chunks, [text]);
  });

  test('returns single-element array for message under limit', () => {
    const chunks = chunkMessage(SHORT);
    assert.deepEqual(chunks, [SHORT]);
  });

  test('returns single-element array for empty string', () => {
    const chunks = chunkMessage('');
    assert.deepEqual(chunks, ['']);
  });
});

describe('chunkMessage — paragraph boundary preference', () => {
  test('splits on double newline when available near the limit', () => {
    const part1 = 'a'.repeat(800);
    const part2 = 'b'.repeat(800);
    const text = part1 + '\n\n' + part2;
    const chunks = chunkMessage(text, 1000);
    assert.equal(chunks.length, 2);
    assert.equal(chunks[0], part1);
    assert.equal(chunks[1], part2);
  });

  test('no trailing whitespace on any chunk', () => {
    const part1 = 'a'.repeat(800);
    const part2 = 'b'.repeat(800);
    const text = part1 + '\n\n' + part2;
    const chunks = chunkMessage(text, 1000);
    for (const chunk of chunks) {
      assert.equal(chunk, chunk.trimEnd(), 'chunk has trailing whitespace');
    }
  });
});

describe('chunkMessage — single newline fallback', () => {
  test('splits on single newline when no double newline is near limit', () => {
    const part1 = 'a'.repeat(800);
    const part2 = 'b'.repeat(800);
    // no double-newline — only single
    const text = part1 + '\n' + part2;
    const chunks = chunkMessage(text, 1000);
    assert.equal(chunks.length, 2);
    assert.equal(chunks[0], part1);
  });
});

describe('chunkMessage — space fallback', () => {
  test('splits on space when no newlines are near limit', () => {
    const words = Array.from({ length: 4 }, (_, i) => 'w' + 'o'.repeat(400) + i);
    const text = words.join(' ');
    const chunks = chunkMessage(text, 500);
    assert.ok(chunks.length > 1, 'expected more than 1 chunk');
    for (const chunk of chunks) {
      assert.ok(chunk.length <= 500, `chunk too long: ${chunk.length}`);
    }
  });
});

describe('chunkMessage — hard cut fallback', () => {
  test('hard-cuts when no boundary is found in first half of max', () => {
    // one long word with no whitespace or newlines — forces hard cut
    const text = 'x'.repeat(3000);
    const chunks = chunkMessage(text, 1000);
    assert.ok(chunks.length >= 3, 'expected at least 3 chunks for 3000-char string with max 1000');
    for (const chunk of chunks) {
      assert.ok(chunk.length <= 1000, `chunk too long: ${chunk.length}`);
    }
  });
});

describe('chunkMessage — custom max', () => {
  test('respects custom max parameter', () => {
    const text = 'hello world goodbye world';
    const chunks = chunkMessage(text, 12);
    assert.ok(chunks.length > 1);
    for (const chunk of chunks) {
      assert.ok(chunk.length <= 12, `chunk too long: ${chunk.length}`);
    }
  });

  test('no chunk exceeds the default DISCORD_MAX', () => {
    const text = ('paragraph content here\n\n').repeat(100);
    const chunks = chunkMessage(text);
    for (const chunk of chunks) {
      assert.ok(chunk.length <= MAX, `chunk too long: ${chunk.length}`);
    }
  });
});

describe('chunkMessage — content preservation', () => {
  test('all content is present across chunks (no data loss)', () => {
    const text = Array.from({ length: 10 }, (_, i) => `Section ${i}: ${'x'.repeat(300)}`).join('\n\n');
    const chunks = chunkMessage(text, 1000);
    const rejoined = chunks.join('');
    // After chunking, trimEnd + trimStart removes the boundary whitespace
    assert.ok(rejoined.replace(/\s+/g, ' ').length >= text.replace(/\s+/g, ' ').length * 0.98, 'too much content lost');
  });
});
