// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockDb = vi.hoisted(() => vi.fn());
vi.mock('../../supabase', () => ({ db: mockDb }));

import {
  countRunsByTelegramIdToday,
  createRun,
  getRun,
  listOpenRuns,
  updateRun,
} from '../db';

afterEach(() => vi.clearAllMocks());

const MOCK_RUN = {
  id: 'run-uuid-1',
  triggered_by_telegram_id: 42,
  triggered_in_chat_id: -100,
  issue_text: 'Fix the broken widget',
  status: 'pending',
  created_at: '2026-07-17T10:00:00Z',
};

// ── createRun ────────────────────────────────────────────────────────────────

describe('createRun', () => {
  it('inserts and returns the new run', async () => {
    const single = vi.fn().mockResolvedValue({ data: MOCK_RUN, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });
    mockDb.mockReturnValue({ from });

    const result = await createRun({
      triggered_by_telegram_id: 42,
      triggered_in_chat_id: -100,
      issue_text: 'Fix the broken widget',
    });
    expect(result).toEqual(MOCK_RUN);
    expect(from).toHaveBeenCalledWith('hermes_runs');
  });

  it('throws when Supabase returns an error', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    mockDb.mockReturnValue({ from: vi.fn().mockReturnValue({ insert }) });

    await expect(
      createRun({ triggered_by_telegram_id: 1, triggered_in_chat_id: 2, issue_text: 'x' }),
    ).rejects.toThrow('createRun failed: insert failed');
  });
});

// ── updateRun ────────────────────────────────────────────────────────────────

describe('updateRun', () => {
  it('resolves without throwing on success', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    mockDb.mockReturnValue({ from: vi.fn().mockReturnValue({ update }) });

    await expect(updateRun('run-uuid-1', { status: 'fixing' })).resolves.toBeUndefined();
  });

  it('throws when Supabase returns an error', async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: 'update failed' } });
    const update = vi.fn().mockReturnValue({ eq });
    mockDb.mockReturnValue({ from: vi.fn().mockReturnValue({ update }) });

    await expect(updateRun('run-uuid-1', { status: 'done' })).rejects.toThrow(
      'updateRun failed: update failed',
    );
  });
});

// ── getRun ───────────────────────────────────────────────────────────────────

describe('getRun', () => {
  it('returns the run when found', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: MOCK_RUN, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    mockDb.mockReturnValue({ from: vi.fn().mockReturnValue({ select }) });

    const result = await getRun('run-uuid-1');
    expect(result).toEqual(MOCK_RUN);
  });

  it('returns null when not found (maybeSingle data is null)', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    mockDb.mockReturnValue({ from: vi.fn().mockReturnValue({ select }) });

    const result = await getRun('nonexistent');
    expect(result).toBeNull();
  });

  it('throws when Supabase returns an error', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    mockDb.mockReturnValue({ from: vi.fn().mockReturnValue({ select }) });

    await expect(getRun('run-uuid-1')).rejects.toThrow('getRun failed: db error');
  });
});

// ── listOpenRuns ─────────────────────────────────────────────────────────────

describe('listOpenRuns', () => {
  function makeListChain(data: unknown[] | null, error: unknown = null) {
    const limit = vi.fn().mockResolvedValue({ data, error });
    const order = vi.fn().mockReturnValue({ limit });
    const inFn = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ in: inFn });
    mockDb.mockReturnValue({ from: vi.fn().mockReturnValue({ select }) });
    return { limit };
  }

  it('returns array of open runs', async () => {
    makeListChain([MOCK_RUN]);
    const result = await listOpenRuns();
    expect(result).toEqual([MOCK_RUN]);
  });

  it('returns [] when data is null', async () => {
    makeListChain(null);
    const result = await listOpenRuns();
    expect(result).toEqual([]);
  });

  it('throws when Supabase returns an error', async () => {
    makeListChain(null, { message: 'query failed' });
    await expect(listOpenRuns()).rejects.toThrow('listOpenRuns failed: query failed');
  });
});

// ── countRunsByTelegramIdToday ────────────────────────────────────────────────

describe('countRunsByTelegramIdToday', () => {
  function makeCountChain(count: number | null, error: unknown = null) {
    const gte = vi.fn().mockResolvedValue({ count, error });
    const eq = vi.fn().mockReturnValue({ gte });
    const select = vi.fn().mockReturnValue({ eq });
    mockDb.mockReturnValue({ from: vi.fn().mockReturnValue({ select }) });
  }

  it('returns the run count for the telegram user', async () => {
    makeCountChain(3);
    const result = await countRunsByTelegramIdToday(42);
    expect(result).toBe(3);
  });

  it('returns 0 when count is null', async () => {
    makeCountChain(null);
    const result = await countRunsByTelegramIdToday(42);
    expect(result).toBe(0);
  });

  it('throws when Supabase returns an error', async () => {
    makeCountChain(null, { message: 'count failed' });
    await expect(countRunsByTelegramIdToday(99)).rejects.toThrow(
      'countRunsByTelegramIdToday failed: count failed',
    );
  });
});
