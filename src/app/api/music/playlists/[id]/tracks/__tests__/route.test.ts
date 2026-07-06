import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chainMock, makeRequest } from '@/test-utils/api-helpers';

// Playlist track DELETE ownership (doc 841 round-2 security-authz HIGH:
// "IDOR: Unauthorized playlist track deletion without ownership verification").

const { mockGetSessionData, mockFrom, mockAddToPlaylist } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
  mockAddToPlaylist: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({ getSessionData: () => mockGetSessionData() }));
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));
vi.mock('@/lib/music/library', () => ({ addToPlaylist: mockAddToPlaylist }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { DELETE } from '../route';

const SONG_ID = '550e8400-e29b-41d4-a716-446655440000';

function delReq() {
  return makeRequest('/api/music/playlists/p1/tracks', {
    method: 'DELETE',
    body: JSON.stringify({ songId: SONG_ID }),
    headers: { 'Content-Type': 'application/json' },
  });
}
const ctx = { params: Promise.resolve({ id: 'p1' }) };

beforeEach(() => {
  vi.clearAllMocks();
  // clearAllMocks does NOT drain mockReturnValueOnce queues; reset mockFrom so a
  // test that queues more returns than it consumes can't leak into the next one.
  mockFrom.mockReset();
  mockGetSessionData.mockResolvedValue({ fid: 100 });
});

describe('DELETE /api/music/playlists/[id]/tracks — ownership (IDOR)', () => {
  it('rejects unauthenticated with 401', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await DELETE(delReq(), ctx);
    expect(res.status).toBe(401);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns 403 when caller does not own a non-collaborative playlist (the IDOR fix)', async () => {
    // Playlist owned by a DIFFERENT fid, not collaborative.
    const playlistChain = chainMock({
      data: { created_by_fid: 999, collaborative: false },
      error: null,
    });
    const deleteChain = chainMock({ error: null });
    mockFrom.mockReturnValueOnce(playlistChain.chain).mockReturnValueOnce(deleteChain.chain);

    const res = await DELETE(delReq(), ctx);
    expect(res.status).toBe(403);
    // The destructive delete must NOT have run.
    expect(deleteChain.chain.delete).not.toHaveBeenCalled();
  });

  it('returns 404 when the playlist does not exist', async () => {
    const playlistChain = chainMock({ data: null, error: null });
    mockFrom.mockReturnValueOnce(playlistChain.chain);
    const res = await DELETE(delReq(), ctx);
    expect(res.status).toBe(404);
  });

  it('allows the owner to delete a track (200)', async () => {
    const playlistChain = chainMock({
      data: { created_by_fid: 100, collaborative: false },
      error: null,
    });
    const deleteChain = chainMock({ error: null });
    mockFrom.mockReturnValueOnce(playlistChain.chain).mockReturnValueOnce(deleteChain.chain);

    const res = await DELETE(delReq(), ctx);
    expect(res.status).toBe(200);
    expect(deleteChain.chain.delete).toHaveBeenCalled();
  });

  it('allows deletion on a collaborative playlist owned by another user (200)', async () => {
    const playlistChain = chainMock({
      data: { created_by_fid: 999, collaborative: true },
      error: null,
    });
    const deleteChain = chainMock({ error: null });
    mockFrom.mockReturnValueOnce(playlistChain.chain).mockReturnValueOnce(deleteChain.chain);

    const res = await DELETE(delReq(), ctx);
    expect(res.status).toBe(200);
  });
});
