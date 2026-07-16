import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: mockGetSessionData,
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/env', () => ({
  ENV: {
    NEYNAR_API_KEY: 'test-neynar-key-123',
  },
}));

// Mock fetch globally for Neynar requests
global.fetch = vi.fn();

import { GET } from '../route';

describe('GET /api/chat/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Authentication tests
  // ========================================================================

  it('returns 401 when session is not authenticated', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test' }));
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  // ========================================================================
  // Query validation tests
  // ========================================================================

  it('returns 400 when query is missing', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const res = await GET(makeGetRequest('/api/chat/search'));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toEqual({ error: 'Query must be at least 2 characters' });
  });

  it('returns 400 when query is less than 2 characters', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'a' }));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toEqual({ error: 'Query must be at least 2 characters' });
  });

  it('returns 400 when query is only whitespace', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const res = await GET(makeGetRequest('/api/chat/search', { q: '   ' }));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toEqual({ error: 'Query must be at least 2 characters' });
  });

  it('accepts query with exactly 2 characters', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    // Mock Neynar fetch to fail (OK is enough for validation test)
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
    });

    // Mock supabase empty results
    const mockChain = mockSupabaseChain({ data: [], error: null });
    mockFrom.mockReturnValue(mockChain);

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'ab', channel: 'zao' }));
    expect(res.status).toBe(200);
  });

  // ========================================================================
  // Channel validation tests
  // ========================================================================

  it('returns 400 for invalid channel', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test', channel: 'invalid' }));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toEqual({ error: 'Invalid channel' });
  });

  it('uses default channel "zao" when channel param is missing', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
    });

    const mockChain = mockSupabaseChain({ data: [], error: null });
    mockFrom.mockReturnValue(mockChain);

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test' }));
    expect(res.status).toBe(200);

    // Verify supabase .eq was called with 'zao'
    expect(mockFrom).toHaveBeenCalledWith('channel_casts');
    const chain = mockFrom.mock.results[0].value;
    expect(chain.eq).toHaveBeenCalledWith('channel_id', 'zao');
  });

  it('accepts valid channels', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
    });

    const mockChain = mockSupabaseChain({ data: [], error: null });
    mockFrom.mockReturnValue(mockChain);

    // Test each valid channel from community.config
    const validChannels = ['zao', 'zabal', 'cocconcertz', 'wavewarz'];

    for (const channel of validChannels) {
      vi.clearAllMocks();
      mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });
      mockFrom.mockReturnValue(mockSupabaseChain({ data: [], error: null }));

      const res = await GET(makeGetRequest('/api/chat/search', { q: 'test', channel }));
      expect(res.status).toBe(200);
    }
  });

  // ========================================================================
  // Wildcard escaping tests
  // ========================================================================

  it('escapes % wildcards in query for supabase search', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
    });

    const mockChain = mockSupabaseChain({ data: [], error: null });
    mockFrom.mockReturnValue(mockChain);

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test%query', channel: 'zao' }));
    expect(res.status).toBe(200);

    // Verify the ilike call has escaped the %
    const chain = mockFrom.mock.results[0].value;
    expect(chain.ilike).toHaveBeenCalledWith('text', expect.stringContaining('test\\%query'));
  });

  it('escapes _ wildcards in query for supabase search', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
    });

    const mockChain = mockSupabaseChain({ data: [], error: null });
    mockFrom.mockReturnValue(mockChain);

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test_query', channel: 'zao' }));
    expect(res.status).toBe(200);

    const chain = mockFrom.mock.results[0].value;
    expect(chain.ilike).toHaveBeenCalledWith('text', expect.stringContaining('test\\_query'));
  });

  it('escapes backslash in query for supabase search', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
    });

    const mockChain = mockSupabaseChain({ data: [], error: null });
    mockFrom.mockReturnValue(mockChain);

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test\\query', channel: 'zao' }));
    expect(res.status).toBe(200);

    const chain = mockFrom.mock.results[0].value;
    expect(chain.ilike).toHaveBeenCalledWith('text', expect.stringContaining('test\\\\query'));
  });

  it('escapes multiple special characters in query', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
    });

    const mockChain = mockSupabaseChain({ data: [], error: null });
    mockFrom.mockReturnValue(mockChain);

    const res = await GET(
      makeGetRequest('/api/chat/search', { q: '%test_query\\', channel: 'zao' }),
    );
    expect(res.status).toBe(200);

    const chain = mockFrom.mock.results[0].value;
    expect(chain.ilike).toHaveBeenCalledWith(
      'text',
      expect.stringContaining('\\%test\\_query\\\\'),
    );
  });

  // ========================================================================
  // Supabase search tests
  // ========================================================================

  it('queries supabase channel_casts table with correct parameters', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
    });

    const mockChain = mockSupabaseChain({ data: [], error: null });
    mockFrom.mockReturnValue(mockChain);

    await GET(makeGetRequest('/api/chat/search', { q: 'search term', channel: 'zao' }));

    expect(mockFrom).toHaveBeenCalledWith('channel_casts');
    const chain = mockFrom.mock.results[0].value;

    expect(chain.select).toHaveBeenCalledWith('*');
    expect(chain.eq).toHaveBeenCalledWith('channel_id', 'zao');
    expect(chain.ilike).toHaveBeenCalledWith('text', expect.stringContaining('search term'));
    expect(chain.order).toHaveBeenCalledWith('timestamp', { ascending: false });
    expect(chain.limit).toHaveBeenCalledWith(20);
  });

  it('returns db results when supabase returns data', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
    });

    const dbResults = [
      {
        hash: 'hash1',
        fid: 456,
        author_username: 'author1',
        author_display: 'Author One',
        author_pfp: 'pfp1.jpg',
        text: 'This is a test message',
        timestamp: '2026-07-16T10:00:00Z',
        replies_count: 5,
      },
    ];

    const mockChain = mockSupabaseChain({ data: dbResults, error: null });
    mockFrom.mockReturnValue(mockChain);

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test', channel: 'zao' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.results).toHaveLength(1);
    expect(body.results[0]).toEqual({
      hash: 'hash1',
      author: {
        fid: 456,
        username: 'author1',
        display_name: 'Author One',
        pfp_url: 'pfp1.jpg',
      },
      text: 'This is a test message',
      timestamp: '2026-07-16T10:00:00Z',
      replies: { count: 5 },
    });
  });

  // ========================================================================
  // Neynar fetch tests
  // ========================================================================

  it('calls Neynar search API with correct headers and params', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
    });

    const mockChain = mockSupabaseChain({ data: [], error: null });
    mockFrom.mockReturnValue(mockChain);

    await GET(makeGetRequest('/api/chat/search', { q: 'search term', channel: 'zao' }));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://api.neynar.com/v2/farcaster/cast/search'),
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'test-neynar-key-123',
        },
      },
    );

    // Verify URL contains search params (URLSearchParams encodes spaces as +)
    const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callArgs).toContain('q=search+term');
    expect(callArgs).toContain('limit=20');
    expect(callArgs).toContain('channel_id=zao');
  });

  it('returns Neynar results when search succeeds', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const neynarResponse = {
      result: {
        casts: [
          {
            hash: 'neynar_hash1',
            author: {
              fid: 789,
              username: 'neynar_author',
              display_name: 'Neynar Author',
              pfp_url: 'neynar_pfp.jpg',
            },
            text: 'Neynar cast message',
            timestamp: '2026-07-16T09:00:00Z',
            replies: { count: 3 },
          },
        ],
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => neynarResponse,
    });

    const mockChain = mockSupabaseChain({ data: [], error: null });
    mockFrom.mockReturnValue(mockChain);

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test', channel: 'zao' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.results).toHaveLength(1);
    expect(body.results[0]).toEqual({
      hash: 'neynar_hash1',
      author: {
        fid: 789,
        username: 'neynar_author',
        display_name: 'Neynar Author',
        pfp_url: 'neynar_pfp.jpg',
      },
      text: 'Neynar cast message',
      timestamp: '2026-07-16T09:00:00Z',
      replies: { count: 3 },
    });
  });

  // ========================================================================
  // Result merging and deduplication tests
  // ========================================================================

  it('deduplicates results by hash when both Neynar and DB return same cast', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const sharedHash = 'shared_hash';
    const neynarResponse = {
      result: {
        casts: [
          {
            hash: sharedHash,
            author: { fid: 789, username: 'author', display_name: 'Author', pfp_url: 'pfp.jpg' },
            text: 'Same message',
            timestamp: '2026-07-16T09:00:00Z',
            replies: { count: 3 },
          },
        ],
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => neynarResponse,
    });

    const dbResults = [
      {
        hash: sharedHash,
        fid: 789,
        author_username: 'author',
        author_display: 'Author',
        author_pfp: 'pfp.jpg',
        text: 'Same message',
        timestamp: '2026-07-16T09:00:00Z',
        replies_count: 3,
      },
    ];

    const mockChain = mockSupabaseChain({ data: dbResults, error: null });
    mockFrom.mockReturnValue(mockChain);

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test', channel: 'zao' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    // Should only have 1 result despite both sources returning it
    expect(body.results).toHaveLength(1);
    expect(body.results[0].hash).toBe(sharedHash);
  });

  it('merges Neynar results first, then unique DB results', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const neynarResponse = {
      result: {
        casts: [
          {
            hash: 'neynar1',
            author: { fid: 1, username: 'author1', display_name: 'Author 1', pfp_url: 'pfp1.jpg' },
            text: 'Neynar message',
            timestamp: '2026-07-16T09:00:00Z',
            replies: { count: 0 },
          },
        ],
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => neynarResponse,
    });

    const dbResults = [
      {
        hash: 'db1',
        fid: 2,
        author_username: 'author2',
        author_display: 'Author 2',
        author_pfp: 'pfp2.jpg',
        text: 'DB message',
        timestamp: '2026-07-16T08:00:00Z',
        replies_count: 1,
      },
    ];

    const mockChain = mockSupabaseChain({ data: dbResults, error: null });
    mockFrom.mockReturnValue(mockChain);

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test', channel: 'zao' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.results).toHaveLength(2);
    expect(body.results[0].hash).toBe('neynar1');
    expect(body.results[1].hash).toBe('db1');
  });

  // ========================================================================
  // Hidden messages filtering tests
  // ========================================================================

  it('filters out hidden messages from results', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const neynarResponse = {
      result: {
        casts: [
          {
            hash: 'visible_hash',
            author: { fid: 1, username: 'author', display_name: 'Author', pfp_url: 'pfp.jpg' },
            text: 'Visible message',
            timestamp: '2026-07-16T09:00:00Z',
            replies: { count: 0 },
          },
          {
            hash: 'hidden_hash',
            author: { fid: 2, username: 'author2', display_name: 'Author 2', pfp_url: 'pfp2.jpg' },
            text: 'Should be hidden',
            timestamp: '2026-07-16T08:00:00Z',
            replies: { count: 0 },
          },
        ],
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => neynarResponse,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'channel_casts') {
        return mockSupabaseChain({ data: [], error: null });
      }
      if (table === 'hidden_messages') {
        return mockSupabaseChain(
          { data: [{ cast_hash: 'hidden_hash' }], error: null },
          true, // isHiddenTable
        );
      }
      return mockSupabaseChain({ data: [], error: null });
    });

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test', channel: 'zao' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.results).toHaveLength(1);
    expect(body.results[0].hash).toBe('visible_hash');
  });

  it('handles empty hidden_messages table gracefully', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const neynarResponse = {
      result: {
        casts: [
          {
            hash: 'hash1',
            author: { fid: 1, username: 'author', display_name: 'Author', pfp_url: 'pfp.jpg' },
            text: 'Message 1',
            timestamp: '2026-07-16T09:00:00Z',
            replies: { count: 0 },
          },
        ],
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => neynarResponse,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'hidden_messages') {
        return mockSupabaseChain({ data: [], error: null }, true);
      }
      return mockSupabaseChain({ data: [], error: null });
    });

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test', channel: 'zao' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.results).toHaveLength(1);
  });

  // ========================================================================
  // Limit and slicing tests
  // ========================================================================

  it('limits results to SEARCH_LIMIT (20)', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    // Create 25 results
    const casts = Array.from({ length: 25 }, (_, i) => ({
      hash: `hash_${i}`,
      author: { fid: i, username: `author${i}`, display_name: `Author ${i}`, pfp_url: 'pfp.jpg' },
      text: `Message ${i}`,
      timestamp: '2026-07-16T09:00:00Z',
      replies: { count: 0 },
    }));

    const neynarResponse = { result: { casts } };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => neynarResponse,
    });

    const mockChain = mockSupabaseChain({ data: [], error: null });
    mockFrom.mockReturnValue(mockChain);

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test', channel: 'zao' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.results).toHaveLength(20);
  });

  // ========================================================================
  // Error handling tests
  // ========================================================================

  it('handles supabase channel_casts returning null gracefully', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
    });

    // Supabase returns { data: null, error: null } as a valid response
    const mockChain = mockSupabaseChain({ data: null, error: null });
    mockFrom.mockReturnValue(mockChain);

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test', channel: 'zao' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.results).toEqual([]);
  });

  it('handles supabase hidden_messages returning null gracefully', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const neynarResponse = {
      result: {
        casts: [
          {
            hash: 'hash1',
            author: { fid: 1, username: 'author', display_name: 'Author', pfp_url: 'pfp.jpg' },
            text: 'Message',
            timestamp: '2026-07-16T09:00:00Z',
            replies: { count: 0 },
          },
        ],
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => neynarResponse,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'hidden_messages') {
        return mockSupabaseChain({ data: null, error: null }, true);
      }
      return mockSupabaseChain({ data: [], error: null });
    });

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test', channel: 'zao' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    // Should still have the Neynar result
    expect(body.results).toHaveLength(1);
  });

  it('gracefully handles Neynar fetch failure and falls back to DB', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const dbResults = [
      {
        hash: 'db_hash',
        fid: 1,
        author_username: 'author',
        author_display: 'Author',
        author_pfp: 'pfp.jpg',
        text: 'DB result',
        timestamp: '2026-07-16T09:00:00Z',
        replies_count: 0,
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === 'hidden_messages') {
        return mockSupabaseChain({ data: [], error: null }, true);
      }
      return mockSupabaseChain({ data: dbResults, error: null });
    });

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test', channel: 'zao' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.results).toHaveLength(1);
    expect(body.results[0].hash).toBe('db_hash');
  });

  it('returns 500 on unexpected error during search', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
    });

    // Mock supabase to throw an unexpected error
    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected database error');
    });

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test', channel: 'zao' }));
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body).toEqual({ error: 'Search failed' });
  });

  // ========================================================================
  // Response shape tests
  // ========================================================================

  it('returns results array in response', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });

    const mockChain = mockSupabaseChain({ data: [], error: null });
    mockFrom.mockReturnValue(mockChain);

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test', channel: 'zao' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('results');
    expect(Array.isArray(body.results)).toBe(true);
  });

  it('formats author object correctly in results', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const dbResults = [
      {
        hash: 'hash1',
        fid: 456,
        author_username: 'test_author',
        author_display: 'Test Author',
        author_pfp: 'https://example.com/pfp.jpg',
        text: 'Test message',
        timestamp: '2026-07-16T10:00:00Z',
        replies_count: 5,
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });

    const mockChain = mockSupabaseChain({ data: dbResults, error: null });
    mockFrom.mockReturnValue(mockChain);

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test', channel: 'zao' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.results[0].author).toEqual({
      fid: 456,
      username: 'test_author',
      display_name: 'Test Author',
      pfp_url: 'https://example.com/pfp.jpg',
    });
  });

  it('formats replies object correctly in results', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const dbResults = [
      {
        hash: 'hash1',
        fid: 456,
        author_username: 'author',
        author_display: 'Author',
        author_pfp: 'pfp.jpg',
        text: 'Message',
        timestamp: '2026-07-16T10:00:00Z',
        replies_count: 12,
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });

    const mockChain = mockSupabaseChain({ data: dbResults, error: null });
    mockFrom.mockReturnValue(mockChain);

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test', channel: 'zao' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.results[0].replies).toEqual({ count: 12 });
  });

  // ========================================================================
  // Edge cases
  // ========================================================================

  it('handles null/undefined author fields gracefully', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const dbResults = [
      {
        hash: 'hash1',
        fid: 456,
        author_username: null,
        author_display: undefined,
        author_pfp: null,
        text: 'Message',
        timestamp: '2026-07-16T10:00:00Z',
        replies_count: 0,
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });

    const mockChain = mockSupabaseChain({ data: dbResults, error: null });
    mockFrom.mockReturnValue(mockChain);

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test', channel: 'zao' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.results[0].author).toEqual({
      fid: 456,
      username: '',
      display_name: '',
      pfp_url: '',
    });
  });

  it('handles Neynar response with missing result field', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const invalidResponse = {}; // Missing result field

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => invalidResponse,
    });

    const mockChain = mockSupabaseChain({ data: [], error: null });
    mockFrom.mockReturnValue(mockChain);

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test', channel: 'zao' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.results).toEqual([]);
  });

  it('handles Neynar response with missing casts field', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const invalidResponse = { result: {} }; // Missing casts field

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => invalidResponse,
    });

    const mockChain = mockSupabaseChain({ data: [], error: null });
    mockFrom.mockReturnValue(mockChain);

    const res = await GET(makeGetRequest('/api/chat/search', { q: 'test', channel: 'zao' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.results).toEqual([]);
  });

  it('trims whitespace from query parameter', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });

    const mockChain = mockSupabaseChain({ data: [], error: null });
    mockFrom.mockReturnValue(mockChain);

    await GET(makeGetRequest('/api/chat/search', { q: '   test query   ', channel: 'zao' }));

    const chain = mockFrom.mock.results[0].value;
    const ilikeCall = chain.ilike.mock.calls[0];
    // Query should be trimmed to 'test query' (no leading/trailing spaces)
    expect(ilikeCall[1]).toContain('test query');
  });
});

// ============================================================================
// Helper function to create a mock Supabase chain
// ============================================================================

interface SupabaseChainResult {
  data: unknown;
  error: unknown;
}

function mockSupabaseChain(
  result: SupabaseChainResult,
  _isHiddenTable: boolean = false,
): Record<string, ReturnType<typeof vi.fn>> {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  const chainable = ['select', 'eq', 'ilike', 'order', 'limit', 'in', 'maybeSingle', 'single'];

  for (const method of chainable) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Allow the chain to be awaited directly
  // biome-ignore lint: reason
  (chain as unknown as { then: unknown }).then = vi.fn((resolve: (val: unknown) => void) =>
    resolve(result),
  ) as unknown as undefined;

  return chain;
}
