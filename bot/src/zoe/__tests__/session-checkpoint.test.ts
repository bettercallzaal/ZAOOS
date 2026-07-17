// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockReadFile = vi.hoisted(() => vi.fn());
const mockWriteFile = vi.hoisted(() => vi.fn());
const mockMkdir = vi.hoisted(() => vi.fn());

vi.mock('node:fs', () => ({
  promises: { readFile: mockReadFile, writeFile: mockWriteFile, mkdir: mockMkdir },
}));

import { clearCheckpoint, getCheckpoint, offerCheckpoint, saveCheckpoint } from '../session-checkpoint';

afterEach(() => vi.clearAllMocks());

const THREAD = 'chat-12345';
const OTHER = 'chat-99999';

// ── getCheckpoint / saveCheckpoint ────────────────────────────────────────────

describe('getCheckpoint', () => {
  it('returns null when file does not exist (ENOENT)', async () => {
    mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    expect(await getCheckpoint(THREAD)).toBeNull();
  });

  it('returns null when no checkpoint exists for the thread', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ [OTHER]: { checkpoint: 'other thread', savedAt: '2026-01-01T00:00:00Z' } }));
    expect(await getCheckpoint(THREAD)).toBeNull();
  });

  it('returns the checkpoint entry for a known thread', async () => {
    const entry = { checkpoint: 'Working on PR #42', savedAt: '2026-07-17T10:00:00Z' };
    mockReadFile.mockResolvedValue(JSON.stringify({ [THREAD]: entry }));
    const result = await getCheckpoint(THREAD);
    expect(result).toEqual(entry);
  });
});

describe('saveCheckpoint', () => {
  it('writes the checkpoint to the file', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({}));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    await saveCheckpoint(THREAD, 'Working on PR #42');
    expect(mockWriteFile).toHaveBeenCalledOnce();
    const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
    expect(written[THREAD].checkpoint).toBe('Working on PR #42');
  });

  it('trims the checkpoint text before saving', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({}));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    await saveCheckpoint(THREAD, '  padded  ');
    const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
    expect(written[THREAD].checkpoint).toBe('padded');
  });

  it('preserves existing checkpoints for other threads', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ [OTHER]: { checkpoint: 'other', savedAt: '2026-01-01T00:00:00Z' } }));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    await saveCheckpoint(THREAD, 'new checkpoint');
    const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
    expect(written[OTHER]).toBeDefined();
    expect(written[THREAD].checkpoint).toBe('new checkpoint');
  });
});

// ── clearCheckpoint ───────────────────────────────────────────────────────────

describe('clearCheckpoint', () => {
  it('removes the thread from the checkpoints file', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ [THREAD]: { checkpoint: 'old', savedAt: '2026-01-01T00:00:00Z' } }));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    await clearCheckpoint(THREAD);
    const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
    expect(written[THREAD]).toBeUndefined();
  });
});

// ── offerCheckpoint ───────────────────────────────────────────────────────────

describe('offerCheckpoint', () => {
  it('returns null when no checkpoint exists', async () => {
    mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    expect(await offerCheckpoint(THREAD)).toBeNull();
  });

  it('returns a message containing the checkpoint text', async () => {
    const entry = { checkpoint: 'Working on PR #42', savedAt: new Date().toISOString() };
    mockReadFile.mockResolvedValue(JSON.stringify({ [THREAD]: entry }));
    const msg = await offerCheckpoint(THREAD);
    expect(msg).toContain('Working on PR #42');
    expect(msg).toContain('just now'); // saved right now → hoursAgo = 0
  });

  it('shows hours ago for an older checkpoint', async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const entry = { checkpoint: 'Old task', savedAt: twoHoursAgo };
    mockReadFile.mockResolvedValue(JSON.stringify({ [THREAD]: entry }));
    const msg = await offerCheckpoint(THREAD);
    expect(msg).toContain('2 hours ago');
  });

  it('uses "1 hour ago" for exactly 1 hour', async () => {
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
    mockReadFile.mockResolvedValue(JSON.stringify({ [THREAD]: { checkpoint: 'task', savedAt: oneHourAgo } }));
    const msg = await offerCheckpoint(THREAD);
    expect(msg).toContain('1 hour ago');
  });
});
