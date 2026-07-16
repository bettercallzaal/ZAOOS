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

describe('GET /api/auth/youtube', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear env overrides from previous tests
    delete process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID;
    delete process.env.NEXT_PUBLIC_BASE_URL;
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const req = makeRequest('/api/auth/youtube');
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 500 when NEXT_PUBLIC_YOUTUBE_CLIENT_ID is not configured', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    const req = makeRequest('/api/auth/youtube');
    const res = await GET(req);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('YouTube client ID not configured');
  });

  it('redirects to Google OAuth with correct parameters', async () => {
    process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
    process.env.NEXT_PUBLIC_BASE_URL = 'https://app.example.com';
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

    const req = makeRequest('/api/auth/youtube');
    const res = await GET(req);

    expect(res.status).toBe(307); // redirect status
    const location = res.headers.get('location');
    expect(location).toBeDefined();
    expect(location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(location).toContain('client_id=test-client-id.apps.googleusercontent.com');
    expect(location).toContain(
      'redirect_uri=https%3A%2F%2Fapp.example.com%2Fapi%2Fauth%2Fyoutube%2Fcallback',
    );
    expect(location).toContain('response_type=code');
    expect(location).toContain('scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube');
    expect(location).toContain('access_type=offline');
    expect(location).toContain('prompt=consent');
    expect(location).toContain('state=456');
  });

  it('uses request origin when NEXT_PUBLIC_BASE_URL is not set', async () => {
    process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const req = makeRequest('http://localhost:3000/api/auth/youtube');
    const res = await GET(req);

    const location = res.headers.get('location');
    expect(location).toBeDefined();
    expect(location).toContain(
      'redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fyoutube%2Fcallback',
    );
  });

  it('includes both YouTube scopes in the OAuth request', async () => {
    process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const req = makeRequest('/api/auth/youtube');
    const res = await GET(req);

    const location = res.headers.get('location');
    expect(location).toContain('https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube');
    expect(location).toContain('https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube.force-ssl');
  });

  it('sets state parameter to session fid', async () => {
    process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 789 }));

    const req = makeRequest('/api/auth/youtube');
    const res = await GET(req);

    const location = res.headers.get('location');
    expect(location).toContain('state=789');
  });

  it('constructs valid redirect_uri with callback path', async () => {
    process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
    process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com';
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const req = makeRequest('/api/auth/youtube');
    const res = await GET(req);

    const location = res.headers.get('location');
    expect(location).toContain(
      'redirect_uri=https%3A%2F%2Fexample.com%2Fapi%2Fauth%2Fyoutube%2Fcallback',
    );
  });

  it('returns a proper NextResponse.redirect', async () => {
    process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const req = makeRequest('/api/auth/youtube');
    const res = await GET(req);

    // NextResponse.redirect sets status 307
    expect(res.status).toBe(307);
    // Location header is set
    expect(res.headers.has('location')).toBe(true);
  });
});
