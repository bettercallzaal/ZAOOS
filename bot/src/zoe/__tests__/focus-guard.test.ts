// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockReadFile = vi.hoisted(() => vi.fn());
const mockWriteFile = vi.hoisted(() => vi.fn());
const mockMkdir = vi.hoisted(() => vi.fn());

vi.mock('node:fs', () => ({
  promises: { readFile: mockReadFile, writeFile: mockWriteFile, mkdir: mockMkdir },
}));

import {
  buildFocusDigest,
  decideQueueOrSend,
  endFocus,
  isFocusMode,
  queuePing,
  readFocusState,
  startFocus,
} from '../focus-guard';

afterEach(() => vi.clearAllMocks());

// ── buildFocusDigest (pure) ───────────────────────────────────────────────────

describe('buildFocusDigest', () => {
  it('returns a "no queued updates" message when the queue is empty', () => {
    expect(buildFocusDigest([])).toBe('No queued updates from your focus window.');
  });

  it('uses singular form for exactly one queued ping', () => {
    const result = buildFocusDigest(['PR #42 merged']);
    expect(result).toContain('1 update');
    expect(result).toContain('PR #42 merged');
  });

  it('lists all pings with count for multiple entries', () => {
    const result = buildFocusDigest(['Ping A', 'Ping B', 'Ping C']);
    expect(result).toContain('3 updates');
    expect(result).toContain('Ping A');
    expect(result).toContain('Ping C');
  });
});

// ── readFocusState ────────────────────────────────────────────────────────────

describe('readFocusState', () => {
  it('returns default state when file does not exist (ENOENT)', async () => {
    mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    const state = await readFocusState();
    expect(state.focusMode).toBe(false);
    expect(state.queuedPings).toEqual([]);
    expect(state.startedAt).toBeNull();
  });

  it('returns default state when file contains invalid JSON', async () => {
    mockReadFile.mockResolvedValue('not-json');
    const state = await readFocusState();
    expect(state.focusMode).toBe(false);
  });

  it('parses a valid focus state from the file', async () => {
    const stored = { focusMode: true, queuedPings: ['ping1', 'ping2'], startedAt: '2026-07-17T10:00:00Z' };
    mockReadFile.mockResolvedValue(JSON.stringify(stored));
    const state = await readFocusState();
    expect(state.focusMode).toBe(true);
    expect(state.queuedPings).toEqual(['ping1', 'ping2']);
    expect(state.startedAt).toBe('2026-07-17T10:00:00Z');
  });

  it('coerces queuedPings to [] when stored value is not an array', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ focusMode: false, queuedPings: 'bad', startedAt: null }));
    const state = await readFocusState();
    expect(state.queuedPings).toEqual([]);
  });
});

// ── startFocus ────────────────────────────────────────────────────────────────

describe('startFocus', () => {
  it('sets focusMode=true, clears queuedPings, and records startedAt', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ focusMode: false, queuedPings: ['old ping'], startedAt: null }));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    await startFocus();
    const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
    expect(written.focusMode).toBe(true);
    expect(written.queuedPings).toEqual([]);
    expect(written.startedAt).not.toBeNull();
  });
});

// ── endFocus ──────────────────────────────────────────────────────────────────

describe('endFocus', () => {
  it('returns queued pings and resets state', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ focusMode: true, queuedPings: ['A', 'B'], startedAt: '2026-07-17T10:00:00Z' }));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const queued = await endFocus();
    expect(queued).toEqual(['A', 'B']);
    const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
    expect(written.focusMode).toBe(false);
    expect(written.queuedPings).toEqual([]);
    expect(written.startedAt).toBeNull();
  });

  it('returns empty array when not in focus mode', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ focusMode: false, queuedPings: [], startedAt: null }));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    expect(await endFocus()).toEqual([]);
  });
});

// ── isFocusMode ───────────────────────────────────────────────────────────────

describe('isFocusMode', () => {
  it('returns true when focusMode is active', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ focusMode: true, queuedPings: [], startedAt: '2026-01-01T00:00:00Z' }));
    expect(await isFocusMode()).toBe(true);
  });

  it('returns false when focusMode is inactive', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    expect(await isFocusMode()).toBe(false);
  });
});

// ── queuePing ──────────────────────────────────────────────────────────────────

describe('queuePing', () => {
  it('appends the ping when in focus mode', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ focusMode: true, queuedPings: ['existing'], startedAt: '2026-01-01T00:00:00Z' }));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    await queuePing('new ping');
    const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
    expect(written.queuedPings).toEqual(['existing', 'new ping']);
  });

  it('does nothing when not in focus mode', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ focusMode: false, queuedPings: [], startedAt: null }));
    await queuePing('should be ignored');
    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});

// ── decideQueueOrSend ─────────────────────────────────────────────────────────

describe('decideQueueOrSend', () => {
  it('returns "send" for urgent items regardless of focus mode', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ focusMode: true, queuedPings: [], startedAt: '2026-01-01' }));
    expect(await decideQueueOrSend(true)).toBe('send');
  });

  it('returns "queue" for non-urgent items when in focus mode', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ focusMode: true, queuedPings: [], startedAt: '2026-01-01' }));
    expect(await decideQueueOrSend(false)).toBe('queue');
  });

  it('returns "send" for non-urgent items when not in focus mode', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    expect(await decideQueueOrSend()).toBe('send');
  });
});
