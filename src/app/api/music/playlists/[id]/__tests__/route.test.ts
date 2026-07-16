import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makeRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_UUID,
} from '@/test-utils/api-helpers';

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
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

type RouteContext = { params: Promise<{ id: string }> };

const ctx: RouteContext = { params: Promise.resolve({ id: VALID_UUID }) };

const PLAYLIST = {
  id: VALID_UUID,
  name: 'ZAO Vibes',
  description: 'A collaborative playlist',
  created_by_fid: 123,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const SONG_1 = {
  id: 'song-1',
  title: 'Track One',
  artist: 'Artist A',
  uri: 'spotify:track:123abc',
};

const SONG_2 = {
  id: 'song-2',
  title: 'Track Two',
  artist: 'Artist B',
  uri: 'spotify:track:456def',
};

const TRACK_1 = {
  id: 'playlist-track-1',
  playlist_id: VALID_UUID,
  position: 1,
  added_at: '2026-01-01T10:00:00Z',
  songs: SONG_1,
};

const TRACK_2 = {
  id: 'playlist-track-2',
  playlist_id: VALID_UUID,
  position: 2,
  added_at: '2026-01-01T11:00:00Z',
  songs: SONG_2,
};

describe('GET /api/music/playlists/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeRequest('/x'), ctx);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('fetches playlist and tracks successfully', async () => {
    const playlistMock = chainMock({ data: PLAYLIST, error: null });
    const tracksMock = chainMock({ data: [TRACK_1, TRACK_2], error: null });

    mockFrom.mockReturnValueOnce(playlistMock.chain).mockReturnValueOnce(tracksMock.chain);

    const res = await GET(makeRequest('/x'), ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.playlist).toEqual(PLAYLIST);
    expect(body.tracks).toHaveLength(2);
    expect(body.tracks[0]).toEqual({
      ...SONG_1,
      position: 1,
      added_at: '2026-01-01T10:00:00Z',
    });
    expect(body.tracks[1]).toEqual({
      ...SONG_2,
      position: 2,
      added_at: '2026-01-01T11:00:00Z',
    });
  });

  it('returns 404 when playlist query has an error', async () => {
    const playlistMock = chainMock({ data: null, error: 'Not found' });
    const tracksMock = chainMock({ data: [], error: null });

    mockFrom.mockReturnValueOnce(playlistMock.chain).mockReturnValueOnce(tracksMock.chain);

    const res = await GET(makeRequest('/x'), ctx);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Playlist not found');
  });

  it('returns 500 when tracks query throws error', async () => {
    const playlistMock = chainMock({ data: PLAYLIST, error: null });
    const tracksMock = chainMock({ data: null, error: new Error('Database down') });

    mockFrom.mockReturnValueOnce(playlistMock.chain).mockReturnValueOnce(tracksMock.chain);

    const res = await GET(makeRequest('/x'), ctx);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to load playlist');
  });
});
