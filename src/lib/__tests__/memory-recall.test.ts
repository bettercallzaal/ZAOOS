// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockRecall = vi.hoisted(() => vi.fn());
const mockReflect = vi.hoisted(() => vi.fn());

vi.mock('@/lib/hindsight', () => ({
  getHindsightClient: vi.fn(async () => ({
    retain: vi.fn(),
    recall: mockRecall,
    reflect: mockReflect,
  })),
}));

import {
  buildPromptWithMemory,
  getUserMemoryContext,
  recallMemories,
  recallMemoriesByType,
  runWeeklyReflection,
  TASTE_REFLECT_PROMPT,
} from '../memory-recall';

describe('recallMemories', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns memories from Hindsight on success', async () => {
    mockRecall.mockResolvedValue([
      { content: 'User shared a Spotify track', score: 0.9 },
      { content: 'User sent 10 Respect to artist', score: 0.8 },
    ]);
    const results = await recallMemories('42', 'music activity', 5);
    expect(results).toHaveLength(2);
    expect(results[0].content).toBe('User shared a Spotify track');
  });

  it('returns empty array when Hindsight client is unavailable', async () => {
    const { getHindsightClient } = await import('@/lib/hindsight');
    vi.mocked(getHindsightClient).mockResolvedValueOnce(null);
    const results = await recallMemories('42', 'any query', 5);
    expect(results).toEqual([]);
  });

  it('returns empty array on Hindsight error (graceful degradation)', async () => {
    mockRecall.mockRejectedValue(new Error('Hindsight timeout'));
    const results = await recallMemories('42', 'query', 5);
    expect(results).toEqual([]);
  });
});

describe('buildPromptWithMemory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns plain prompt when no memories are recalled', async () => {
    mockRecall.mockResolvedValue([]);
    const result = await buildPromptWithMemory('42', 'Hello!', 'You are a helpful agent.', 5);
    expect(result).toBe('You are a helpful agent.\n\nHello!');
  });

  it('injects SYSTEM_REMINISCENCE block when memories exist', async () => {
    mockRecall.mockResolvedValue([
      { content: 'Memory 1', score: 0.9 },
      { content: 'Memory 2', score: 0.7 },
    ]);
    const result = await buildPromptWithMemory('42', 'What music do I like?', 'System prompt.', 5);
    expect(result).toContain('SYSTEM_REMINISCENCE');
    expect(result).toContain('Memory 1');
    expect(result).toContain('Memory 2');
    expect(result).toContain('END_REMINISCENCE');
    expect(result).toContain('System prompt.');
    expect(result).toContain('What music do I like?');
  });

  it('includes memory count in the SYSTEM_REMINISCENCE header', async () => {
    mockRecall.mockResolvedValue([
      { content: 'Memory A', score: 1.0 },
      { content: 'Memory B', score: 0.5 },
    ]);
    const result = await buildPromptWithMemory('42', 'msg', 'sys', 5);
    expect(result).toContain('2 memories recalled');
  });

  it('system prompt appears after END_REMINISCENCE', async () => {
    mockRecall.mockResolvedValue([{ content: 'A memory', score: 1.0 }]);
    const result = await buildPromptWithMemory('42', 'user msg', 'my system', 5);
    const reminiscenceEnd = result.indexOf('END_REMINISCENCE');
    const sysPromptStart = result.indexOf('my system');
    expect(sysPromptStart).toBeGreaterThan(reminiscenceEnd);
  });
});

describe('getUserMemoryContext', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty string when no memories exist', async () => {
    mockRecall.mockResolvedValue([]);
    const result = await getUserMemoryContext('42', 'music');
    expect(result).toBe('');
  });

  it('returns formatted reminiscence block when memories exist', async () => {
    mockRecall.mockResolvedValue([{ content: 'Track share memory', score: 0.8 }]);
    const result = await getUserMemoryContext('42', 'tracks');
    expect(result).toContain('SYSTEM_REMINISCENCE');
    expect(result).toContain('Track share memory');
    expect(result).toContain('END_REMINISCENCE');
  });

  it('uses a default query when none is provided', async () => {
    mockRecall.mockResolvedValue([]);
    await getUserMemoryContext('42');
    expect(mockRecall).toHaveBeenCalledWith(
      '42',
      'recent activity preferences interactions',
      expect.any(Number),
    );
  });
});

describe('recallMemoriesByType', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes metadataFilter to Hindsight recall', async () => {
    mockRecall.mockResolvedValue([{ content: 'cast memory', score: 0.9 }]);
    await recallMemoriesByType('42', 'cast', 'recent casts', 3);
    expect(mockRecall).toHaveBeenCalledWith(
      '42',
      'recent casts',
      expect.objectContaining({ metadataFilter: { eventType: 'cast' } }),
    );
  });

  it('falls back to regular recall when metadataFilter is not supported', async () => {
    mockRecall
      .mockRejectedValueOnce(new Error('metadataFilter not supported'))
      .mockResolvedValueOnce([{ content: 'fallback memory', score: 0.5 }]);
    const results = await recallMemoriesByType('42', 'cast', 'casts', 3);
    expect(mockRecall).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(1);
  });
});

describe('runWeeklyReflection', () => {
  afterEach(() => vi.clearAllMocks());

  it('calls Hindsight reflect with the TASTE_REFLECT_PROMPT', async () => {
    mockReflect.mockResolvedValue('User enjoys ambient music...');
    const result = await runWeeklyReflection('42');
    expect(mockReflect).toHaveBeenCalledWith('42', TASTE_REFLECT_PROMPT);
    expect(result).toBe('User enjoys ambient music...');
  });
});

describe('TASTE_REFLECT_PROMPT', () => {
  it('includes the 5 expected sections', () => {
    expect(TASTE_REFLECT_PROMPT).toContain('Music Preferences');
    expect(TASTE_REFLECT_PROMPT).toContain('Community Behavior');
    expect(TASTE_REFLECT_PROMPT).toContain('Tone & Voice');
    expect(TASTE_REFLECT_PROMPT).toContain('Notable Patterns');
    expect(TASTE_REFLECT_PROMPT).toContain('Recommended Actions');
  });
});
