// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

// ---------------------------------------------------------------------------
// Hoisted mocks — declared before any imports
// ---------------------------------------------------------------------------

const {
  mockGetSessionData,
  mockGetUserByFid,
  mockGetMSRoomById,
  mockGetRoomSpeakerFids,
  mockIsStageRoom,
  mockCheckTokenGate,
  mockSetMSRoom100msId,
  mockLogAuditEvent,
  mockJwtSign,
} = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockGetUserByFid: vi.fn(),
  mockGetMSRoomById: vi.fn(),
  mockGetRoomSpeakerFids: vi.fn(),
  mockIsStageRoom: vi.fn(),
  mockCheckTokenGate: vi.fn(),
  mockSetMSRoom100msId: vi.fn(),
  mockLogAuditEvent: vi.fn(),
  mockJwtSign: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getUserByFid: (fid: number) => mockGetUserByFid(fid),
}));

vi.mock('@/lib/social/msRoomsDb', () => ({
  getMSRoomById: (id: string) => mockGetMSRoomById(id),
  getRoomSpeakerFids: (room: unknown) => mockGetRoomSpeakerFids(room),
  isStageRoom: (room: unknown) => mockIsStageRoom(room),
  setMSRoom100msId: (id: string, hmsId: string) => mockSetMSRoom100msId(id, hmsId),
}));

vi.mock('@/lib/spaces/tokenGate', () => ({
  checkTokenGate: (wallet: string, gate: unknown) => mockCheckTokenGate(wallet, gate),
}));

vi.mock('@/lib/db/audit-log', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
  logAuditEvent: (...args: unknown[]) => mockLogAuditEvent(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('jsonwebtoken', () => ({
  default: { sign: (...args: unknown[]) => mockJwtSign(...args) },
}));

// ---------------------------------------------------------------------------
// Global fetch mock for 100ms API calls
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { POST } from '../route';

// ---------------------------------------------------------------------------
// Test fixture helpers
// ---------------------------------------------------------------------------

function makeBody(overrides?: Record<string, unknown>) {
  return {
    userId: '123',
    role: 'listener',
    ...overrides,
  };
}

const HMS_ROOM_ID = 'hms-room-abc';

function mockHmsFetch() {
  // First call: list rooms (returns empty)
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: [] }),
  });
  // Second call: create room
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ id: HMS_ROOM_ID }),
  });
}

const ENV = {
  NEXT_PUBLIC_100MS_ACCESS_KEY: 'key_test',
  HMS_APP_SECRET: 'secret_test',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/100ms/token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_100MS_ACCESS_KEY = ENV.NEXT_PUBLIC_100MS_ACCESS_KEY;
    process.env.HMS_APP_SECRET = ENV.HMS_APP_SECRET;

    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockGetMSRoomById.mockResolvedValue(null);
    mockGetUserByFid.mockResolvedValue(null);
    mockJwtSign.mockReturnValue('signed.jwt.token');
    mockSetMSRoom100msId.mockResolvedValue(undefined);
    mockHmsFetch();
  });

  // ── auth guard ────────────────────────────────────────────────────────────

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const req = makePostRequest('/api/100ms/token', makeBody());
      const res = await POST(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toMatchObject({ error: 'Unauthorized' });
    });

    it('returns 401 when session has no fid', async () => {
      mockGetSessionData.mockResolvedValue({ fid: null });
      const req = makePostRequest('/api/100ms/token', makeBody());
      const res = await POST(req);
      expect(res.status).toBe(401);
    });
  });

  // ── env-var guard ─────────────────────────────────────────────────────────

  describe('configuration', () => {
    it('returns 500 when 100ms access key is missing', async () => {
      delete process.env.NEXT_PUBLIC_100MS_ACCESS_KEY;
      const req = makePostRequest('/api/100ms/token', makeBody());
      const res = await POST(req);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toMatchObject({ error: expect.stringContaining('configuration') });
    });

    it('returns 500 when HMS_APP_SECRET is missing', async () => {
      delete process.env.HMS_APP_SECRET;
      const req = makePostRequest('/api/100ms/token', makeBody());
      const res = await POST(req);
      expect(res.status).toBe(500);
    });
  });

  // ── input validation ──────────────────────────────────────────────────────

  describe('validation', () => {
    it('returns 400 when userId is missing', async () => {
      const req = makePostRequest('/api/100ms/token', { role: 'listener' });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toMatchObject({ error: 'Invalid input' });
    });

    it('returns 400 when role is missing', async () => {
      const req = makePostRequest('/api/100ms/token', { userId: '123' });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  // ── FID ownership ─────────────────────────────────────────────────────────

  describe('FID ownership', () => {
    it('returns 403 when userId does not match session FID', async () => {
      const req = makePostRequest('/api/100ms/token', makeBody({ userId: '999' }));
      const res = await POST(req);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toMatch(/cannot generate token for another user/);
    });

    it('allows token mint when userId matches session FID', async () => {
      const req = makePostRequest('/api/100ms/token', makeBody({ userId: '123' }));
      const res = await POST(req);
      expect(res.status).toBe(200);
    });
  });

  // ── role validation ───────────────────────────────────────────────────────

  describe('role validation', () => {
    it('returns 403 when non-admin non-host requests host role', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, isAdmin: false }),
      );
      const req = makePostRequest('/api/100ms/token', makeBody({ role: 'host' }));
      const res = await POST(req);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toMatch(/admin/i);
    });

    it('returns 403 when non-admin non-host requests moderator role', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, isAdmin: false }),
      );
      const req = makePostRequest('/api/100ms/token', makeBody({ role: 'moderator' }));
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it('allows host role for admin users', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
      const req = makePostRequest('/api/100ms/token', makeBody({ role: 'host' }));
      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it('allows host role for the room host', async () => {
      mockGetMSRoomById.mockResolvedValue({ id: 'room-1', host_fid: 123, title: 'Test Room' });
      const req = makePostRequest('/api/100ms/token', makeBody({ role: 'host', roomName: 'room-1' }));
      const res = await POST(req);
      expect(res.status).toBe(200);
    });
  });

  // ── stage speaker auth ────────────────────────────────────────────────────

  describe('stage speaker authorization', () => {
    beforeEach(() => {
      mockGetMSRoomById.mockResolvedValue({
        id: 'stage-room',
        host_fid: 999,
        title: 'Stage',
        settings: {},
      });
      mockIsStageRoom.mockReturnValue(true);
    });

    it('returns 403 when user is not an approved speaker', async () => {
      mockGetRoomSpeakerFids.mockReturnValue([456, 789]);
      const req = makePostRequest('/api/100ms/token', makeBody({ role: 'speaker', roomName: 'stage-room' }));
      const res = await POST(req);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toMatch(/speak/i);
    });

    it('allows speaker role for an approved speaker', async () => {
      mockGetRoomSpeakerFids.mockReturnValue([123, 456]);
      const req = makePostRequest('/api/100ms/token', makeBody({ role: 'speaker', roomName: 'stage-room' }));
      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it('allows speaker role for the stage host', async () => {
      mockGetMSRoomById.mockResolvedValue({
        id: 'stage-room',
        host_fid: 123, // same as session FID
        title: 'Stage',
        settings: {},
      });
      mockGetRoomSpeakerFids.mockReturnValue([]);
      const req = makePostRequest('/api/100ms/token', makeBody({ role: 'speaker', roomName: 'stage-room' }));
      const res = await POST(req);
      expect(res.status).toBe(200);
    });
  });

  // ── token gate ────────────────────────────────────────────────────────────

  describe('token gate', () => {
    const gatedRoom = {
      id: 'gated-room',
      host_fid: 999,
      title: 'Gated Room',
      settings: { gate_config: { type: 'erc20', contractAddress: '0xabc', minBalance: '100' } },
    };

    beforeEach(() => {
      mockGetMSRoomById.mockResolvedValue(gatedRoom);
      mockIsStageRoom.mockReturnValue(false);
      mockGetUserByFid.mockResolvedValue({
        verified_addresses: { eth_addresses: ['0xwallet1'] },
        custody_address: '0xcustody',
      });
    });

    it('returns 403 when user holds no wallets', async () => {
      mockGetUserByFid.mockResolvedValue({ verified_addresses: { eth_addresses: [] }, custody_address: null });
      const req = makePostRequest('/api/100ms/token', makeBody({ role: 'listener', roomName: 'gated-room' }));
      const res = await POST(req);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toMatch(/connect/i);
    });

    it('returns 403 when none of the user wallets pass the gate', async () => {
      mockCheckTokenGate.mockResolvedValue({ allowed: false });
      const req = makePostRequest('/api/100ms/token', makeBody({ role: 'listener', roomName: 'gated-room' }));
      const res = await POST(req);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toMatch(/token not held/i);
    });

    it('allows entry when at least one wallet passes the gate', async () => {
      mockCheckTokenGate
        .mockResolvedValueOnce({ allowed: false })
        .mockResolvedValueOnce({ allowed: true });
      const req = makePostRequest('/api/100ms/token', makeBody({ role: 'listener', roomName: 'gated-room' }));
      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it('allows admins to bypass the token gate', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
      const req = makePostRequest('/api/100ms/token', makeBody({ role: 'listener', roomName: 'gated-room' }));
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockCheckTokenGate).not.toHaveBeenCalled();
    });

    it('allows the room host to bypass the token gate', async () => {
      mockGetMSRoomById.mockResolvedValue({ ...gatedRoom, host_fid: 123 });
      const req = makePostRequest('/api/100ms/token', makeBody({ role: 'listener', roomName: 'gated-room' }));
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockCheckTokenGate).not.toHaveBeenCalled();
    });
  });

  // ── success ───────────────────────────────────────────────────────────────

  describe('success', () => {
    it('returns 200 with a JWT token and roomId', async () => {
      const req = makePostRequest('/api/100ms/token', makeBody());
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({ token: 'signed.jwt.token', roomId: HMS_ROOM_ID });
    });

    it('uses the existing roomId when provided in the request body', async () => {
      const req = makePostRequest('/api/100ms/token', makeBody({ roomId: 'existing-room-id' }));
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.roomId).toBe('existing-room-id');
    });

    it('calls logAuditEvent after minting a token', async () => {
      const req = makePostRequest('/api/100ms/token', makeBody());
      await POST(req);
      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: '100ms.token.generate' }),
      );
    });

    it('signs the management token with HS256 and the app secret', async () => {
      const req = makePostRequest('/api/100ms/token', makeBody());
      await POST(req);
      expect(mockJwtSign).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'management' }),
        ENV.HMS_APP_SECRET,
        expect.objectContaining({ algorithm: 'HS256' }),
      );
    });

    it('signs the app token with the user id and role', async () => {
      const req = makePostRequest('/api/100ms/token', makeBody({ role: 'listener', userId: '123' }));
      await POST(req);
      expect(mockJwtSign).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: '123', role: 'listener', type: 'app' }),
        ENV.HMS_APP_SECRET,
        expect.objectContaining({ algorithm: 'HS256' }),
      );
    });
  });
});
