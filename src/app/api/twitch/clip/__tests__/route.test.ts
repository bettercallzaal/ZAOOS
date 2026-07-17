// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockGetValidTwitchToken = vi.hoisted(() => vi.fn());
const mockCreateTwitchClip = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/twitch/client', () => ({
  getValidTwitchToken: mockGetValidTwitchToken,
  createTwitchClip: mockCreateTwitchClip,
}));

import { POST } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 99 };
const MOCK_CREDS = { accessToken: 'twitch-token', userId: 'streamer-id' };
const MOCK_CLIP = { id: 'clip-xyz', editUrl: 'https://clips.twitch.tv/clip-xyz/edit' };

describe('POST /api/twitch/clip', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it('returns 400 when Twitch is not connected (no creds)', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetValidTwitchToken.mockResolvedValue(null);
    const res = await POST();
    expect(res.status).toBe(400);
  });

  it('returns 500 when clip creation returns null (stream not live)', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetValidTwitchToken.mockResolvedValue(MOCK_CREDS);
    mockCreateTwitchClip.mockResolvedValue(null);
    const res = await POST();
    expect(res.status).toBe(500);
  });

  it('returns clipId and editUrl on success', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetValidTwitchToken.mockResolvedValue(MOCK_CREDS);
    mockCreateTwitchClip.mockResolvedValue(MOCK_CLIP);
    const res = await POST();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.clipId).toBe('clip-xyz');
    expect(body.editUrl).toContain('clip-xyz');
  });
});
