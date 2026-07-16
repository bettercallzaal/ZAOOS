import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockAuthenticatedSession, mockUnauthenticatedSession } from '@/test-utils/api-helpers';

const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

describe('GET /api/auth/twitch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear env to test missing config path
    delete process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID = 'test-client-id';
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 500 when Twitch client ID is not configured', async () => {
    // Ensure env var is unset
    process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID = '';
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Twitch client ID not configured');
  });

  it('redirects to Twitch OAuth authorize with correct parameters', async () => {
    const testClientId = 'test-client-id-12345';
    process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID = testClientId;
    const session = mockAuthenticatedSession({ fid: 42 });
    mockGetSessionData.mockResolvedValue(session);

    const res = await GET();

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toBeDefined();
    if (!location) throw new Error('location should be defined');

    const url = new URL(location);
    expect(url.hostname).toBe('id.twitch.tv');
    expect(url.pathname).toBe('/oauth2/authorize');
    expect(url.searchParams.get('client_id')).toBe(testClientId);
    expect(url.searchParams.get('redirect_uri')).toBe('https://zaoos.com/api/auth/twitch/callback');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('state')).toBe('42');

    // Verify scopes are included
    const scopes = url.searchParams.get('scope');
    expect(scopes).toContain('channel:read:stream_key');
    expect(scopes).toContain('channel:manage:broadcast');
    expect(scopes).toContain('chat:read');
    expect(scopes).toContain('chat:edit');
    expect(scopes).toContain('channel:manage:polls');
    expect(scopes).toContain('channel:manage:predictions');
    expect(scopes).toContain('clips:edit');
    expect(scopes).toContain('channel:read:subscriptions');
    expect(scopes).toContain('moderator:read:followers');
  });

  it('encodes the session FID as state parameter', async () => {
    process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID = 'test-client-id';
    const session = mockAuthenticatedSession({ fid: 999 });
    mockGetSessionData.mockResolvedValue(session);

    const res = await GET();

    const location = res.headers.get('location');
    if (!location) throw new Error('location should be defined');
    const url = new URL(location);
    expect(url.searchParams.get('state')).toBe('999');
  });

  it('uses the hardcoded redirect URI', async () => {
    process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID = 'test-client-id';
    const res = await GET();

    const location = res.headers.get('location');
    if (!location) throw new Error('location should be defined');
    const url = new URL(location);
    expect(url.searchParams.get('redirect_uri')).toBe('https://zaoos.com/api/auth/twitch/callback');
  });
});
