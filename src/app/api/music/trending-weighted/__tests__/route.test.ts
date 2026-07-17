// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { chainMock } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

const mockCurationWeight = vi.hoisted(() => vi.fn().mockReturnValue(1));
vi.mock('@/lib/music/curationWeight', () => ({ curationWeight: mockCurationWeight }));

const mockFrom = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { GET } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_LIKES = [
  {
    user_fid: 1,
    song_id: 'song-1',
    created_at: '2026-07-01T00:00:00Z',
    songs: {
      id: 'song-1',
      url: 'https://music.example.com/1',
      title: 'ZAO Track',
      artist: 'ZAO',
      artwork_url: null,
      platform: 'spotify',
    },
  },
];
const MOCK_MEMBERS = [{ fid: 1, total_respect: 100, name: 'ZAO Member' }];

describe('GET /api/music/trending-weighted', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns tracks:[] when no likes exist in the last 30 days', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1 });
    mockFrom.mockReturnValueOnce(chainMock({ data: [], error: null }).chain);
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.tracks).toHaveLength(0);
  });

  it('returns 500 when likes query returns an error', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1 });
    mockFrom.mockReturnValueOnce(chainMock({ data: null, error: { message: 'DB fail' } }).chain);
    const res = await GET();
    expect(res.status).toBe(500);
  });

  it('returns weighted tracks when likes and respect members are present', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1 });
    mockFrom
      .mockReturnValueOnce(chainMock({ data: MOCK_LIKES, error: null }).chain) // user_song_likes
      .mockReturnValueOnce(chainMock({ data: MOCK_MEMBERS, error: null }).chain); // respect_members
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.tracks).toHaveLength(1);
    expect(body.tracks[0].song.title).toBe('ZAO Track');
    expect(body.tracks[0].likeCount).toBe(1);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetSessionData.mockRejectedValue(new Error('unexpected failure'));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
