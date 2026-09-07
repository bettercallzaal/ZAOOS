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

  // The seen length is a high-water mark over a file that only grows, so
  // advancing it past content that never reached Telegram loses that content
  // permanently - the next tick sees "nothing new". Both ways a send can fail
  // to arrive have to hold the cursor.
  it('holds the seen cursor when a chunk send throws', async () => {
    const seen = 'old approved stuff';
    const newContent = '\n\nApproval that must not be lost.';
    stubFetch(seen + newContent);
    stubSeenLength(seen.length);
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const postFn = vi.fn().mockRejectedValue(new Error('429 Too Many Requests'));
    const count = await surfaceZaostockApprovals(postFn);
    expect(count).toBe(0);
    expect(postFn).toHaveBeenCalledOnce();
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('holds the seen cursor when the send budget blocks the chunk', async () => {
    const seen = 'old approved stuff';
    const newContent = '\n\nApproval that must not be lost.';
    stubFetch(seen + newContent);
    stubSeenLength(seen.length);
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    // What send-budget.ts returns for a dropped send: it RESOLVES, it does not
    // throw, so `await` alone reads as success.
    const postFn = vi.fn().mockResolvedValue({ message_id: 0, zoeSendBudget: 'dropped' });
    const count = await surfaceZaostockApprovals(postFn);
    expect(count).toBe(0);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('holds the seen cursor when a LATER chunk fails, so the whole batch retries', async () => {
    const para = 'x'.repeat(3000);
    stubFetch(`${para}\n\n${para}`);
    stubNoSeen();
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const postFn = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('network error'));
    const count = await surfaceZaostockApprovals(postFn);
    expect(count).toBe(1); // one chunk delivered
    expect(postFn).toHaveBeenCalledTimes(2);
    expect(mockWriteFile).not.toHaveBeenCalled();
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
