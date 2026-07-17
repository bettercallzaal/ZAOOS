// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockReadFile = vi.hoisted(() => vi.fn());
const mockWriteFile = vi.hoisted(() => vi.fn());
const mockMkdir = vi.hoisted(() => vi.fn());

vi.mock('node:fs', () => ({
  promises: { readFile: mockReadFile, writeFile: mockWriteFile, mkdir: mockMkdir },
}));

const mockFetch = vi.fn();

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  delete process.env.COWORK_TRACKER_URL;
  delete process.env.COWORK_TRACKER_KEY;
});

import { surfaceNewHandoffs } from '../handoffs-surface';

function stubFetch(rows: unknown[], ok = true) {
  const res = {
    ok,
    status: ok ? 200 : 500,
    json: vi.fn().mockResolvedValue(rows),
  };
  mockFetch.mockResolvedValue(res);
  vi.stubGlobal('fetch', mockFetch);
}

// ── surfaceNewHandoffs ────────────────────────────────────────────────────────

describe('surfaceNewHandoffs', () => {
  it('returns 0 when COWORK_TRACKER_URL is not set', async () => {
    const postToTopic = vi.fn();
    const result = await surfaceNewHandoffs(postToTopic);
    expect(result).toBe(0);
    expect(postToTopic).not.toHaveBeenCalled();
  });

  it('returns 0 when COWORK_TRACKER_KEY is not set', async () => {
    process.env.COWORK_TRACKER_URL = 'https://tracker.example.com';
    const postToTopic = vi.fn();
    const result = await surfaceNewHandoffs(postToTopic);
    expect(result).toBe(0);
    expect(postToTopic).not.toHaveBeenCalled();
  });

  it('returns 0 when fetch returns empty array', async () => {
    process.env.COWORK_TRACKER_URL = 'https://tracker.example.com';
    process.env.COWORK_TRACKER_KEY = 'test-key';
    // last-seen: ENOENT → default to 1h ago
    mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    stubFetch([]);
    const postToTopic = vi.fn();
    const result = await surfaceNewHandoffs(postToTopic);
    expect(result).toBe(0);
    expect(postToTopic).not.toHaveBeenCalled();
  });

  it('returns 0 when fetch returns non-ok status', async () => {
    process.env.COWORK_TRACKER_URL = 'https://tracker.example.com';
    process.env.COWORK_TRACKER_KEY = 'test-key';
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    stubFetch([], false); // ok=false
    const postToTopic = vi.fn();
    const result = await surfaceNewHandoffs(postToTopic);
    expect(result).toBe(0);
  });

  it('posts each new handoff and returns count', async () => {
    process.env.COWORK_TRACKER_URL = 'https://tracker.example.com';
    process.env.COWORK_TRACKER_KEY = 'test-key';
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const rows = [
      { title: 'Handoff A', legacy_source: 'handoff:a', created_at: '2026-07-17T10:00:00Z' },
      { title: 'Handoff B', legacy_source: 'handoff:b', created_at: '2026-07-17T11:00:00Z' },
    ];
    stubFetch(rows);
    const postToTopic = vi.fn().mockResolvedValue(undefined);
    const result = await surfaceNewHandoffs(postToTopic);
    expect(result).toBe(2);
    expect(postToTopic).toHaveBeenCalledTimes(2);
    expect(postToTopic.mock.calls[0][0]).toContain('Handoff A');
    expect(postToTopic.mock.calls[1][0]).toContain('Handoff B');
  });

  it('updates the last-seen timestamp to the max created_at after surfacing', async () => {
    process.env.COWORK_TRACKER_URL = 'https://tracker.example.com';
    process.env.COWORK_TRACKER_KEY = 'test-key';
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const rows = [
      { title: 'A', legacy_source: 'handoff:a', created_at: '2026-07-17T09:00:00Z' },
      { title: 'B', legacy_source: 'handoff:b', created_at: '2026-07-17T12:00:00Z' },
    ];
    stubFetch(rows);
    await surfaceNewHandoffs(vi.fn().mockResolvedValue(undefined));
    // setLastSeen should write the latest timestamp
    const written = mockWriteFile.mock.calls[mockWriteFile.mock.calls.length - 1][1];
    expect(JSON.parse(written).at).toBe('2026-07-17T12:00:00Z');
  });

  it('uses the last-seen timestamp from the file for filtering', async () => {
    process.env.COWORK_TRACKER_URL = 'https://tracker.example.com';
    process.env.COWORK_TRACKER_KEY = 'test-key';
    const since = '2026-07-17T08:00:00Z';
    mockReadFile.mockResolvedValue(JSON.stringify({ at: since }));
    stubFetch([]);
    await surfaceNewHandoffs(vi.fn());
    // The fetch URL should include the since timestamp
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain(encodeURIComponent(since));
  });

  it('swallows postToTopic errors without stopping other posts', async () => {
    process.env.COWORK_TRACKER_URL = 'https://tracker.example.com';
    process.env.COWORK_TRACKER_KEY = 'test-key';
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const rows = [
      { title: 'A', legacy_source: 'handoff:a', created_at: '2026-07-17T09:00:00Z' },
      { title: 'B', legacy_source: 'handoff:b', created_at: '2026-07-17T10:00:00Z' },
    ];
    stubFetch(rows);
    const postToTopic = vi.fn()
      .mockRejectedValueOnce(new Error('TG error')) // first fails
      .mockResolvedValueOnce(undefined);             // second ok
    const result = await surfaceNewHandoffs(postToTopic);
    expect(result).toBe(2); // still returns 2 (rows processed)
    expect(postToTopic).toHaveBeenCalledTimes(2);
  });
});
