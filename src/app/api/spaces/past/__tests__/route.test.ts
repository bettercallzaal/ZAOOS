// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockGetPastRooms = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/spaces/roomsDb', () => ({ getPastRooms: mockGetPastRooms }));

import { GET } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 1, username: 'zabal' };
const MOCK_ROOMS = [{ id: 'r1', name: 'ZAO Call', ended_at: '2026-07-01T00:00:00Z' }];

describe('GET /api/spaces/past', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makeGetRequest('/api/spaces/past');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns rooms with default 7-day window', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetPastRooms.mockResolvedValue(MOCK_ROOMS);
    const req = makeGetRequest('/api/spaces/past');
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.rooms).toHaveLength(1);
    expect(mockGetPastRooms).toHaveBeenCalledWith(7);
  });

  it('passes the days query param to getPastRooms', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetPastRooms.mockResolvedValue([]);
    const req = makeGetRequest('/api/spaces/past', { days: '30' });
    await GET(req);
    expect(mockGetPastRooms).toHaveBeenCalledWith(30);
  });

  it('uses default 7 days when days param is invalid', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetPastRooms.mockResolvedValue([]);
    const req = makeGetRequest('/api/spaces/past', { days: 'bad' });
    await GET(req);
    expect(mockGetPastRooms).toHaveBeenCalledWith(7);
  });
});
