// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/spaces/sessionsDb', () => ({
  endRoomSessions: vi.fn().mockResolvedValue(undefined),
}));

const mockMaybeSingle = vi.hoisted(() => vi.fn());
const mockSingle = vi.hoisted(() => vi.fn());
const mockInsert = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import {
  addMSRoomSpeaker,
  createSpeakerRequest,
  endMSRoom,
  ensureMSRoomSlug,
  getActiveMSRooms,
  getApprovedSpeakerNames,
  getMSRoomById,
  getMSRoomBySlugOrId,
  getRoomSpeakerFids,
  getSpeakerRequests,
  isStageRoom,
  removeMSRoomSpeaker,
  roomSlug,
  setMSRoomPinnedLinks,
  setSpeakerRequestStatus,
} from '../msRoomsDb';

afterEach(() => vi.clearAllMocks());

const BASE_ROOM = {
  id: 'room-1',
  title: 'ZAO Stage',
  host_fid: 1,
  host_name: 'Zaal',
  room_id_100ms: null,
  state: 'active' as const,
  settings: {},
  pinned_links: [],
  speakers: [],
  created_at: '2026-07-01T00:00:00Z',
  ended_at: null,
  participant_count: 0,
};

// ---------------------------------------------------------------------------
// Pure utility functions
// ---------------------------------------------------------------------------
describe('isStageRoom', () => {
  it('returns true when settings.room_type is stage', () => {
    expect(isStageRoom({ settings: { room_type: 'stage' } })).toBe(true);
  });

  it('returns false for non-stage room_type', () => {
    expect(isStageRoom({ settings: { room_type: 'video' } })).toBe(false);
  });

  it('returns false when settings is empty', () => {
    expect(isStageRoom({ settings: {} })).toBe(false);
  });
});

describe('roomSlug', () => {
  it('returns the slug string when set', () => {
    expect(roomSlug({ settings: { slug: 'zao-live-abc1' } })).toBe('zao-live-abc1');
  });

  it('returns null when slug is not set', () => {
    expect(roomSlug({ settings: {} })).toBeNull();
  });

  it('returns null when slug is an empty string', () => {
    expect(roomSlug({ settings: { slug: '' } })).toBeNull();
  });
});

describe('getRoomSpeakerFids', () => {
  it('returns numeric FIDs from the speakers array', () => {
    expect(getRoomSpeakerFids({ speakers: [1, 2, 3] })).toEqual([1, 2, 3]);
  });

  it('filters out non-number values', () => {
    expect(getRoomSpeakerFids({ speakers: [1, 'bad', null, 2] })).toEqual([1, 2]);
  });

  it('returns empty array for non-array speakers', () => {
    expect(getRoomSpeakerFids({ speakers: null as unknown as unknown[] })).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getActiveMSRooms
// ---------------------------------------------------------------------------
describe('getActiveMSRooms', () => {
  it('returns active rooms', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [BASE_ROOM], error: null }),
        }),
      }),
    });
    const result = await getActiveMSRooms();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('room-1');
  });

  it('throws on DB error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
        }),
      }),
    });
    await expect(getActiveMSRooms()).rejects.toThrow('Failed to fetch ms_rooms');
  });
});

// ---------------------------------------------------------------------------
// getMSRoomById
// ---------------------------------------------------------------------------
describe('getMSRoomById', () => {
  it('returns the room when found', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: BASE_ROOM, error: null }),
        }),
      }),
    });
    const result = await getMSRoomById('room-1');
    expect(result).toMatchObject({ id: 'room-1' });
  });

  it('returns null on error (not found)', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        }),
      }),
    });
    const result = await getMSRoomById('missing');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getMSRoomBySlugOrId
// ---------------------------------------------------------------------------
describe('getMSRoomBySlugOrId', () => {
  it('queries by id when given a UUID', async () => {
    const UUID = '550e8400-e29b-41d4-a716-446655440000';
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { ...BASE_ROOM, id: UUID }, error: null }),
        }),
      }),
    });
    const result = await getMSRoomBySlugOrId(UUID);
    expect(result?.id).toBe(UUID);
  });

  it('queries by slug when given a non-UUID string', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: BASE_ROOM, error: null }),
            }),
          }),
        }),
      }),
    });
    const result = await getMSRoomBySlugOrId('zao-stage-abc1');
    expect(result?.id).toBe('room-1');
  });
});

// ---------------------------------------------------------------------------
// ensureMSRoomSlug
// ---------------------------------------------------------------------------
describe('ensureMSRoomSlug', () => {
  it('returns existing slug without hitting the DB', async () => {
    const room = { ...BASE_ROOM, settings: { slug: 'existing-slug' } };
    const result = await ensureMSRoomSlug(room);
    expect(result).toBe('existing-slug');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('generates and persists a slug when none exists', async () => {
    const room = { ...BASE_ROOM, settings: {} };
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    const result = await ensureMSRoomSlug(room);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(mockFrom).toHaveBeenCalledWith('ms_rooms');
  });
});

// ---------------------------------------------------------------------------
// setMSRoomPinnedLinks
// ---------------------------------------------------------------------------
describe('setMSRoomPinnedLinks', () => {
  it('resolves on success', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    const links = [{ label: 'ZAO', url: 'https://zao.xyz' }];
    await expect(setMSRoomPinnedLinks('room-1', links)).resolves.toBeUndefined();
  });

  it('throws on DB error', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'fail' } }),
      }),
    });
    await expect(setMSRoomPinnedLinks('room-1', [])).rejects.toThrow('Failed to update pinned links');
  });
});

// ---------------------------------------------------------------------------
// getApprovedSpeakerNames
// ---------------------------------------------------------------------------
describe('getApprovedSpeakerNames', () => {
  it('returns fid -> name map for approved speakers', async () => {
    const rows = [
      { requester_fid: 1, requester_name: 'Zaal' },
      { requester_fid: 2, requester_name: 'Arthur' },
    ];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: rows }),
        }),
      }),
    });
    const result = await getApprovedSpeakerNames('room-1');
    expect(result[1]).toBe('Zaal');
    expect(result[2]).toBe('Arthur');
  });

  it('returns empty map when no approved speakers', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    });
    const result = await getApprovedSpeakerNames('room-1');
    expect(result).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// addMSRoomSpeaker
// ---------------------------------------------------------------------------
describe('addMSRoomSpeaker', () => {
  it('throws when room not found', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        }),
      }),
    });
    await expect(addMSRoomSpeaker('room-1', 99)).rejects.toThrow('Room not found');
  });

  it('is a no-op when fid already in speakers', async () => {
    const room = { ...BASE_ROOM, speakers: [42] };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: room, error: null }),
        }),
      }),
    });
    await expect(addMSRoomSpeaker('room-1', 42)).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledTimes(1); // Only the select, no update
  });

  it('adds fid to speakers list', async () => {
    const room = { ...BASE_ROOM, speakers: [1] };
    let call = 0;
    const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const capturedUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: room, error: null }),
            }),
          }),
        };
      }
      return { update: capturedUpdate };
    });
    await addMSRoomSpeaker('room-1', 2);
    expect(capturedUpdate).toHaveBeenCalledWith({ speakers: [1, 2] });
  });
});

// ---------------------------------------------------------------------------
// removeMSRoomSpeaker
// ---------------------------------------------------------------------------
describe('removeMSRoomSpeaker', () => {
  it('removes fid from speakers list', async () => {
    const room = { ...BASE_ROOM, speakers: [1, 2, 3] };
    let call = 0;
    const capturedUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: room, error: null }),
            }),
          }),
        };
      }
      return { update: capturedUpdate };
    });
    await removeMSRoomSpeaker('room-1', 2);
    expect(capturedUpdate).toHaveBeenCalledWith({ speakers: [1, 3] });
  });
});

// ---------------------------------------------------------------------------
// createSpeakerRequest
// ---------------------------------------------------------------------------
describe('createSpeakerRequest', () => {
  it('deletes existing request then inserts new pending one', async () => {
    const REQUEST = {
      id: 'req-1',
      room_id: 'room-1',
      requester_fid: 5,
      requester_name: 'Zaal',
      status: 'pending',
      created_at: '2026-07-01T00:00:00Z',
    };
    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) {
        // delete existing
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }),
        };
      }
      // insert new
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: REQUEST, error: null }),
          }),
        }),
      };
    });
    const result = await createSpeakerRequest('room-1', 5, 'Zaal');
    expect(result.status).toBe('pending');
    expect(result.requester_fid).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// getSpeakerRequests
// ---------------------------------------------------------------------------
describe('getSpeakerRequests', () => {
  it('returns all requests for a room', async () => {
    const REQUESTS = [{ id: 'req-1', room_id: 'room-1', status: 'pending' }];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: REQUESTS, error: null }),
        }),
      }),
    });
    const result = await getSpeakerRequests('room-1');
    expect(result).toHaveLength(1);
  });

  it('filters by status when provided', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockEqStatus = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqRoom = vi.fn().mockReturnValue({ eq: mockEqStatus });
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: mockEqRoom }) });
    await getSpeakerRequests('room-1', 'approved');
    expect(mockEqStatus).toHaveBeenCalledWith('status', 'approved');
  });
});

// ---------------------------------------------------------------------------
// setSpeakerRequestStatus
// ---------------------------------------------------------------------------
describe('setSpeakerRequestStatus', () => {
  it('resolves on success', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });
    await expect(setSpeakerRequestStatus('room-1', 5, 'approved')).resolves.toBeUndefined();
  });

  it('throws on DB error', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'fail' } }),
        }),
      }),
    });
    await expect(setSpeakerRequestStatus('room-1', 5, 'denied')).rejects.toThrow(
      'Failed to update speaker request',
    );
  });
});

// ---------------------------------------------------------------------------
// endMSRoom
// ---------------------------------------------------------------------------
describe('endMSRoom', () => {
  it('updates room state, deletes speaker_requests, and calls endRoomSessions', async () => {
    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) {
        // update ms_rooms state
        return { update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) };
      }
      // delete speaker_requests
      return { delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) };
    });
    await endMSRoom('room-1');
    expect(call).toBe(2);
    const { endRoomSessions } = await import('@/lib/spaces/sessionsDb');
    expect(endRoomSessions).toHaveBeenCalledWith('room-1');
  });
});
