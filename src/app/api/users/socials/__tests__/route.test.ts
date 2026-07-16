import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chainMock, mockAuthenticatedSession } from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// ── Route imports ────────────────────────────────────────────────────────────
import { GET, PATCH } from '@/app/api/users/socials/route';

// ── Helper ───────────────────────────────────────────────────────────────────
function makePatchRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(new URL(path, 'http://localhost:3000'), {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// ── Test suite ───────────────────────────────────────────────────────────────

describe('GET /api/users/socials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when session.fid is undefined', async () => {
    mockGetSessionData.mockResolvedValue({ username: 'testuser' });

    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when session.fid is null', async () => {
    mockGetSessionData.mockResolvedValue({ fid: null, username: 'testuser' });

    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns socials when user is authenticated and has data', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const userData = {
      x_handle: 'testuser_x',
      instagram_handle: 'testuser_ig',
      soundcloud_url: 'https://soundcloud.com/testuser',
      spotify_url: 'https://open.spotify.com/artist/123',
      audius_handle: 'testuser_audius',
    };

    const { chain } = chainMock({ data: userData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(userData);
    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(chain.select).toHaveBeenCalledWith(
      'x_handle, instagram_handle, soundcloud_url, spotify_url, audius_handle',
    );
    expect(chain.eq).toHaveBeenCalledWith('fid', 123);
    expect(chain.eq).toHaveBeenCalledWith('is_active', true);
  });

  it('returns nulls when user has no social data', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const { chain } = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      x_handle: null,
      instagram_handle: null,
      soundcloud_url: null,
      spotify_url: null,
      audius_handle: null,
    });
  });

  it('returns 500 when Supabase query fails', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const { chain } = chainMock({ data: null, error: new Error('Database error') });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to load socials');
  });

  it('returns 500 when request.json() throws', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const { chain } = chainMock({ data: null, error: new Error('Parse error') });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to load socials');
  });
});

describe('PATCH /api/users/socials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makePatchRequest('/api/users/socials', {
      x_handle: 'newhandle',
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when session.fid is undefined', async () => {
    mockGetSessionData.mockResolvedValue({ username: 'testuser' });
    const req = makePatchRequest('/api/users/socials', {
      x_handle: 'newhandle',
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when body has no fields to update', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);
    const req = makePatchRequest('/api/users/socials', {});

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid data');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when x_handle exceeds max length', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);
    const req = makePatchRequest('/api/users/socials', {
      x_handle: 'a'.repeat(51),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid data');
  });

  it('returns 400 when instagram_handle exceeds max length', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);
    const req = makePatchRequest('/api/users/socials', {
      instagram_handle: 'a'.repeat(51),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid data');
  });

  it('returns 400 when soundcloud_url is not a valid URL', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);
    const req = makePatchRequest('/api/users/socials', {
      soundcloud_url: 'not-a-url',
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid data');
  });

  it('returns 400 when spotify_url is not a valid URL', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);
    const req = makePatchRequest('/api/users/socials', {
      spotify_url: 'invalid-url',
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid data');
  });

  it('accepts empty string for soundcloud_url and transforms to null', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);
    const req = makePatchRequest('/api/users/socials', {
      soundcloud_url: '',
    });

    const { chain } = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(chain.update).toHaveBeenCalledWith({ soundcloud_url: null });
  });

  it('accepts empty string for spotify_url and transforms to null', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);
    const req = makePatchRequest('/api/users/socials', {
      spotify_url: '',
    });

    const { chain } = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(chain.update).toHaveBeenCalledWith({ spotify_url: null });
  });

  it('returns 400 when soundcloud_url exceeds max length', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);
    const longUrl = `https://soundcloud.com/${'a'.repeat(200)}`;
    const req = makePatchRequest('/api/users/socials', {
      soundcloud_url: longUrl,
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid data');
  });

  it('returns 400 when spotify_url exceeds max length', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);
    const longUrl = `https://open.spotify.com/artist/${'a'.repeat(200)}`;
    const req = makePatchRequest('/api/users/socials', {
      spotify_url: longUrl,
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid data');
  });

  it('returns 400 when audius_handle exceeds max length', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);
    const req = makePatchRequest('/api/users/socials', {
      audius_handle: 'a'.repeat(51),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid data');
  });

  it('updates single social handle successfully', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);
    const req = makePatchRequest('/api/users/socials', {
      x_handle: 'newhandle',
    });

    const { chain } = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(chain.update).toHaveBeenCalledWith({ x_handle: 'newhandle' });
    expect(chain.eq).toHaveBeenCalledWith('fid', 123);
  });

  it('updates multiple social handles successfully', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);
    const req = makePatchRequest('/api/users/socials', {
      x_handle: 'twitter_handle',
      instagram_handle: 'insta_handle',
      audius_handle: 'audius_user',
    });

    const { chain } = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(chain.update).toHaveBeenCalledWith({
      x_handle: 'twitter_handle',
      instagram_handle: 'insta_handle',
      audius_handle: 'audius_user',
    });
  });

  it('trims whitespace from handles', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);
    const req = makePatchRequest('/api/users/socials', {
      x_handle: '  trimmed_handle  ',
    });

    const { chain } = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(chain.update).toHaveBeenCalledWith({ x_handle: 'trimmed_handle' });
  });

  it('accepts null values for handles', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);
    const req = makePatchRequest('/api/users/socials', {
      x_handle: null,
    });

    const { chain } = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(chain.update).toHaveBeenCalledWith({ x_handle: null });
  });

  it('accepts valid URLs for soundcloud and spotify', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);
    const req = makePatchRequest('/api/users/socials', {
      soundcloud_url: 'https://soundcloud.com/artist/track',
      spotify_url: 'https://open.spotify.com/artist/abc123',
    });

    const { chain } = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(chain.update).toHaveBeenCalledWith({
      soundcloud_url: 'https://soundcloud.com/artist/track',
      spotify_url: 'https://open.spotify.com/artist/abc123',
    });
  });

  it('returns 500 when Supabase update fails', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);
    const req = makePatchRequest('/api/users/socials', {
      x_handle: 'newhandle',
    });

    const { chain } = chainMock({ data: null, error: new Error('Update failed') });
    mockFrom.mockReturnValue(chain);

    const res = await PATCH(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to update socials');
  });

  it('returns 400 when request.json() returns null', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const mockReq = {
      json: vi.fn().mockRejectedValue(new Error('JSON parse error')),
    } as unknown as Request;

    const res = await PATCH(mockReq);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid data');
  });
});
