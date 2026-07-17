// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockWarn = vi.hoisted(() => vi.fn());
vi.mock('@/lib/logger', () => ({
  logger: { warn: mockWarn, info: vi.fn(), error: vi.fn() },
}));

const mockInsert = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn().mockReturnValue({ insert: mockInsert }));
const mockGetSupabaseAdmin = vi.hoisted(() => vi.fn(() => ({ from: mockFrom })));
vi.mock('@/lib/db/supabase', () => ({ getSupabaseAdmin: mockGetSupabaseAdmin }));

import { logActivity, logFieldChanges } from '../log-activity';

afterEach(() => vi.clearAllMocks());

// ---------------------------------------------------------------------------
// logActivity
// ---------------------------------------------------------------------------
describe('logActivity', () => {
  it('resolves without throwing on success', async () => {
    mockInsert.mockResolvedValue({ error: null });
    await expect(
      logActivity({ actorId: 'user-1', entityType: 'sponsor', entityId: 'ent-1', action: 'create' }),
    ).resolves.toBeUndefined();
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: 'user-1',
        entity_type: 'sponsor',
        action: 'create',
      }),
    );
  });

  it('warns but does not throw on DB insert error', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'insert fail' } });
    await expect(
      logActivity({
        actorId: null,
        entityType: 'artist',
        entityId: 'ent-2',
        action: 'update',
        fieldChanged: 'name',
        oldValue: 'Old',
        newValue: 'New',
      }),
    ).resolves.toBeUndefined();
    expect(mockWarn).toHaveBeenCalled();
  });

  it('warns but does not throw when getSupabaseAdmin throws', async () => {
    mockGetSupabaseAdmin.mockImplementationOnce(() => {
      throw new Error('no db connection');
    });
    await expect(
      logActivity({ actorId: null, entityType: 'goal', entityId: 'g-1', action: 'delete' }),
    ).resolves.toBeUndefined();
    expect(mockWarn).toHaveBeenCalled();
  });

  it('stringifies non-string old/new values in the insert payload', async () => {
    mockInsert.mockResolvedValue({ error: null });
    await logActivity({
      actorId: 'user-1',
      entityType: 'budget',
      entityId: 'b-1',
      action: 'update',
      fieldChanged: 'amount',
      oldValue: { usd: 100 },
      newValue: 500,
    });
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        old_value: '{"usd":100}',
        new_value: '500',
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// logFieldChanges
// ---------------------------------------------------------------------------
describe('logFieldChanges', () => {
  it('is a no-op when no fields changed', async () => {
    const before = { name: 'ZAO', active: true };
    const after = { name: 'ZAO', active: true };
    await expect(
      logFieldChanges('user-1', 'member', 'm-1', before, after),
    ).resolves.toBeUndefined();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('calls logActivity once per changed field', async () => {
    mockInsert.mockResolvedValue({ error: null });
    const before = { name: 'Old Name', tier: 'free', active: true };
    const after = { name: 'New Name', tier: 'pro', active: true };
    await logFieldChanges('user-1', 'member', 'm-1', before, after);
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });

  it('ignores fields where after value is undefined', async () => {
    mockInsert.mockResolvedValue({ error: null });
    const before = { name: 'ZAO', tier: 'free' };
    const after = { name: 'ZAO Updated', tier: undefined };
    await logFieldChanges('user-1', 'artist', 'a-1', before, after);
    // Only 'name' changed and has a defined after value
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });
});
