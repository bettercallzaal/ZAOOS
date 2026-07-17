// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockStartSession = vi.hoisted(() => vi.fn());
const mockEndSessionByFid = vi.hoisted(() => vi.fn());
const mockUpdateLastActive = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/spaces/sessionsDb', () => ({
  startSession: mockStartSession,
  endSessionByFid: mockEndSessionByFid,
}));
vi.mock('@/lib/spaces/roomsDb', () => ({ updateLastActive: mockUpdateLastActive }));

import { PATCH, POST } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 10 };
const VALID_ROOM = {
  roomId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  roomName: 'ZAO Stage',
  roomType: 'stage' as const,
};

describe('POST /api/spaces/session', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makePostRequest('/api/spaces/session', VALID_ROOM);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid room payload', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/spaces/session', { roomId: 'not-a-uuid' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns sessionId on success', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockStartSession.mockResolvedValue('sess-uuid-123');
    mockUpdateLastActive.mockResolvedValue(undefined);
    const req = makePostRequest('/api/spaces/session', VALID_ROOM);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.sessionId).toBe('sess-uuid-123');
  });

  it('returns 500 when startSession rejects', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockStartSession.mockRejectedValue(new Error('DB error'));
    mockUpdateLastActive.mockResolvedValue(undefined);
    const req = makePostRequest('/api/spaces/session', VALID_ROOM);
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

describe('PATCH /api/spaces/session', () => {
  const makeRequest = (body: object) =>
    new NextRequest(new URL('/api/spaces/session', 'http://localhost:3000'), {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await PATCH(makeRequest({ roomId: VALID_ROOM.roomId }) as Parameters<typeof PATCH>[0]);
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing roomId', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const res = await PATCH(makeRequest({}) as Parameters<typeof PATCH>[0]);
    expect(res.status).toBe(400);
  });

  it('returns ok:true after leaving a room', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockEndSessionByFid.mockResolvedValue(undefined);
    mockUpdateLastActive.mockResolvedValue(undefined);
    const res = await PATCH(makeRequest({ roomId: VALID_ROOM.roomId }) as Parameters<typeof PATCH>[0]);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });
});
