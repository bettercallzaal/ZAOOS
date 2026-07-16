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

import { DELETE, GET, PATCH } from '../route';

type RouteContext = { params: Promise<{ id: string }> };

const ctx: RouteContext = { params: Promise.resolve({ id: VALID_UUID }) };

const OWNER_FID = 123;
const OTHER_FID = 999;

const PLAYLIST = {
  id: VALID_UUID,
  name: 'ZAO Vibes',
  description: 'Collaborative playlist',
  created_by_fid: OWNER_FID,
  updated_at: '2026-01-01T00:00:00Z',
};

const TRACK_1 = {
  id: 'track-1',
  playlist_id: VALID_UUID,
  votes: 5,
  position: 1,
};

const TRACK_2 = {
  id: 'track-2',
  playlist_id: VALID_UUID,
  votes: 3,
  position: 2,
};

const MEMBER_1 = {
  id: 'member-1',
  playlist_id: VALID_UUID,
  fid: OWNER_FID,
};

const MEMBER_2 = {
  id: 'member-2',
  playlist_id: VALID_UUID,
  fid: OTHER_FID,
};

const USER_VOTE_1 = {
  playlist_track_id: 'track-1',
  vote: 1,
};

const USER_VOTE_2 = {
  playlist_track_id: 'track-2',
  vote: -1,
};

describe('GET /api/music/playlists/collaborative/[id]', () => {
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

  it('fetches playlist, tracks, members, and user votes successfully', async () => {
    const playlistMock = chainMock({ data: PLAYLIST, error: null });
    const tracksMock = chainMock({ data: [TRACK_1, TRACK_2], error: null });
    const membersMock = chainMock({ data: [MEMBER_1, MEMBER_2], error: null });
    const votesMock = chainMock({ data: [USER_VOTE_1, USER_VOTE_2], error: null });

    // Set up mockFrom to return different chains for each table
    mockFrom
      .mockReturnValueOnce(playlistMock.chain)
      .mockReturnValueOnce(tracksMock.chain)
      .mockReturnValueOnce(membersMock.chain)
      .mockReturnValueOnce(votesMock.chain);

    const res = await GET(makeRequest('/x'), ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.playlist).toEqual(PLAYLIST);
    expect(body.members).toEqual([MEMBER_1, MEMBER_2]);
    expect(body.tracks).toHaveLength(2);
    expect(body.tracks[0]).toEqual({ ...TRACK_1, user_vote: 1 });
    expect(body.tracks[1]).toEqual({ ...TRACK_2, user_vote: -1 });
  });

  it('returns 404 when playlist query has an error', async () => {
    const playlistChain: Record<string, ReturnType<typeof vi.fn>> = {};
    const chainable = [
      'select',
      'eq',
      'order',
      'limit',
      'single',
      'insert',
      'update',
      'delete',
      'neq',
      'in',
      'not',
      'is',
      'gt',
      'gte',
      'lt',
      'lte',
      'like',
      'ilike',
      'range',
      'upsert',
      'maybeSingle',
    ];
    for (const method of chainable) {
      playlistChain[method] = vi.fn().mockReturnValue(playlistChain);
    }
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable
    playlistChain.then = vi.fn((resolve: (val: unknown) => void) =>
      resolve({ data: null, error: 'Not found' }),
    );
    playlistChain.single = vi.fn().mockResolvedValue({ data: null, error: 'Not found' });

    const tracksMock = chainMock({ data: [], error: null });
    const membersMock = chainMock({ data: [], error: null });
    const votesMock = chainMock({ data: [], error: null });

    mockFrom
      .mockReturnValueOnce(playlistChain)
      .mockReturnValueOnce(tracksMock.chain)
      .mockReturnValueOnce(membersMock.chain)
      .mockReturnValueOnce(votesMock.chain);

    const res = await GET(makeRequest('/x'), ctx);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Playlist not found');
  });

  it('handles missing tracks gracefully', async () => {
    const playlistMock = chainMock({ data: PLAYLIST, error: null });
    const tracksMock = chainMock({ data: null, error: null });
    const membersMock = chainMock({ data: [MEMBER_1], error: null });
    const votesMock = chainMock({ data: [], error: null });

    mockFrom
      .mockReturnValueOnce(playlistMock.chain)
      .mockReturnValueOnce(tracksMock.chain)
      .mockReturnValueOnce(membersMock.chain)
      .mockReturnValueOnce(votesMock.chain);

    const res = await GET(makeRequest('/x'), ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.tracks).toEqual([]);
    expect(body.members).toEqual([MEMBER_1]);
  });

  it('filters user votes to only include tracks in the playlist', async () => {
    const tracksWithOneTrack = [TRACK_1];
    const allVotes = [
      USER_VOTE_1,
      USER_VOTE_2,
      { playlist_track_id: 'track-999', vote: 1 }, // Vote for a track not in this playlist
    ];

    const playlistMock = chainMock({ data: PLAYLIST, error: null });
    const tracksMock = chainMock({ data: tracksWithOneTrack, error: null });
    const membersMock = chainMock({ data: [MEMBER_1], error: null });
    const votesMock = chainMock({ data: allVotes, error: null });

    mockFrom
      .mockReturnValueOnce(playlistMock.chain)
      .mockReturnValueOnce(tracksMock.chain)
      .mockReturnValueOnce(membersMock.chain)
      .mockReturnValueOnce(votesMock.chain);

    const res = await GET(makeRequest('/x'), ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    // Only track-1 should have user_vote set
    expect(body.tracks[0].user_vote).toBe(1);
    expect(allVotes).toHaveLength(3); // Verify we had 3 votes in the raw data
  });

  it('returns 500 on unexpected error', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const res = await GET(makeRequest('/x'), ctx);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch playlist');
  });
});

describe('PATCH /api/music/playlists/collaborative/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: OWNER_FID }));
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const req = makeRequest('/x', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name' }),
    });
    const res = await PATCH(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 on invalid input', async () => {
    const req = makeRequest('/x', {
      method: 'PATCH',
      body: JSON.stringify({ name: '' }), // Empty string violates min(1)
    });
    const res = await PATCH(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when description exceeds max length', async () => {
    const req = makeRequest('/x', {
      method: 'PATCH',
      body: JSON.stringify({ description: 'x'.repeat(501) }),
    });
    const res = await PATCH(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid input');
  });

  it('returns 403 when user is not the owner', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: OTHER_FID }));

    const checkMock = chainMock({ data: PLAYLIST, error: null });
    mockFrom.mockReturnValueOnce(checkMock.chain);

    const req = makeRequest('/x', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Hijacked' }),
    });
    const res = await PATCH(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Only the owner can update this playlist');
  });

  it('returns 403 when playlist not found', async () => {
    const checkMock = chainMock({ data: null, error: null });
    mockFrom.mockReturnValueOnce(checkMock.chain);

    const req = makeRequest('/x', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name' }),
    });
    const res = await PATCH(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Only the owner can update this playlist');
  });

  it('updates name successfully', async () => {
    const checkMock = chainMock({ data: PLAYLIST, error: null });
    const updateMock = chainMock({
      data: { ...PLAYLIST, name: 'Updated Name', updated_at: '2026-01-02T00:00:00Z' },
      error: null,
    });

    mockFrom.mockReturnValueOnce(checkMock.chain).mockReturnValueOnce(updateMock.chain);

    const req = makeRequest('/x', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Name' }),
    });
    const res = await PATCH(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.playlist.name).toBe('Updated Name');
  });

  it('updates description successfully', async () => {
    const checkMock = chainMock({ data: PLAYLIST, error: null });
    const updateMock = chainMock({
      data: { ...PLAYLIST, description: 'Updated description', updated_at: '2026-01-02T00:00:00Z' },
      error: null,
    });

    mockFrom.mockReturnValueOnce(checkMock.chain).mockReturnValueOnce(updateMock.chain);

    const req = makeRequest('/x', {
      method: 'PATCH',
      body: JSON.stringify({ description: 'Updated description' }),
    });
    const res = await PATCH(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.playlist.description).toBe('Updated description');
  });

  it('updates both name and description together', async () => {
    const checkMock = chainMock({ data: PLAYLIST, error: null });
    const updateMock = chainMock({
      data: {
        ...PLAYLIST,
        name: 'New Name',
        description: 'New desc',
        updated_at: '2026-01-02T00:00:00Z',
      },
      error: null,
    });

    mockFrom.mockReturnValueOnce(checkMock.chain).mockReturnValueOnce(updateMock.chain);

    const req = makeRequest('/x', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name', description: 'New desc' }),
    });
    const res = await PATCH(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.playlist.name).toBe('New Name');
    expect(body.playlist.description).toBe('New desc');
  });

  it('returns 500 on update error', async () => {
    const checkMock = chainMock({ data: PLAYLIST, error: null });
    const updateMock = chainMock({
      data: null,
      error: 'Database error',
    });

    mockFrom.mockReturnValueOnce(checkMock.chain).mockReturnValueOnce(updateMock.chain);

    const req = makeRequest('/x', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name' }),
    });
    const res = await PATCH(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to update playlist');
  });

  it('returns 500 on unexpected error during check', async () => {
    mockFrom.mockImplementationOnce(() => {
      throw new Error('Connection failed');
    });

    const req = makeRequest('/x', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name' }),
    });
    const res = await PATCH(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to update playlist');
  });
});

describe('DELETE /api/music/playlists/collaborative/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: OWNER_FID }));
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await DELETE(makeRequest('/x', { method: 'DELETE' }), ctx);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 403 when user is not the owner', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: OTHER_FID }));

    const checkMock = chainMock({ data: PLAYLIST, error: null });
    mockFrom.mockReturnValueOnce(checkMock.chain);

    const res = await DELETE(makeRequest('/x', { method: 'DELETE' }), ctx);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Only the owner can delete this playlist');
  });

  it('returns 403 when playlist not found', async () => {
    const checkMock = chainMock({ data: null, error: null });
    mockFrom.mockReturnValueOnce(checkMock.chain);

    const res = await DELETE(makeRequest('/x', { method: 'DELETE' }), ctx);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Only the owner can delete this playlist');
  });

  it('deletes playlist successfully', async () => {
    const checkMock = chainMock({ data: PLAYLIST, error: null });
    const deleteMock = chainMock({ data: null, error: null });

    mockFrom.mockReturnValueOnce(checkMock.chain).mockReturnValueOnce(deleteMock.chain);

    const res = await DELETE(makeRequest('/x', { method: 'DELETE' }), ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 500 on delete error', async () => {
    const checkMock = chainMock({ data: PLAYLIST, error: null });
    const deleteMock = chainMock({ data: null, error: 'Database error' });

    mockFrom.mockReturnValueOnce(checkMock.chain).mockReturnValueOnce(deleteMock.chain);

    const res = await DELETE(makeRequest('/x', { method: 'DELETE' }), ctx);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to delete playlist');
  });

  it('returns 500 on unexpected error during check', async () => {
    mockFrom.mockImplementationOnce(() => {
      throw new Error('Connection failed');
    });

    const res = await DELETE(makeRequest('/x', { method: 'DELETE' }), ctx);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to delete playlist');
  });
});
