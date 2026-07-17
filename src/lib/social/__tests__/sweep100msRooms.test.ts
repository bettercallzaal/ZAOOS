// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock DB and 100ms API — sweepStale100msRooms transitivley imports supabaseAdmin.
vi.mock('@/lib/social/msRoomsDb', () => ({
  getActiveMSRooms: vi.fn(),
  endMSRoom: vi.fn(),
  setMSRoomParticipantCount: vi.fn(),
}));

vi.mock('@/lib/social/hms100ms', () => ({
  get100msPeerCount: vi.fn(),
  mintManagementToken: vi.fn(),
}));

import { endMSRoom, getActiveMSRooms } from '@/lib/social/msRoomsDb';
import { get100msPeerCount, mintManagementToken } from '@/lib/social/hms100ms';
import { sweepStale100msRooms } from '../sweep100msRooms';

// Age helpers relative to now (matches the module's Date.now() usage)
const ageMs = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

function makeRoom(opts: {
  id?: string;
  room_id_100ms?: string | null;
  ageMinutes: number;
  participant_count?: number;
}) {
  return {
    id: opts.id ?? 'room-1',
    title: 'Test Room',
    host_fid: 1,
    host_name: 'Host',
    room_id_100ms: opts.room_id_100ms ?? null,
    state: 'active' as const,
    settings: {},
    pinned_links: [],
    speakers: [],
    created_at: ageMs(opts.ageMinutes),
    ended_at: null,
    participant_count: opts.participant_count ?? 0,
  };
}

const endMock = endMSRoom as ReturnType<typeof vi.fn>;
const getActiveRoomsMock = getActiveMSRooms as ReturnType<typeof vi.fn>;
const getPeerCountMock = get100msPeerCount as ReturnType<typeof vi.fn>;
const mintTokenMock = mintManagementToken as ReturnType<typeof vi.fn>;

afterEach(() => {
  vi.clearAllMocks();
});

describe('sweepStale100msRooms', () => {
  it('returns zero counts when there are no active rooms', async () => {
    getActiveRoomsMock.mockResolvedValue([]);
    const result = await sweepStale100msRooms();
    expect(result).toEqual({ checked: 0, ended: 0, skipped: 0, endedIds: [] });
  });

  it('ends a ghost room (empty + older than grace window)', async () => {
    const room = makeRoom({ id: 'ghost-1', room_id_100ms: 'hms-1', ageMinutes: 20 });
    getActiveRoomsMock.mockResolvedValue([room]);
    mintTokenMock.mockReturnValue('mgmt-token');
    getPeerCountMock.mockResolvedValue(0); // empty
    endMock.mockResolvedValue(undefined);

    const result = await sweepStale100msRooms();
    expect(result.ended).toBe(1);
    expect(result.endedIds).toContain('ghost-1');
    expect(endMock).toHaveBeenCalledWith('ghost-1');
  });

  it('skips an empty room that is within the grace window', async () => {
    const room = makeRoom({ room_id_100ms: 'hms-1', ageMinutes: 5 }); // < 15 min
    getActiveRoomsMock.mockResolvedValue([room]);
    mintTokenMock.mockReturnValue('mgmt-token');
    getPeerCountMock.mockResolvedValue(0);

    const result = await sweepStale100msRooms();
    expect(result.ended).toBe(0);
    expect(result.skipped).toBe(1);
    expect(endMock).not.toHaveBeenCalled();
  });

  it('skips a room when peer count is null (unknown — read failure)', async () => {
    const room = makeRoom({ room_id_100ms: 'hms-1', ageMinutes: 30 });
    getActiveRoomsMock.mockResolvedValue([room]);
    mintTokenMock.mockReturnValue('mgmt-token');
    getPeerCountMock.mockResolvedValue(null); // API error / unknown

    const result = await sweepStale100msRooms();
    expect(result.ended).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('skips a room that still has active peers', async () => {
    // participant_count matches the mock count so setMSRoomParticipantCount is not called.
    const room = makeRoom({ room_id_100ms: 'hms-1', ageMinutes: 60, participant_count: 3 });
    getActiveRoomsMock.mockResolvedValue([room]);
    mintTokenMock.mockReturnValue('mgmt-token');
    getPeerCountMock.mockResolvedValue(3);

    const result = await sweepStale100msRooms();
    expect(result.ended).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('ends an unresolved room (no room_id_100ms) past the TTL', async () => {
    const room = makeRoom({ id: 'stale-1', room_id_100ms: null, ageMinutes: 7 * 60 }); // 7h > 6h TTL
    getActiveRoomsMock.mockResolvedValue([room]);
    mintTokenMock.mockReturnValue('mgmt-token');
    endMock.mockResolvedValue(undefined);

    const result = await sweepStale100msRooms();
    expect(result.ended).toBe(1);
    expect(endMock).toHaveBeenCalledWith('stale-1');
  });

  it('skips an unresolved room (no room_id_100ms) within the TTL', async () => {
    const room = makeRoom({ room_id_100ms: null, ageMinutes: 30 }); // < 360 min TTL
    getActiveRoomsMock.mockResolvedValue([room]);
    mintTokenMock.mockReturnValue('mgmt-token');

    const result = await sweepStale100msRooms();
    expect(result.ended).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('continues processing other rooms when endMSRoom throws', async () => {
    const r1 = makeRoom({ id: 'fail-1', room_id_100ms: 'h1', ageMinutes: 30 });
    const r2 = makeRoom({ id: 'ok-2', room_id_100ms: 'h2', ageMinutes: 25 });
    getActiveRoomsMock.mockResolvedValue([r1, r2]);
    mintTokenMock.mockReturnValue('mgmt-token');
    getPeerCountMock.mockResolvedValue(0);
    endMock
      .mockRejectedValueOnce(new Error('DB error'))
      .mockResolvedValueOnce(undefined);

    const result = await sweepStale100msRooms();
    expect(result.checked).toBe(2);
    // r1 failed to end (exception swallowed), r2 ended
    expect(result.endedIds).toContain('ok-2');
    expect(result.endedIds).not.toContain('fail-1');
  });

  it('skips all reads when mintManagementToken returns null', async () => {
    const room = makeRoom({ room_id_100ms: 'hms-1', ageMinutes: 30 });
    getActiveRoomsMock.mockResolvedValue([room]);
    mintTokenMock.mockReturnValue(null);

    const result = await sweepStale100msRooms();
    // Without a mgmt token the room falls through to the unresolved-TTL path.
    // Age is 30 min which is < 360 min TTL, so it is skipped.
    expect(getPeerCountMock).not.toHaveBeenCalled();
    expect(result.skipped).toBe(1);
  });
});
