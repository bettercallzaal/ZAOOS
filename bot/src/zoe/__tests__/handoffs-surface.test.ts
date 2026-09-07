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
  vi.useRealTimers();
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
    // Freeze time so "1h ago" fallback lands before the test data timestamps.
    vi.useFakeTimers({ now: new Date('2026-07-17T07:00:00Z') });
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

  // The cursor is a `created_at` high-water mark and the query is
  // `created_at=gt.<since>`, so a row it skips is never fetched again. These
  // pin that it only ever moves over rows that actually arrived.

  it('holds the cursor and stops when a post throws', async () => {
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
    const postToTopic = vi.fn().mockRejectedValueOnce(new Error('TG error'));
    const result = await surfaceNewHandoffs(postToTopic);
    // A landed for nobody, so it is not counted and B is not attempted -
    // advancing to B's timestamp would strand A permanently.
    expect(result).toBe(0);
    expect(postToTopic).toHaveBeenCalledTimes(1);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('advances the cursor only as far as the last delivered row', async () => {
    vi.useFakeTimers({ now: new Date('2026-07-17T07:00:00Z') });
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
      .mockResolvedValueOnce(undefined)              // A lands
      .mockRejectedValueOnce(new Error('TG error')); // B does not
    const result = await surfaceNewHandoffs(postToTopic);
    expect(result).toBe(1);
    const written = mockWriteFile.mock.calls[mockWriteFile.mock.calls.length - 1][1];
    expect(JSON.parse(written).at).toBe('2026-07-17T09:00:00Z'); // A's, not B's
  });

  it('treats a send-budget block as undelivered even though it resolves', async () => {
    process.env.COWORK_TRACKER_URL = 'https://tracker.example.com';
    process.env.COWORK_TRACKER_KEY = 'test-key';
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const rows = [
      { title: 'A', legacy_source: 'handoff:a', created_at: '2026-07-17T09:00:00Z' },
    ];
    stubFetch(rows);
    // gateSend RESOLVES on a block, so nothing throws and the value is a
    // non-null object - `result != null` says delivered.
    const postToTopic = vi.fn().mockResolvedValue({ message_id: 0, zoeSendBudget: 'dropped' });
    const result = await surfaceNewHandoffs(postToTopic);
    expect(result).toBe(0);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});
