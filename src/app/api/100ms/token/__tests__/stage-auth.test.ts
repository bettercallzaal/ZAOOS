import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makePostRequest, mockAuthenticatedSession } from '@/test-utils/api-helpers';

const { mockGetSessionData, mockGetMSRoomById } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockGetMSRoomById: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/social/msRoomsDb', () => ({
  getMSRoomById: mockGetMSRoomById,
  isStageRoom: (room: { settings?: Record<string, unknown> }) => room.settings?.room_type === 'stage',
  getRoomSpeakerFids: (room: { speakers?: unknown[] }) =>
    Array.isArray(room.speakers) ? room.speakers.filter((s) => typeof s === 'number') : [],
}));

vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: {} }));
vi.mock('@/lib/db/audit-log', () => ({
  logAuditEvent: vi.fn(),
  getClientIp: vi.fn(() => '127.0.0.1'),
}));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

const ROOM_NAME = '11111111-1111-1111-1111-111111111111';
const stageRoom = (over: Record<string, unknown> = {}) => ({
  id: ROOM_NAME,
  host_fid: 123,
  settings: { room_type: 'stage' },
  speakers: [],
  ...over,
});

/** Speaker request for a stage room. roomId is passed too so authorized paths
 * mint the token without reaching the 100ms HTTP API. */
function speakerReq(fid: number) {
  return makePostRequest('/api/100ms/token', {
    userId: String(fid),
    role: 'speaker',
    roomName: ROOM_NAME,
    roomId: 'hms-room-abc',
  });
}

describe('100ms token route — stage authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_100MS_ACCESS_KEY = 'ak_test';
    process.env.HMS_APP_SECRET = 'secret_test';
    process.env.NEXT_PUBLIC_100MS_TEMPLATE_ID = 'tpl_test';
    mockGetMSRoomById.mockResolvedValue(stageRoom());
  });

  it('blocks a non-host, non-approved listener from minting a speaker token', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 999 }));
    const res = await POST(speakerReq(999));
    expect(res.status).toBe(403);
  });

  it('allows the host to speak', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    const res = await POST(speakerReq(123));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeTruthy();
  });

  it('allows an approved speaker (FID in speakers list)', async () => {
    mockGetMSRoomById.mockResolvedValue(stageRoom({ speakers: [999] }));
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 999 }));
    const res = await POST(speakerReq(999));
    expect(res.status).toBe(200);
  });

  it('does not gate a non-stage (open video) room', async () => {
    mockGetMSRoomById.mockResolvedValue(stageRoom({ settings: { room_type: 'video' } }));
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 999 }));
    const res = await POST(speakerReq(999));
    expect(res.status).toBe(200);
  });

  it('does not gate listeners', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 999 }));
    const res = await POST(
      makePostRequest('/api/100ms/token', {
        userId: '999',
        role: 'listener',
        roomName: ROOM_NAME,
        roomId: 'hms-room-abc',
      }),
    );
    expect(res.status).toBe(200);
  });
});
