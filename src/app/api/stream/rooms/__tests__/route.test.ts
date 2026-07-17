// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockCreateRoom = vi.hoisted(() => vi.fn());
const mockGetValidTwitchToken = vi.hoisted(() => vi.fn());
const mockAutoCastToZao = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/spaces/roomsDb', () => ({ createRoom: mockCreateRoom }));
vi.mock('@/lib/twitch/client', () => ({
  getValidTwitchToken: mockGetValidTwitchToken,
  updateTwitchChannel: vi.fn(),
  TWITCH_CATEGORY_DJS: 'djs',
  TWITCH_CATEGORY_MUSIC: 'music',
}));
vi.mock('@/lib/publish/auto-cast', () => ({ autoCastToZao: mockAutoCastToZao }));

import { POST } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = {
  fid: 10,
  displayName: 'ZAO',
  username: 'zao',
  pfpUrl: 'https://pfp.url/zao.jpg',
};
const VALID_BODY = {
  title: 'ZAO Stage',
  streamCallId: 'call-abc123',
};

describe('POST /api/stream/rooms', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makePostRequest('/api/stream/rooms', VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing required fields', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/stream/rooms', { title: '' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 500 when createRoom throws', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockCreateRoom.mockRejectedValue(new Error('DB error'));
    mockGetValidTwitchToken.mockResolvedValue(null);
    const req = makePostRequest('/api/stream/rooms', VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('returns room data on success', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const mockRoom = { id: 'room-uuid-1', title: 'ZAO Stage', hostFid: 10 };
    mockCreateRoom.mockResolvedValue(mockRoom);
    mockGetValidTwitchToken.mockResolvedValue(null);
    mockAutoCastToZao.mockResolvedValue(undefined);
    const req = makePostRequest('/api/stream/rooms', VALID_BODY);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.room.id).toBe('room-uuid-1');
    expect(body.room.title).toBe('ZAO Stage');
  });
});
