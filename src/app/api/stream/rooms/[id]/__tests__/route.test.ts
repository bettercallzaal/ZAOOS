// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest, makePostRequest } from '@/test-utils/api-helpers';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
vi.mock('@/../community.config', () => ({
  communityConfig: { adminFids: [1] },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

const mockGetRoomById = vi.hoisted(() => vi.fn());
const mockEndRoom = vi.hoisted(() => vi.fn());
const mockUpdateRoom = vi.hoisted(() => vi.fn());
const mockUpdateRecording = vi.hoisted(() => vi.fn());
vi.mock('@/lib/spaces/roomsDb', () => ({
  getRoomById: mockGetRoomById,
  endRoom: mockEndRoom,
  updateRoom: mockUpdateRoom,
  updateRecording: mockUpdateRecording,
}));
vi.mock('@/lib/twitch/client', () => ({
  getValidTwitchToken: vi.fn().mockResolvedValue(null),
  updateTwitchChannel: vi.fn(),
}));

import { GET, PATCH } from '../route';

afterEach(() => vi.clearAllMocks());

const ROOM_ID = 'room-uuid-abc';
const MOCK_ROOM = { id: ROOM_ID, title: 'ZAO Stage', host_fid: 10 };
const HOST_SESSION = { fid: 10, isAdmin: false };
const ADMIN_SESSION = { fid: 1, isAdmin: true };

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makePatchRequest(body: object) {
  return new NextRequest(new URL(`/api/stream/rooms/${ROOM_ID}`, 'http://localhost:3000'), {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

describe('GET /api/stream/rooms/[id]', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makeGetRequest(`/api/stream/rooms/${ROOM_ID}`);
    const res = await GET(req, makeParams(ROOM_ID));
    expect(res.status).toBe(401);
  });

  it('returns 404 when room not found', async () => {
    mockGetSessionData.mockResolvedValue(HOST_SESSION);
    mockGetRoomById.mockResolvedValue(null);
    const req = makeGetRequest(`/api/stream/rooms/${ROOM_ID}`);
    const res = await GET(req, makeParams(ROOM_ID));
    expect(res.status).toBe(404);
  });

  it('returns room data on success', async () => {
    mockGetSessionData.mockResolvedValue(HOST_SESSION);
    mockGetRoomById.mockResolvedValue(MOCK_ROOM);
    const req = makeGetRequest(`/api/stream/rooms/${ROOM_ID}`);
    const res = await GET(req, makeParams(ROOM_ID));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.room.id).toBe(ROOM_ID);
  });
});

describe('PATCH /api/stream/rooms/[id]', () => {
  it('returns 403 when user is neither host nor admin', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 99, isAdmin: false });
    mockGetRoomById.mockResolvedValue(MOCK_ROOM);
    const req = makePatchRequest({ action: 'end' });
    const res = await PATCH(req, makeParams(ROOM_ID));
    expect(res.status).toBe(403);
  });

  it('returns success:true when host ends the room', async () => {
    mockGetSessionData.mockResolvedValue(HOST_SESSION);
    mockGetRoomById.mockResolvedValue(MOCK_ROOM);
    mockEndRoom.mockResolvedValue(undefined);
    const req = makePatchRequest({ action: 'end' });
    const res = await PATCH(req, makeParams(ROOM_ID));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns updated room when admin updates title', async () => {
    mockGetSessionData.mockResolvedValue(ADMIN_SESSION);
    mockGetRoomById.mockResolvedValue(MOCK_ROOM);
    const updatedRoom = { ...MOCK_ROOM, title: 'ZAO Stage V2' };
    mockUpdateRoom.mockResolvedValue(updatedRoom);
    const req = makePatchRequest({ action: 'update', title: 'ZAO Stage V2' });
    const res = await PATCH(req, makeParams(ROOM_ID));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.room.title).toBe('ZAO Stage V2');
  });
});
