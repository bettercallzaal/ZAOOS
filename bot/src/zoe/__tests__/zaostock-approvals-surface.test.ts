// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockReadFile = vi.hoisted(() => vi.fn());
const mockWriteFile = vi.hoisted(() => vi.fn());
const mockMkdir = vi.hoisted(() => vi.fn());
const mockFetch = vi.hoisted(() => vi.fn());

vi.mock('node:fs', () => ({
  promises: { readFile: mockReadFile, writeFile: mockWriteFile, mkdir: mockMkdir },
}));
vi.mock('node:os', () => ({ homedir: () => '/tmp' }));

import { surfaceZaostockApprovals } from '../zaostock-approvals-surface';

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

function stubFetch(text: string, ok = true) {
  mockFetch.mockResolvedValue({
    ok,
    status: ok ? 200 : 404,
    text: vi.fn().mockResolvedValue(text),
  });
  vi.stubGlobal('fetch', mockFetch);
}

function stubFetchThrows() {
  mockFetch.mockRejectedValue(new Error('network error'));
  vi.stubGlobal('fetch', mockFetch);
}

function stubSeenLength(length: number) {
  mockReadFile.mockResolvedValue(JSON.stringify({ length }));
}

function stubNoSeen() {
  mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
}

describe('surfaceZaostockApprovals', () => {
  it('returns 0 when fetch returns non-ok (e.g., 404)', async () => {
    stubFetch('', false);
    const postFn = vi.fn();
    const count = await surfaceZaostockApprovals(postFn);
    expect(count).toBe(0);
    expect(postFn).not.toHaveBeenCalled();
  });

  it('returns 0 when fetch throws', async () => {
    stubFetchThrows();
    const postFn = vi.fn();
    const count = await surfaceZaostockApprovals(postFn);
    expect(count).toBe(0);
    expect(postFn).not.toHaveBeenCalled();
  });

  it('returns 0 when content has not grown since last check', async () => {
    const content = 'some prior content';
    stubFetch(content);
    stubSeenLength(content.length);
    const postFn = vi.fn();
    const count = await surfaceZaostockApprovals(postFn);
    expect(count).toBe(0);
    expect(postFn).not.toHaveBeenCalled();
  });

  it('posts new content and updates the seen length', async () => {
    const seen = 'old approved stuff';
    const newContent = '\n\nNew approval needed from the research loop.';
    const full = seen + newContent;
    stubFetch(full);
    stubSeenLength(seen.length);
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const postFn = vi.fn().mockResolvedValue(undefined);
    const count = await surfaceZaostockApprovals(postFn);
    expect(count).toBe(1);
    expect(postFn).toHaveBeenCalledOnce();
    expect(postFn.mock.calls[0][0]).toContain('New approval needed');
    const written = JSON.parse(mockWriteFile.mock.calls[0][1] as string);
    expect(written.length).toBe(full.length);
  });

  it('splits large content into multiple chunks with numbered labels', async () => {
    // two paragraphs each 3000 chars, exceeding the 3800-char chunk limit together
    const para = 'x'.repeat(3000);
    const newContent = `${para}\n\n${para}`;
    stubFetch(newContent);
    stubNoSeen();
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const postFn = vi.fn().mockResolvedValue(undefined);
    const count = await surfaceZaostockApprovals(postFn);
    expect(count).toBeGreaterThan(1);
    expect(postFn.mock.calls[0][0]).toContain('[1/');
  });

  it('returns 0 and does not post when new content is only whitespace', async () => {
    const seen = 'old content';
    stubFetch(seen + '   \n   ');
    stubSeenLength(seen.length);
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const postFn = vi.fn();
    const count = await surfaceZaostockApprovals(postFn);
    expect(count).toBe(0);
    expect(postFn).not.toHaveBeenCalled();
  });
});
