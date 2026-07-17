// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../memory', () => ({
  ZOE_PATHS: { home: '/tmp/zoe-test' },
}));

const mockAppendFile = vi.hoisted(() => vi.fn());
const mockReadFile = vi.hoisted(() => vi.fn());
const mockMkdir = vi.hoisted(() => vi.fn());

vi.mock('node:fs', () => ({
  promises: {
    appendFile: mockAppendFile,
    readFile: mockReadFile,
    mkdir: mockMkdir,
  },
}));

import { newRunId, readRuns, recordRun, type RunRecord } from '../runs';

afterEach(() => vi.clearAllMocks());

const MOCK_RECORD: RunRecord = {
  id: 'run-1234-abc',
  ts: '2026-07-17T10:00:00Z',
  goal: 'Write a post',
  subtaskId: 'sub-1',
  worker: 'caster',
  status: 'completed',
  score: 85,
  criticSummary: 'Good post',
  criticIssues: [],
  revised: false,
  inputTokens: 100,
  outputTokens: 50,
  costUsd: 0.002,
  durationMs: 3000,
  error: null,
};

// ── newRunId ─────────────────────────────────────────────────────────────────

describe('newRunId', () => {
  it('returns a string matching run-<digits>-<alphanum>', () => {
    const id = newRunId();
    expect(id).toMatch(/^run-\d+-[a-z0-9]+$/);
  });

  it('returns a different id each call', () => {
    // Two fast calls may have the same Date.now() but different random parts
    const ids = new Set(Array.from({ length: 5 }, () => newRunId()));
    expect(ids.size).toBeGreaterThan(1);
  });
});

// ── recordRun ────────────────────────────────────────────────────────────────

describe('recordRun', () => {
  beforeEach(() => {
    mockMkdir.mockResolvedValue(undefined);
    mockAppendFile.mockResolvedValue(undefined);
  });

  it('creates the runs directory and appends a JSONL line', async () => {
    await recordRun(MOCK_RECORD);
    expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('runs'), { recursive: true });
    expect(mockAppendFile).toHaveBeenCalledOnce();
    const [, content] = mockAppendFile.mock.calls[0];
    expect(content).toContain('"id":"run-1234-abc"');
    expect(content.trim()).toBe(JSON.stringify(MOCK_RECORD));
  });

  it('swallows errors without throwing (best-effort telemetry)', async () => {
    mockMkdir.mockRejectedValue(new Error('disk full'));
    await expect(recordRun(MOCK_RECORD)).resolves.toBeUndefined();
  });
});

// ── readRuns ──────────────────────────────────────────────────────────────────

describe('readRuns', () => {
  it('returns empty array when no run files exist', async () => {
    mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    const result = await readRuns(3);
    expect(result).toEqual([]);
  });

  it('parses JSONL records from a file', async () => {
    const line1 = JSON.stringify(MOCK_RECORD);
    const line2 = JSON.stringify({ ...MOCK_RECORD, id: 'run-2' });
    mockReadFile.mockResolvedValue(`${line1}\n${line2}\n`);
    const result = await readRuns(1);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('run-1234-abc');
    expect(result[1].id).toBe('run-2');
  });

  it('skips corrupt (non-JSON) lines without throwing', async () => {
    const good = JSON.stringify(MOCK_RECORD);
    mockReadFile.mockResolvedValue(`corrupt line\n${good}\n`);
    const result = await readRuns(1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('run-1234-abc');
  });

  it('skips empty lines without errors', async () => {
    const good = JSON.stringify(MOCK_RECORD);
    mockReadFile.mockResolvedValue(`\n\n${good}\n\n`);
    const result = await readRuns(1);
    expect(result).toHaveLength(1);
  });
});
