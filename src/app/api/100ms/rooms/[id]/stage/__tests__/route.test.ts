import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  makeGetRequest,
  makePostRequest,
  mockUnauthenticatedSession,
  mockAuthenticatedSession,
} from '@/test-utils/api-helpers';

const {
  mockGetSessionData,
  mockGetMSRoomById,
  mockGetSpeakerRequests,
  mockCreateSpeakerRequest,
  mockSetSpeakerRequestStatus,
  mockAddMSRoomSpeaker,
  mockRemoveMSRoomSpeaker,
  mockGetApprovedSpeakerNames,
} = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockGetMSRoomById: vi.fn(),
  mockGetSpeakerRequests: vi.fn(),
  mockCreateSpeakerRequest: vi.fn(),
  mockSetSpeakerRequestStatus: vi.fn(),
  mockAddMSRoomSpeaker: vi.fn(),
  mockRemoveMSRoomSpeaker: vi.fn(),
  mockGetApprovedSpeakerNames: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/social/msRoomsDb', () => ({
  getMSRoomById: mockGetMSRoomById,
  isStageRoom: (room: { settings?: Record<string, unknown> }) => room.settings?.room_type === 'stage',
  getRoomSpeakerFids: (room: { speakers?: unknown[] }) =>
    Array.isArray(room.speakers) ? room.speakers.filter((s) => typeof s === 'number') : [],
  getSpeakerRequests: mockGetSpeakerRequests,
  createSpeakerRequest: mockCreateSpeakerRequest,
  setSpeakerRequestStatus: mockSetSpeakerRequestStatus,
  addMSRoomSpeaker: mockAddMSRoomSpeaker,
  removeMSRoomSpeaker: mockRemoveMSRoomSpeaker,
  getApprovedSpeakerNames: mockGetApprovedSpeakerNames,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET, POST } from '../route';

const STAGE_ROOM = {
  id: 'room-1',
  host_fid: 123,
  state: 'active',
  settings: { room_type: 'stage' },
  speakers: [],
};

const ctx = { params: Promise.resolve({ id: 'room-1' }) };

describe('POST /api/100ms/rooms/[id]/stage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession()); // fid 123 = host
    mockGetMSRoomById.mockResolvedValue(STAGE_ROOM);
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST(makePostRequest('/x', { action: 'raise_hand' }), ctx);
    expect(res.status).toBe(401);
  });

  it('returns 400 for a non-stage room', async () => {
    mockGetMSRoomById.mockResolvedValue({ ...STAGE_ROOM, settings: { room_type: 'video' } });
    const res = await POST(makePostRequest('/x', { action: 'raise_hand' }), ctx);
    expect(res.status).toBe(400);
  });

  it('lets a listener raise their hand', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 555, displayName: 'Lou' }));
    const res = await POST(makePostRequest('/x', { action: 'raise_hand' }), ctx);
    expect(res.status).toBe(200);
    expect(mockCreateSpeakerRequest).toHaveBeenCalledWith('room-1', 555, 'Lou');
  });

  it('approve adds the speaker (host only)', async () => {
    const res = await POST(makePostRequest('/x', { action: 'approve', fid: 555 }), ctx);
    expect(res.status).toBe(200);
    expect(mockSetSpeakerRequestStatus).toHaveBeenCalledWith('room-1', 555, 'approved');
    expect(mockAddMSRoomSpeaker).toHaveBeenCalledWith('room-1', 555);
  });

  it('demote removes the speaker (host only)', async () => {
    const res = await POST(makePostRequest('/x', { action: 'demote', fid: 555 }), ctx);
    expect(res.status).toBe(200);
    expect(mockRemoveMSRoomSpeaker).toHaveBeenCalledWith('room-1', 555);
  });

  it('forbids a non-host from approving', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 555 }));
    const res = await POST(makePostRequest('/x', { action: 'approve', fid: 555 }), ctx);
    expect(res.status).toBe(403);
    expect(mockAddMSRoomSpeaker).not.toHaveBeenCalled();
  });

  it('rejects an unknown action', async () => {
    const res = await POST(makePostRequest('/x', { action: 'destroy' }), ctx);
    expect(res.status).toBe(400);
  });

  it('requires a fid for approve', async () => {
    const res = await POST(makePostRequest('/x', { action: 'approve' }), ctx);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/100ms/rooms/[id]/stage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMSRoomById.mockResolvedValue({ ...STAGE_ROOM, speakers: [123, 555] });
    mockGetSpeakerRequests.mockResolvedValue([{ id: 'r1', requester_fid: 777 }]);
    mockGetApprovedSpeakerNames.mockResolvedValue({ 555: 'Lou' });
  });

  it('returns pending requests, approved speakers, and their names', async () => {
    const res = await GET(makeGetRequest('/x'), ctx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.speakers).toEqual([123, 555]);
    expect(body.requests).toHaveLength(1);
    expect(body.speakerNames).toEqual({ 555: 'Lou' });
  });

  it('returns 404 for a missing room', async () => {
    mockGetMSRoomById.mockResolvedValue(null);
    const res = await GET(makeGetRequest('/x'), ctx);
    expect(res.status).toBe(404);
  });
});
