import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest, mockAuthenticatedSession } from '@/test-utils/api-helpers';

const { mockGetSessionData, mockGetMSRoomById, mockCheckTokenGate, mockGetUserByFid } = vi.hoisted(
  () => ({
    mockGetSessionData: vi.fn(),
    mockGetMSRoomById: vi.fn(),
    mockCheckTokenGate: vi.fn(),
    mockGetUserByFid: vi.fn(),
  }),
);

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/social/msRoomsDb', () => ({
  getMSRoomById: mockGetMSRoomById,
  isStageRoom: (room: { settings?: Record<string, unknown> }) =>
    room.settings?.room_type === 'stage',
  getRoomSpeakerFids: (room: { speakers?: unknown[] }) =>
    Array.isArray(room.speakers) ? room.speakers.filter((s) => typeof s === 'number') : [],
  setMSRoom100msId: vi.fn(),
}));

vi.mock('@/lib/spaces/tokenGate', () => ({ checkTokenGate: mockCheckTokenGate }));
vi.mock('@/lib/farcaster/neynar', () => ({ getUserByFid: mockGetUserByFid }));

vi.mock('@/lib/db/audit-log', () => ({
  logAuditEvent: vi.fn(),
  getClientIp: vi.fn(() => '127.0.0.1'),
}));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

const ROOM_NAME = '22222222-2222-2222-2222-222222222222';
const GATE = { type: 'erc721', contractAddress: '0xabc', chainId: 8453 };

const gatedRoom = (over: Record<string, unknown> = {}) => ({
  id: ROOM_NAME,
  host_fid: 123,
  title: 'Gated Room',
  settings: { room_type: 'video', gate_config: GATE },
  speakers: [],
  ...over,
});

function listenerReq(fid: number) {
  return makePostRequest('/api/100ms/token', {
    userId: String(fid),
    role: 'listener',
    roomName: ROOM_NAME,
    roomId: 'hms-room-abc',
  });
}

describe('100ms token route — token gate enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_100MS_ACCESS_KEY = 'ak_test';
    process.env.HMS_APP_SECRET = 'secret_test';
    process.env.NEXT_PUBLIC_100MS_TEMPLATE_ID = 'tpl_test';
    mockGetMSRoomById.mockResolvedValue(gatedRoom());
    mockGetUserByFid.mockResolvedValue({
      verified_addresses: { eth_addresses: ['0xWALLET'] },
      custody_address: '0xCUSTODY',
    });
  });

  it('blocks a listener who does not hold the gate token', async () => {
    mockGetSessionData.mockResolvedValue(
      mockAuthenticatedSession({ fid: 999, walletAddress: '0xWALLET' }),
    );
    mockCheckTokenGate.mockResolvedValue({ allowed: false, balance: '0' });
    const res = await POST(listenerReq(999));
    expect(res.status).toBe(403);
    expect(mockCheckTokenGate).toHaveBeenCalled();
  });

  it('allows a listener who holds the gate token in any wallet', async () => {
    mockGetSessionData.mockResolvedValue(
      mockAuthenticatedSession({ fid: 999, walletAddress: '0xWALLET' }),
    );
    mockCheckTokenGate.mockResolvedValue({ allowed: true, balance: '1' });
    const res = await POST(listenerReq(999));
    expect(res.status).toBe(200);
  });

  it('lets the room host bypass the gate', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    const res = await POST(listenerReq(123));
    expect(res.status).toBe(200);
    expect(mockCheckTokenGate).not.toHaveBeenCalled();
  });

  it('lets a global admin bypass the gate', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 999, isAdmin: true }));
    const res = await POST(listenerReq(999));
    expect(res.status).toBe(200);
    expect(mockCheckTokenGate).not.toHaveBeenCalled();
  });

  it('blocks a gated listener with no resolvable wallet', async () => {
    mockGetSessionData.mockResolvedValue(
      mockAuthenticatedSession({ fid: 999, walletAddress: null }),
    );
    mockGetUserByFid.mockResolvedValue({ verified_addresses: { eth_addresses: [] } });
    const res = await POST(listenerReq(999));
    expect(res.status).toBe(403);
    expect(mockCheckTokenGate).not.toHaveBeenCalled();
  });

  it('does not gate an ungated room', async () => {
    mockGetMSRoomById.mockResolvedValue(gatedRoom({ settings: { room_type: 'video' } }));
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 999 }));
    const res = await POST(listenerReq(999));
    expect(res.status).toBe(200);
    expect(mockCheckTokenGate).not.toHaveBeenCalled();
  });
});
