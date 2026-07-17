// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockGetValidTwitchToken = vi.hoisted(() => vi.fn());
const mockGetTwitchStreamInfo = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/twitch/client', () => ({
  getValidTwitchToken: mockGetValidTwitchToken,
  getTwitchStreamInfo: mockGetTwitchStreamInfo,
}));

import { GET } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 77 };
const MOCK_CREDS = { accessToken: 'tok', userId: 'user-1' };

describe('GET /api/twitch/stream-info', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns isLive:false, connected:false when Twitch not linked', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetValidTwitchToken.mockResolvedValue(null);
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.isLive).toBe(false);
    expect(body.connected).toBe(false);
  });

  it('returns isLive:false, connected:true when stream is offline', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetValidTwitchToken.mockResolvedValue(MOCK_CREDS);
    mockGetTwitchStreamInfo.mockResolvedValue(null);
    const res = await GET();
    const body = await res.json();
    expect(body.isLive).toBe(false);
    expect(body.connected).toBe(true);
  });

  it('returns full stream info when live', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetValidTwitchToken.mockResolvedValue(MOCK_CREDS);
    mockGetTwitchStreamInfo.mockResolvedValue({
      viewerCount: 42,
      title: 'ZAO Stream',
      gameName: 'Music',
      startedAt: '2026-07-17T00:00:00Z',
    });
    const res = await GET();
    const body = await res.json();
    expect(body.isLive).toBe(true);
    expect(body.connected).toBe(true);
    expect(body.viewerCount).toBe(42);
    expect(body.title).toBe('ZAO Stream');
  });

  it('returns 500 when an unexpected error occurs', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetValidTwitchToken.mockRejectedValue(new Error('DB unavailable'));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
