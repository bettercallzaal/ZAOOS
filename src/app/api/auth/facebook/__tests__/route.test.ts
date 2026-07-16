import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

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

describe('GET /api/auth/facebook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const req = makeRequest('/api/auth/facebook');
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 500 when NEXT_PUBLIC_FACEBOOK_APP_ID is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_FACEBOOK_APP_ID', '');
    const req = makeRequest('/api/auth/facebook');
    const res = await GET(req);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Facebook app ID not configured');
  });

  it('returns 307 redirect with correct OAuth URL', async () => {
    const appId = 'test-app-id-123';
    const baseUrl = 'http://localhost:3000';
    vi.stubEnv('NEXT_PUBLIC_FACEBOOK_APP_ID', appId);
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', baseUrl);

    const req = makeRequest('/api/auth/facebook');
    const res = await GET(req);
    expect(res.status).toBe(307);

    const location = res.headers.get('location');
    expect(location).toBeDefined();
    if (!location) throw new Error('location should be defined');

    const url = new URL(location);
    expect(url.hostname).toBe('www.facebook.com');
    expect(url.pathname).toBe('/v19.0/dialog/oauth');
    expect(url.searchParams.get('client_id')).toBe(appId);
    expect(url.searchParams.get('redirect_uri')).toBe(`${baseUrl}/api/auth/facebook/callback`);
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toBe(
      'publish_video,pages_manage_posts,pages_read_engagement',
    );
    expect(url.searchParams.get('state')).toBe('123'); // session.fid from mockAuthenticatedSession
  });

  it('falls back to request.nextUrl.origin when NEXT_PUBLIC_BASE_URL is not set', async () => {
    const appId = 'test-app-id-456';
    vi.stubEnv('NEXT_PUBLIC_FACEBOOK_APP_ID', appId);
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', '');

    const req = makeRequest('/api/auth/facebook');
    const res = await GET(req);
    expect(res.status).toBe(307);

    const location = res.headers.get('location');
    if (!location) throw new Error('location should be defined');

    const url = new URL(location);
    // Should use the request origin (http://localhost:3000 in tests)
    expect(url.searchParams.get('redirect_uri')).toContain('/api/auth/facebook/callback');
  });

  it('uses session.fid as the state parameter', async () => {
    const customFid = 999;
    vi.stubEnv('NEXT_PUBLIC_FACEBOOK_APP_ID', 'app-id');
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: customFid }));

    const req = makeRequest('/api/auth/facebook');
    const res = await GET(req);
    const location = res.headers.get('location');
    if (!location) throw new Error('location should be defined');

    const url = new URL(location);

    expect(url.searchParams.get('state')).toBe('999');
  });

  it('includes all required OAuth parameters in the redirect URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_FACEBOOK_APP_ID', 'app-id-789');
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://example.com');

    const req = makeRequest('/api/auth/facebook');
    const res = await GET(req);
    const location = res.headers.get('location');
    if (!location) throw new Error('location should be defined');

    const url = new URL(location);

    // Verify all required parameters are present
    expect(url.searchParams.has('client_id')).toBe(true);
    expect(url.searchParams.has('redirect_uri')).toBe(true);
    expect(url.searchParams.has('response_type')).toBe(true);
    expect(url.searchParams.has('scope')).toBe(true);
    expect(url.searchParams.has('state')).toBe(true);
  });
});
