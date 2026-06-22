import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockGetSession } = vi.hoisted(() => ({ mockGetSession: vi.fn() }));
vi.mock('@/lib/auth/session', () => ({ getSessionData: () => mockGetSession() }));

import { GET } from '@/app/api/music/metadata/route';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const SPOTIFY = 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC';
const req = (u?: string) =>
  new NextRequest(`http://localhost:3000/api/music/metadata${u ? `?url=${encodeURIComponent(u)}` : ''}`);

describe('GET /api/music/metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ fid: 1 });
  });

  it('401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await GET(req(SPOTIFY));
    expect(res.status).toBe(401);
  });

  it('400 when the url param is missing', async () => {
    const res = await GET(req());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Missing url param');
  });

  it('400 when the url is not a recognized music URL', async () => {
    const res = await GET(req('https://example.com/not-music'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Not a music URL');
  });

  it('returns metadata for a valid Spotify URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ title: 'Song X', author_name: 'Artist Y', thumbnail_url: 'http://img' }),
    });
    const res = await GET(req(SPOTIFY));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.type).toBe('spotify');
    expect(body.trackName).toBe('Song X');
    expect(body.artistName).toBe('Artist Y');
    expect(res.headers.get('Cache-Control')).toContain('max-age=3600');
  });

  it('404 when the provider returns a non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    const res = await GET(req(SPOTIFY));
    expect(res.status).toBe(404);
  });

  it('500 when the provider fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('network down'));
    const res = await GET(req(SPOTIFY));
    expect(res.status).toBe(500);
  });
});
