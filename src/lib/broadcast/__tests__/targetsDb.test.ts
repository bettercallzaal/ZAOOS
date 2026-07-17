// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Chain mock — reusable across select/insert/update/delete operations
const chain = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  single: vi.fn(),
};

// Self-referential chain setup: each method returns `chain` for chaining
Object.values(chain).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockReturnValue(chain));

const mockFrom = vi.hoisted(() => vi.fn(() => chain));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

import {
  createTarget,
  deleteTarget,
  getUserTargets,
  updateTarget,
} from '../targetsDb';

const MOCK_TARGET = {
  id: 'target-uuid-1',
  user_fid: 42,
  platform: 'twitch' as const,
  name: 'BetterCallZaal Twitch',
  rtmp_url: 'rtmp://live.twitch.tv/live',
  stream_key: 'secret-key',
  provider: 'direct' as const,
  is_active: true,
  created_at: '2026-07-16T00:00:00Z',
  updated_at: '2026-07-16T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  // Reset chain: each method returns chain again
  Object.values(chain).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockReturnValue(chain));
  mockFrom.mockReturnValue(chain);
});

// ---------------------------------------------------------------------------
// getUserTargets
// ---------------------------------------------------------------------------
describe('getUserTargets', () => {
  it('returns active targets for the user FID', async () => {
    chain.order.mockResolvedValue({ data: [MOCK_TARGET], error: null });
    const results = await getUserTargets(42);
    expect(mockFrom).toHaveBeenCalledWith('broadcast_targets');
    expect(chain.eq).toHaveBeenCalledWith('user_fid', 42);
    expect(chain.eq).toHaveBeenCalledWith('is_active', true);
    expect(results).toEqual([MOCK_TARGET]);
  });

  it('returns empty array when no targets exist', async () => {
    chain.order.mockResolvedValue({ data: null, error: null });
    const results = await getUserTargets(42);
    expect(results).toEqual([]);
  });

  it('throws when Supabase returns an error', async () => {
    chain.order.mockResolvedValue({ data: null, error: { message: 'DB error' } });
    await expect(getUserTargets(42)).rejects.toThrow('Failed to fetch targets: DB error');
  });
});

// ---------------------------------------------------------------------------
// createTarget
// ---------------------------------------------------------------------------
describe('createTarget', () => {
  it('inserts with correct snake_case field mapping', async () => {
    chain.single.mockResolvedValue({ data: MOCK_TARGET, error: null });
    await createTarget({
      userFid: 42,
      platform: 'twitch',
      name: 'BetterCallZaal Twitch',
      rtmpUrl: 'rtmp://live.twitch.tv/live',
      streamKey: 'secret-key',
    });
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_fid: 42,
        rtmp_url: 'rtmp://live.twitch.tv/live',
        stream_key: 'secret-key',
        provider: 'direct', // default when not provided
      }),
    );
  });

  it('uses the provided provider when specified', async () => {
    chain.single.mockResolvedValue({ data: MOCK_TARGET, error: null });
    await createTarget({
      userFid: 42,
      platform: 'youtube',
      name: 'YouTube',
      rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
      streamKey: 'yt-key',
      provider: 'restream',
    });
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'restream' }),
    );
  });

  it('throws when Supabase returns an error', async () => {
    chain.single.mockResolvedValue({ data: null, error: { message: 'constraint violation' } });
    await expect(
      createTarget({ userFid: 42, platform: 'twitch', name: 'T', rtmpUrl: 'rtmp://x', streamKey: 'k' }),
    ).rejects.toThrow('constraint violation');
  });
});

// ---------------------------------------------------------------------------
// deleteTarget — IDOR protection: must filter by BOTH id AND user_fid
// ---------------------------------------------------------------------------
describe('deleteTarget', () => {
  it('deletes filtering by BOTH target id AND user FID (IDOR guard)', async () => {
    chain.eq.mockReturnValueOnce(chain).mockResolvedValue({ error: null });
    await deleteTarget('target-uuid-1', 42);
    const eqCalls = chain.eq.mock.calls;
    expect(eqCalls).toContainEqual(['id', 'target-uuid-1']);
    expect(eqCalls).toContainEqual(['user_fid', 42]);
  });

  it('throws when Supabase returns an error', async () => {
    chain.eq.mockReturnValueOnce(chain).mockResolvedValue({ error: { message: 'delete failed' } });
    await expect(deleteTarget('uuid', 42)).rejects.toThrow('delete failed');
  });
});

// ---------------------------------------------------------------------------
// updateTarget — IDOR protection + partial update
// ---------------------------------------------------------------------------
describe('updateTarget', () => {
  it('updates filtering by BOTH target id AND user FID (IDOR guard)', async () => {
    chain.eq.mockReturnValueOnce(chain).mockResolvedValue({ error: null });
    await updateTarget('target-uuid-1', 42, { name: 'New Name' });
    const eqCalls = chain.eq.mock.calls;
    expect(eqCalls).toContainEqual(['id', 'target-uuid-1']);
    expect(eqCalls).toContainEqual(['user_fid', 42]);
  });

  it('only includes provided fields in the update payload', async () => {
    chain.eq.mockReturnValueOnce(chain).mockResolvedValue({ error: null });
    await updateTarget('uuid', 42, { name: 'New Name' });
    const updatePayload = chain.update.mock.calls[0][0];
    expect(updatePayload).toHaveProperty('name', 'New Name');
    expect(updatePayload).not.toHaveProperty('rtmp_url');
    expect(updatePayload).not.toHaveProperty('stream_key');
  });

  it('always includes updated_at in the update payload', async () => {
    chain.eq.mockReturnValueOnce(chain).mockResolvedValue({ error: null });
    await updateTarget('uuid', 42, { name: 'N' });
    expect(chain.update.mock.calls[0][0]).toHaveProperty('updated_at');
  });

  it('throws when Supabase returns an error', async () => {
    chain.eq.mockReturnValueOnce(chain).mockResolvedValue({ error: { message: 'update failed' } });
    await expect(updateTarget('uuid', 42, { name: 'N' })).rejects.toThrow('update failed');
  });
});
