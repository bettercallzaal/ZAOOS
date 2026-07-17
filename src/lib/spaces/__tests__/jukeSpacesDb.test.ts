// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockMaybeSingle = vi.hoisted(() => vi.fn());
const mockSingle = vi.hoisted(() => vi.fn());
const mockUpsert = vi.hoisted(() => vi.fn());
const mockInsert = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockEq = vi.hoisted(() => vi.fn());
const mockSelect = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import {
  addParticipant,
  bumpParticipantCount,
  getJukeSpace,
  insertJukeSpace,
  recordWebhookEvent,
  removeParticipant,
  updateJukeSpace,
} from '../jukeSpacesDb';

afterEach(() => vi.clearAllMocks());

// ---------------------------------------------------------------------------
// insertJukeSpace
// ---------------------------------------------------------------------------
describe('insertJukeSpace', () => {
  it('upserts with status=active when no scheduledAt', async () => {
    mockFrom.mockReturnValue({ upsert: mockUpsert });
    mockUpsert.mockResolvedValue({ error: null });
    await insertJukeSpace({ id: 'space-1', title: 'ZAO Live', createdByFid: 42 });
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active' }),
      expect.any(Object),
    );
  });

  it('upserts with status=scheduled when scheduledAt is set', async () => {
    mockFrom.mockReturnValue({ upsert: mockUpsert });
    mockUpsert.mockResolvedValue({ error: null });
    await insertJukeSpace({
      id: 'space-2',
      title: 'Future Space',
      createdByFid: 42,
      scheduledAt: '2026-08-01T20:00:00Z',
    });
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'scheduled', started_at: null }),
      expect.any(Object),
    );
  });

  it('throws on DB error', async () => {
    mockFrom.mockReturnValue({ upsert: mockUpsert });
    mockUpsert.mockResolvedValue({ error: { message: 'DB fail' } });
    await expect(insertJukeSpace({ id: 's', title: 't', createdByFid: 1 })).rejects.toThrow(
      'insertJukeSpace failed',
    );
  });
});

// ---------------------------------------------------------------------------
// getJukeSpace
// ---------------------------------------------------------------------------
describe('getJukeSpace', () => {
  it('returns the space row when found', async () => {
    const ROW = { id: 'space-1', title: 'ZAO Live', status: 'active' };
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockMaybeSingle.mockResolvedValue({ data: ROW, error: null });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
    const result = await getJukeSpace('space-1');
    expect(result).toMatchObject({ id: 'space-1' });
  });

  it('returns null when space not found', async () => {
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
    const result = await getJukeSpace('missing-id');
    expect(result).toBeNull();
  });

  it('throws on DB error', async () => {
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'timeout' } });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
    await expect(getJukeSpace('space-1')).rejects.toThrow('getJukeSpace failed');
  });
});

// ---------------------------------------------------------------------------
// updateJukeSpace
// ---------------------------------------------------------------------------
describe('updateJukeSpace', () => {
  it('calls update with the patch and throws on error', async () => {
    const mockUpdateEq = vi.fn().mockResolvedValue({ error: { message: 'fail' } });
    mockFrom.mockReturnValue({ update: vi.fn().mockReturnValue({ eq: mockUpdateEq }) });
    await expect(updateJukeSpace('space-1', { status: 'ended' })).rejects.toThrow(
      'updateJukeSpace failed',
    );
  });

  it('resolves without error on success', async () => {
    const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ update: vi.fn().mockReturnValue({ eq: mockUpdateEq }) });
    await expect(updateJukeSpace('space-1', { status: 'active' })).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// bumpParticipantCount
// ---------------------------------------------------------------------------
describe('bumpParticipantCount', () => {
  it('increments participant_count by delta', async () => {
    let call = 0;
    const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) {
        // select maybeSingle
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { participant_count: 3 }, error: null }),
            }),
          }),
        };
      }
      // update
      return { update: vi.fn().mockReturnValue({ eq: mockUpdateEq }) };
    });
    await bumpParticipantCount('space-1', 1);
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'space-1');
  });

  it('floors participant_count at 0', async () => {
    let call = 0;
    const capturedUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { participant_count: 0 }, error: null }),
            }),
          }),
        };
      }
      return { update: capturedUpdate };
    });
    await bumpParticipantCount('space-1', -5);
    // count should be max(0, 0 + (-5)) = 0
    expect(capturedUpdate).toHaveBeenCalledWith({ participant_count: 0 });
  });
});

// ---------------------------------------------------------------------------
// recordWebhookEvent
// ---------------------------------------------------------------------------
describe('recordWebhookEvent', () => {
  it('returns true on successful insert', async () => {
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockResolvedValue({ error: null });
    const result = await recordWebhookEvent({
      eventType: 'room.started',
      signatureHash: 'abc123',
      body: {},
    });
    expect(result).toBe(true);
  });

  it('returns false on duplicate (23505 unique violation)', async () => {
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockResolvedValue({ error: { code: '23505', message: 'unique violation' } });
    const result = await recordWebhookEvent({
      eventType: 'room.started',
      signatureHash: 'abc123',
      body: {},
    });
    expect(result).toBe(false);
  });

  it('throws on other DB errors', async () => {
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockResolvedValue({ error: { code: '42000', message: 'syntax error' } });
    await expect(
      recordWebhookEvent({ eventType: 'room.started', signatureHash: 'abc', body: {} }),
    ).rejects.toThrow('recordWebhookEvent failed');
  });
});

// ---------------------------------------------------------------------------
// addParticipant / removeParticipant
// ---------------------------------------------------------------------------
describe('addParticipant', () => {
  it('dedupes on fid and appends the entry', async () => {
    const existing = [{ fid: 1, display_name: 'Old', role: 'host', joined_at: '2026-01-01' }];
    let call = 0;
    const capturedUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { participants: existing }, error: null }),
            }),
          }),
        };
      }
      return { update: capturedUpdate };
    });
    await addParticipant('space-1', { fid: 1, display_name: 'New', role: 'listener', joined_at: '2026-07-01' });
    expect(capturedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ participants: [{ fid: 1, display_name: 'New', role: 'listener', joined_at: '2026-07-01' }] }),
    );
  });
});

describe('removeParticipant', () => {
  it('filters out the fid from participants', async () => {
    const existing = [
      { fid: 1, display_name: 'A', role: 'host', joined_at: '2026-01-01' },
      { fid: 2, display_name: 'B', role: 'listener', joined_at: '2026-01-02' },
    ];
    let call = 0;
    const capturedUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { participants: existing }, error: null }),
            }),
          }),
        };
      }
      return { update: capturedUpdate };
    });
    await removeParticipant('space-1', 1);
    expect(capturedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ participants: [{ fid: 2, display_name: 'B', role: 'listener', joined_at: '2026-01-02' }] }),
    );
  });
});
