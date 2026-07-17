// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockReadFile = vi.hoisted(() => vi.fn());
const mockWriteFile = vi.hoisted(() => vi.fn());
const mockMkdir = vi.hoisted(() => vi.fn());
const mockUnlink = vi.hoisted(() => vi.fn());

vi.mock('../../memory', () => ({ ZOE_PATHS: { home: '/tmp/zoe-pending-test' } }));
vi.mock('node:fs', () => ({
  promises: {
    readFile: mockReadFile,
    writeFile: mockWriteFile,
    mkdir: mockMkdir,
    unlink: mockUnlink,
  },
}));

import {
  clearPending,
  isExpired,
  loadPending,
  MAX_RESENDS,
  newPendingId,
  PENDING_TTL_MS,
  savePending,
  shouldResend,
  type PendingDraft,
} from '../pending';

afterEach(() => vi.clearAllMocks());

// Fixed anchor in the past so tests don't depend on wall-clock time.
const CREATED_AT = '2026-07-17T10:00:00.000Z';
const CREATED_MS = new Date(CREATED_AT).getTime();

function makeDraft(overrides: Partial<PendingDraft> = {}): PendingDraft {
  return {
    id: '2026-07-17T10-00-00-000Z-build',
    category: 'build',
    text: 'ZAO music drop tonight',
    createdAt: CREATED_AT,
    lastSentAt: CREATED_AT,
    messageId: 42,
    resendCount: 0,
    state: 'pending',
    ...overrides,
  };
}

// ── isExpired ─────────────────────────────────────────────────────────────────

describe('isExpired', () => {
  it('returns false well before the TTL', () => {
    expect(isExpired(makeDraft(), CREATED_MS + 60_000)).toBe(false);
  });

  it('returns false at exactly the TTL boundary (strict >)', () => {
    expect(isExpired(makeDraft(), CREATED_MS + PENDING_TTL_MS)).toBe(false);
  });

  it('returns true 1 ms past the TTL', () => {
    expect(isExpired(makeDraft(), CREATED_MS + PENDING_TTL_MS + 1)).toBe(true);
  });

  it('returns true well past the TTL', () => {
    expect(isExpired(makeDraft(), CREATED_MS + 2 * PENDING_TTL_MS)).toBe(true);
  });
});

// ── shouldResend ──────────────────────────────────────────────────────────────

describe('shouldResend', () => {
  it('always returns false for pending drafts because MAX_RESENDS=0', () => {
    expect(MAX_RESENDS).toBe(0);
    // resendCount 0 >= MAX_RESENDS 0 → short-circuit to false
    expect(shouldResend(makeDraft(), CREATED_MS + 2 * 60 * 60_000)).toBe(false);
  });

  it('returns false when state is approved', () => {
    expect(shouldResend(makeDraft({ state: 'approved' }), CREATED_MS + 9_999_999)).toBe(false);
  });

  it('returns false when state is skipped', () => {
    expect(shouldResend(makeDraft({ state: 'skipped' }), CREATED_MS + 9_999_999)).toBe(false);
  });

  it('returns false when state is expired', () => {
    expect(shouldResend(makeDraft({ state: 'expired' }), CREATED_MS + 9_999_999)).toBe(false);
  });
});

// ── newPendingId ──────────────────────────────────────────────────────────────

describe('newPendingId', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-17T10:00:00.000Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('contains the category suffix', () => {
    expect(newPendingId('build')).toContain('-build');
    expect(newPendingId('ecosystem')).toContain('-ecosystem');
    expect(newPendingId('event')).toContain('-event');
    expect(newPendingId('personal')).toContain('-personal');
  });

  it('contains the ISO date portion (colons/dots replaced with dashes)', () => {
    const id = newPendingId('build');
    expect(id).toContain('2026-07-17');
    // Original ISO: "2026-07-17T10:00:00.000Z" → colons replaced → "2026-07-17T10-00-00-000Z"
    expect(id).toMatch(/2026-07-17T\d{2}-\d{2}-\d{2}/);
  });
});

// ── loadPending ───────────────────────────────────────────────────────────────

describe('loadPending', () => {
  it('returns parsed draft when file exists and is valid JSON', async () => {
    const draft = makeDraft();
    mockReadFile.mockResolvedValue(JSON.stringify(draft));
    const result = await loadPending();
    expect(result).toEqual(draft);
  });

  it('returns null when the file does not exist (ENOENT)', async () => {
    mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    expect(await loadPending()).toBeNull();
  });

  it('returns null when the file contains invalid JSON', async () => {
    mockReadFile.mockResolvedValue('not-valid-json{{');
    expect(await loadPending()).toBeNull();
  });
});

// ── savePending ───────────────────────────────────────────────────────────────

describe('savePending', () => {
  it('creates the posts dir and writes pretty-printed JSON', async () => {
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const draft = makeDraft();
    await savePending(draft);
    expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('posts'), { recursive: true });
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('pending.json'),
      JSON.stringify(draft, null, 2),
      'utf8',
    );
  });
});

// ── clearPending ──────────────────────────────────────────────────────────────

describe('clearPending', () => {
  it('calls unlink on the pending file path', async () => {
    mockUnlink.mockResolvedValue(undefined);
    await clearPending();
    expect(mockUnlink).toHaveBeenCalledWith(expect.stringContaining('pending.json'));
  });

  it('does not throw when the file is already absent', async () => {
    mockUnlink.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    await expect(clearPending()).resolves.toBeUndefined();
  });
});
