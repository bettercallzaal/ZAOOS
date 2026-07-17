// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockGetValidTwitchToken = vi.hoisted(() => vi.fn());
const mockCreateTwitchMarker = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/twitch/client', () => ({
  getValidTwitchToken: mockGetValidTwitchToken,
  createTwitchMarker: mockCreateTwitchMarker,
}));

import { POST } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 10 };
const MOCK_CREDS = { accessToken: 'tok', userId: 'uid' };

describe('POST /api/twitch/marker', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makePostRequest('/api/twitch/marker', {});
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when Twitch is not connected', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetValidTwitchToken.mockResolvedValue(null);
    const req = makePostRequest('/api/twitch/marker', {});
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when marker creation fails (stream not live)', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetValidTwitchToken.mockResolvedValue(MOCK_CREDS);
    mockCreateTwitchMarker.mockResolvedValue(false);
    const req = makePostRequest('/api/twitch/marker', { description: 'test marker' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns success:true with marker data when creation succeeds', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetValidTwitchToken.mockResolvedValue(MOCK_CREDS);
    mockCreateTwitchMarker.mockResolvedValue(true);
    const req = makePostRequest('/api/twitch/marker', { description: 'ZAO highlight' });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.marker.description).toBe('ZAO highlight');
  });

  it('uses default description when none is provided', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetValidTwitchToken.mockResolvedValue(MOCK_CREDS);
    mockCreateTwitchMarker.mockResolvedValue(true);
    const req = makePostRequest('/api/twitch/marker', {});
    const res = await POST(req);
    const body = await res.json();
    expect(body.marker.description).toBe('ZAO OS marker');
  });
});
