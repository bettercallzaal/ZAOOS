// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockReadFile = vi.hoisted(() => vi.fn());
const mockWriteFile = vi.hoisted(() => vi.fn());
const mockMkdir = vi.hoisted(() => vi.fn());

vi.mock('node:fs', () => ({
  promises: {
    readFile: mockReadFile,
    writeFile: mockWriteFile,
    mkdir: mockMkdir,
  },
}));

import { getTopicThread, readTopics, STANDARD_TOPICS, writeTopics } from '../topics';

afterEach(() => vi.clearAllMocks());

// ── STANDARD_TOPICS ─────────────────────────────────────────────────────────

describe('STANDARD_TOPICS', () => {
  it('contains Research', () => {
    expect(STANDARD_TOPICS).toContain('Research');
  });

  it('contains at least 5 topics', () => {
    expect(STANDARD_TOPICS.length).toBeGreaterThanOrEqual(5);
  });
});

// ── readTopics ───────────────────────────────────────────────────────────────

describe('readTopics', () => {
  it('returns parsed map from topics.json', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ Research: 101, ZOL: 102 }));
    const result = await readTopics();
    expect(result).toEqual({ Research: 101, ZOL: 102 });
  });

  it('returns {} when the file does not exist (ENOENT)', async () => {
    mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    const result = await readTopics();
    expect(result).toEqual({});
  });

  it('returns {} when the file contains invalid JSON', async () => {
    mockReadFile.mockResolvedValue('not-json');
    const result = await readTopics();
    expect(result).toEqual({});
  });
});

// ── writeTopics ──────────────────────────────────────────────────────────────

describe('writeTopics', () => {
  it('creates the directory and writes JSON', async () => {
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);

    const map = { Research: 101 };
    await writeTopics(map);

    expect(mockMkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    const writtenContent = mockWriteFile.mock.calls[0][1];
    expect(JSON.parse(writtenContent)).toEqual(map);
  });
});

// ── getTopicThread ────────────────────────────────────────────────────────────

describe('getTopicThread', () => {
  it('returns the thread id for a known topic', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ Research: 101, ZOL: 202 }));
    expect(await getTopicThread('ZOL')).toBe(202);
  });

  it('returns undefined for an unknown topic', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ Research: 101 }));
    expect(await getTopicThread('Unknown')).toBeUndefined();
  });
});
