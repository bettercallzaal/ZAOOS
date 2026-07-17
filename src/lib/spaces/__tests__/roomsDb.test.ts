// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockRpc = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom, rpc: mockRpc } }));

import {
  createRoom,
  decrementParticipants,
  endRoom,
  getLiveRooms,
  getPastRooms,
  getRoomById,
  incrementParticipants,
  updateRoom,
} from '../roomsDb';

afterEach(() => vi.clearAllMocks());

const BASE_ROOM = {
  id: 'room-1',
  title: 'ZAO Stage',
  state: 'live' as const,
  host_fid: 1,
  host_name: 'Zaal',
  host_username: 'zabal',
  stream_call_id: 'call-abc',
  participant_count: 1,
};

// ---------------------------------------------------------------------------
// createRoom
// ---------------------------------------------------------------------------
describe('createRoom', () => {
  it('returns the created Room', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: BASE_ROOM, error: null }),
        }),
      }),
    });
    const result = await createRoom({
      title: 'ZAO Stage',
      hostFid: 1,
      hostName: 'Zaal',
      hostUsername: 'zabal',
      streamCallId: 'call-abc',
    });
    expect(result).toMatchObject({ id: 'room-1', title: 'ZAO Stage' });
  });

  it('throws on DB error', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'connection refused' } }),
        }),
      }),
    });
    await expect(
      createRoom({
        title: 'ZAO Stage',
        hostFid: 1,
        hostName: 'Zaal',
        hostUsername: 'zabal',
        streamCallId: 'call-abc',
      }),
    ).rejects.toThrow('Failed to create room');
  });
});

// ---------------------------------------------------------------------------
// getRoomById
// ---------------------------------------------------------------------------
describe('getRoomById', () => {
  it('returns Room when found by UUID', async () => {
    const UUID = '550e8400-e29b-41d4-a716-446655440000';
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { ...BASE_ROOM, id: UUID }, error: null }),
        }),
      }),
    });
    const result = await getRoomById(UUID);
    expect(result).toMatchObject({ id: UUID });
  });

  it('returns null when not found', async () => {
    const UUID = '550e8400-e29b-41d4-a716-446655440000';
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        }),
      }),
    });
    const result = await getRoomById(UUID);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getLiveRooms
// ---------------------------------------------------------------------------
describe('getLiveRooms', () => {
  it('returns list of live rooms', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [BASE_ROOM], error: null }),
        }),
      }),
    });
    const result = await getLiveRooms();
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
    await expect(getLiveRooms()).rejects.toThrow('Failed to fetch rooms');
  });
});

// ---------------------------------------------------------------------------
// endRoom
// ---------------------------------------------------------------------------
describe('endRoom', () => {
  it('resolves on success', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    await expect(endRoom('room-1')).resolves.toBeUndefined();
  });

  it('throws on DB error', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'fail' } }),
      }),
    });
    await expect(endRoom('room-1')).rejects.toThrow('Failed to end room');
  });
});

// ---------------------------------------------------------------------------
// incrementParticipants / decrementParticipants
// ---------------------------------------------------------------------------
describe('incrementParticipants', () => {
  it('calls rpc and resolves on success', async () => {
    mockRpc.mockResolvedValue({ error: null });
    await expect(incrementParticipants('room-1')).resolves.toBeUndefined();
    expect(mockRpc).toHaveBeenCalledWith('increment_participant_count', { room_id: 'room-1' });
  });

  it('throws on rpc error', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'rpc fail' } });
    await expect(incrementParticipants('room-1')).rejects.toThrow('Failed to increment');
  });
});

describe('decrementParticipants', () => {
  it('calls rpc and resolves on success', async () => {
    mockRpc.mockResolvedValue({ error: null });
    await expect(decrementParticipants('room-1')).resolves.toBeUndefined();
    expect(mockRpc).toHaveBeenCalledWith('decrement_participant_count', { room_id: 'room-1' });
  });

  it('throws on rpc error', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'rpc fail' } });
    await expect(decrementParticipants('room-1')).rejects.toThrow('Failed to decrement');
  });
});

// ---------------------------------------------------------------------------
// updateRoom
// ---------------------------------------------------------------------------
describe('updateRoom', () => {
  it('returns updated Room', async () => {
    const UPDATED = { ...BASE_ROOM, title: 'New Title' };
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: UPDATED, error: null }),
          }),
        }),
      }),
    });
    const result = await updateRoom('room-1', { title: 'New Title' });
    expect(result.title).toBe('New Title');
  });

  it('throws on DB error', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
          }),
        }),
      }),
    });
    await expect(updateRoom('room-1', { title: 'New Title' })).rejects.toThrow('Failed to update room');
  });
});

// ---------------------------------------------------------------------------
// getPastRooms
// ---------------------------------------------------------------------------
describe('getPastRooms', () => {
  it('returns past rooms for the given day range', async () => {
    const ENDED = { ...BASE_ROOM, state: 'ended' as const };
    const mockOrder = vi.fn().mockResolvedValue({ data: [ENDED], error: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({ order: mockOrder }),
          }),
        }),
      }),
    });
    const result = await getPastRooms(7);
    expect(result).toHaveLength(1);
  });

  it('throws on DB error', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({ order: mockOrder }),
          }),
        }),
      }),
    });
    await expect(getPastRooms()).rejects.toThrow('Failed to fetch past rooms');
  });
});
