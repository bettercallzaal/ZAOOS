// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/music/isMusicUrl', () => ({
  isMusicUrl: vi.fn().mockReturnValue('spotify'),
}));

const mockSingle = vi.hoisted(() => vi.fn());
const mockMaybeSingle = vi.hoisted(() => vi.fn());
const mockInsert = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { querySongs, upsertSong } from '../library';

afterEach(() => vi.clearAllMocks());

// ---------------------------------------------------------------------------
// upsertSong
// ---------------------------------------------------------------------------
describe('upsertSong', () => {
  it('returns {isNew:false} and increments play count when URL already exists', async () => {
    const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockUpdateEq });

    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      switch (call) {
        case 1:
          // check existing: select('id').eq().maybeSingle()
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing-id' }, error: null }),
              }),
            }),
          };
        case 2:
          // incrementPlayCount: select('play_count').eq().single()
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { play_count: 3 }, error: null }),
              }),
            }),
          };
        default:
          // incrementPlayCount: update({...}).eq()
          return { update: mockUpdate };
      }
    });

    const result = await upsertSong({
      url: 'https://open.spotify.com/track/abc',
      source: 'submission',
    });
    expect(result).toEqual({ id: 'existing-id', isNew: false });
    expect(mockUpdateEq).toHaveBeenCalled();
  });

  it('returns {isNew:true} and inserts when URL is new', async () => {
    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) {
        // check existing: not found
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      // insert: returns new id
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'new-song-id' }, error: null }),
          }),
        }),
      };
    });

    const result = await upsertSong({
      url: 'https://open.spotify.com/track/xyz',
      title: 'New Track',
      source: 'manual',
    });
    expect(result).toEqual({ id: 'new-song-id', isNew: true });
  });

  it('handles race condition (23505) by re-fetching the existing id', async () => {
    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) {
        // initial check: not found
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      if (call === 2) {
        // insert fails with unique violation
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: '23505', message: 'unique' },
              }),
            }),
          }),
        };
      }
      // re-fetch after race
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'raced-id' }, error: null }),
          }),
        }),
      };
    });

    const result = await upsertSong({
      url: 'https://open.spotify.com/track/raced',
      source: 'radio',
    });
    expect(result).toEqual({ id: 'raced-id', isNew: false });
  });
});

// ---------------------------------------------------------------------------
// querySongs
// ---------------------------------------------------------------------------
describe('querySongs', () => {
  it('returns {songs, total} for a basic query', async () => {
    const SONGS = [{ id: '1', title: 'ZAO Track', platform: 'spotify' }];
    const chain: Record<string, unknown> = {};
    const chainable = ['select', 'order', 'textSearch', 'eq'];
    for (const m of chainable) chain[m] = vi.fn().mockReturnValue(chain);
    chain.range = vi.fn().mockResolvedValue({ data: SONGS, error: null, count: 1 });
    mockFrom.mockReturnValue(chain);

    const result = await querySongs({ limit: 10 });
    expect(result.songs).toEqual(SONGS);
    expect(result.total).toBe(1);
  });

  it('throws on DB error', async () => {
    const chain: Record<string, unknown> = {};
    const chainable = ['select', 'order', 'textSearch', 'eq'];
    for (const m of chainable) chain[m] = vi.fn().mockReturnValue(chain);
    chain.range = vi.fn().mockResolvedValue({ data: null, error: new Error('DB fail'), count: 0 });
    mockFrom.mockReturnValue(chain);

    await expect(querySongs()).rejects.toThrow();
  });
});
