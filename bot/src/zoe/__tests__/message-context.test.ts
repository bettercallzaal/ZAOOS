// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockStat = vi.hoisted(() => vi.fn());
const mockReadFile = vi.hoisted(() => vi.fn());
const mockWriteFile = vi.hoisted(() => vi.fn());
const mockMkdir = vi.hoisted(() => vi.fn());

vi.mock('node:fs', () => ({
  promises: { stat: mockStat, readFile: mockReadFile, writeFile: mockWriteFile, mkdir: mockMkdir },
}));

import {
  cleanupStaleContexts,
  clearMessageContext,
  getMessageContext,
  recordMessageContext,
} from '../message-context';

afterEach(() => vi.clearAllMocks());

// ensureContextStore: stat ZOE_HOME then stat CONTEXT_PATH → both exist
function stubBothExist() {
  mockStat.mockResolvedValue({ isDirectory: () => true }); // for both stat calls
}

function stubFileExists(data: Record<string, unknown>) {
  mockStat.mockResolvedValue({}); // both stat calls succeed
  mockReadFile.mockResolvedValue(JSON.stringify(data));
}

// ── recordMessageContext ───────────────────────────────────────────────────────

describe('recordMessageContext', () => {
  it('writes the context entry to the store keyed by messageId string', async () => {
    stubFileExists({});
    mockWriteFile.mockResolvedValue(undefined);
    await recordMessageContext(101, { qid: 'q-1', questionText: 'What is ZAO?' });
    const written = JSON.parse(mockWriteFile.mock.calls[mockWriteFile.mock.calls.length - 1][1]);
    expect(written['101']).toBeDefined();
    expect(written['101'].qid).toBe('q-1');
    expect(written['101'].questionText).toBe('What is ZAO?');
  });

  it('preserves existing entries for other message IDs', async () => {
    stubFileExists({ '200': { qid: 'q-old', ts: '2026-01-01T00:00:00Z' } });
    mockWriteFile.mockResolvedValue(undefined);
    await recordMessageContext(201, { taskId: 'task-1' });
    const written = JSON.parse(mockWriteFile.mock.calls[mockWriteFile.mock.calls.length - 1][1]);
    expect(written['200']).toBeDefined();
    expect(written['201'].taskId).toBe('task-1');
  });
});

// ── getMessageContext ──────────────────────────────────────────────────────────

describe('getMessageContext', () => {
  it('returns the context for a known messageId', async () => {
    stubFileExists({ '42': { qid: 'q-42', ts: '2026-07-17T10:00:00Z' } });
    const ctx = await getMessageContext(42);
    expect(ctx?.qid).toBe('q-42');
  });

  it('returns undefined for an unknown messageId', async () => {
    stubFileExists({ '99': { qid: 'q-99', ts: '2026-07-17T10:00:00Z' } });
    expect(await getMessageContext(404)).toBeUndefined();
  });

  it('returns {} (empty object result → undefined) when file does not exist', async () => {
    // stat throws for the file → writeFile creates it, then readFile returns '{}'
    mockStat
      .mockResolvedValueOnce({}) // ZOE_HOME stat ok
      .mockRejectedValueOnce(new Error('ENOENT')); // file stat fails
    mockWriteFile.mockResolvedValue(undefined); // create empty file
    mockReadFile.mockResolvedValue('{}');
    expect(await getMessageContext(1)).toBeUndefined();
  });
});

// ── clearMessageContext ────────────────────────────────────────────────────────

describe('clearMessageContext', () => {
  it('removes the entry and writes the updated map', async () => {
    stubFileExists({ '50': { qid: 'q-50', ts: '2026-07-17T10:00:00Z' }, '51': { qid: 'q-51', ts: '2026-07-17T10:00:00Z' } });
    mockWriteFile.mockResolvedValue(undefined);
    await clearMessageContext(50);
    const written = JSON.parse(mockWriteFile.mock.calls[mockWriteFile.mock.calls.length - 1][1]);
    expect(written['50']).toBeUndefined();
    expect(written['51']).toBeDefined();
  });
});

// ── cleanupStaleContexts ──────────────────────────────────────────────────────

describe('cleanupStaleContexts', () => {
  it('removes entries older than maxAgeMs and returns count', async () => {
    const staleTs = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(); // 25h ago
    const freshTs = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();  // 1h ago
    stubFileExists({ '1': { qid: 'stale', ts: staleTs }, '2': { qid: 'fresh', ts: freshTs } });
    mockWriteFile.mockResolvedValue(undefined);
    const removed = await cleanupStaleContexts(24 * 60 * 60 * 1000);
    expect(removed).toBe(1);
    const written = JSON.parse(mockWriteFile.mock.calls[mockWriteFile.mock.calls.length - 1][1]);
    expect(written['1']).toBeUndefined();
    expect(written['2']).toBeDefined();
  });

  it('returns 0 and does not write when no entries are stale', async () => {
    const freshTs = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
    stubFileExists({ '1': { qid: 'fresh', ts: freshTs } });
    mockWriteFile.mockResolvedValue(undefined);
    const removed = await cleanupStaleContexts(24 * 60 * 60 * 1000);
    expect(removed).toBe(0);
    // writeFile called only for ensureContextStore (not for the map update)
    const lastCall = mockWriteFile.mock.calls.filter(c => !c[0].endsWith('.json') || JSON.parse(c[1] as string)['1']);
    expect(lastCall.length).toBe(0); // no map rewrite when nothing removed
  });

  it('keeps entries with invalid timestamps (NaN age comparison is false, not an exception)', async () => {
    // new Date('not-a-date').getTime() → NaN; NaN > maxAgeMs → false; entry NOT removed
    stubFileExists({ '1': { qid: 'bad', ts: 'not-a-date' } });
    mockWriteFile.mockResolvedValue(undefined);
    const removed = await cleanupStaleContexts(1000);
    expect(removed).toBe(0);
  });
});
