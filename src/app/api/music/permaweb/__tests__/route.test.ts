import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
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
  logger: { error: vi.fn() },
}));

import { GET } from '../route';

describe('GET /api/music/permaweb', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
  });

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await GET(makeGetRequest('/api/music/permaweb'));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('allows an authenticated session', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 456, username: 'testuser' }),
      );

      const { chain } = chainMock({
        data: [],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/music/permaweb'));
      expect(res.status).not.toBe(401);
    });
  });

  describe('query parameters', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 789 }));
    });

    it('queries all assets when no filters are provided', async () => {
      const { chain } = chainMock({
        data: [{ id: 'asset1', artist: 'Artist A', fid: 100, created_at: '2026-01-01' }],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/music/permaweb'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.assets).toHaveLength(1);
      expect(mockFrom).toHaveBeenCalledWith('arweave_assets');
      expect(chain.select).toHaveBeenCalledWith('*');
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(chain.range).toHaveBeenCalledWith(0, 49); // default limit is 50
    });

    it('filters by artist name with LIKE query', async () => {
      const { chain } = chainMock({
        data: [{ id: 'asset2', artist: 'Daft Punk', fid: 100, created_at: '2026-01-02' }],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/music/permaweb', { artist: 'Daft' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(chain.ilike).toHaveBeenCalledWith('artist', '%Daft%');
      expect(body.assets).toHaveLength(1);
    });

    it('escapes LIKE metacharacters in artist name', async () => {
      const { chain } = chainMock({
        data: [],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      await GET(makeGetRequest('/api/music/permaweb', { artist: 'Artist%_\\Name' }));

      expect(chain.ilike).toHaveBeenCalledWith('artist', '%Artist\\%\\_\\\\Name%');
    });

    it('truncates artist name to 100 characters', async () => {
      const { chain } = chainMock({
        data: [],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const longName = 'A'.repeat(150);
      await GET(makeGetRequest('/api/music/permaweb', { artist: longName }));

      expect(chain.ilike).toHaveBeenCalledWith('artist', `%${'A'.repeat(100)}%`);
    });

    it('filters by fid with eq query', async () => {
      const { chain } = chainMock({
        data: [{ id: 'asset3', artist: 'Artist C', fid: 999, created_at: '2026-01-03' }],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/music/permaweb', { fid: '999' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(chain.eq).toHaveBeenCalledWith('fid', 999);
      expect(body.assets).toHaveLength(1);
    });

    it('applies limit parameter (capped at 100)', async () => {
      const { chain } = chainMock({
        data: [],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      await GET(makeGetRequest('/api/music/permaweb', { limit: '200' }));

      expect(chain.range).toHaveBeenCalledWith(0, 99); // 100 - 1
    });

    it('applies limit parameter below 100', async () => {
      const { chain } = chainMock({
        data: [],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      await GET(makeGetRequest('/api/music/permaweb', { limit: '25' }));

      expect(chain.range).toHaveBeenCalledWith(0, 24); // 25 - 1
    });

    it('applies offset parameter', async () => {
      const { chain } = chainMock({
        data: [],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      await GET(makeGetRequest('/api/music/permaweb', { offset: '100', limit: '50' }));

      expect(chain.range).toHaveBeenCalledWith(100, 149);
    });

    it('defaults limit to 50 and offset to 0', async () => {
      const { chain } = chainMock({
        data: [],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      await GET(makeGetRequest('/api/music/permaweb'));

      expect(chain.range).toHaveBeenCalledWith(0, 49);
    });
  });

  describe('asset enrichment', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 789 }));
    });

    it('enriches assets with arweave URLs', async () => {
      const { chain } = chainMock({
        data: [
          {
            id: 'asset1',
            artist: 'Artist A',
            arweave_tx_id: 'tx123',
            cover_tx_id: 'cover123',
            fid: 100,
            created_at: '2026-01-01',
          },
        ],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      // Mock collections query
      const collectionsChain = chainMock({
        data: [],
        error: null,
      }).chain;
      const callCount = { current: 0 };
      mockFrom.mockImplementation(() => {
        callCount.current += 1;
        return callCount.current === 1 ? chain : collectionsChain;
      });

      const res = await GET(makeGetRequest('/api/music/permaweb'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.assets[0].audioUrl).toBe('https://arweave.net/tx123');
      expect(body.assets[0].coverUrl).toBe('https://arweave.net/cover123');
      expect(body.assets[0].bazarUrl).toBe('https://bazar.arweave.net/#/asset/tx123');
    });

    it('sets coverUrl to null when no cover_tx_id', async () => {
      const { chain } = chainMock({
        data: [
          {
            id: 'asset1',
            artist: 'Artist A',
            arweave_tx_id: 'tx123',
            cover_tx_id: null,
            fid: 100,
            created_at: '2026-01-01',
          },
        ],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const collectionsChain = chainMock({
        data: [],
        error: null,
      }).chain;
      const callCount = { current: 0 };
      mockFrom.mockImplementation(() => {
        callCount.current += 1;
        return callCount.current === 1 ? chain : collectionsChain;
      });

      const res = await GET(makeGetRequest('/api/music/permaweb'));
      const body = await res.json();

      expect(body.assets[0].coverUrl).toBeNull();
    });

    it('marks assets as collected when user has collected them', async () => {
      const { chain: assetsChain } = chainMock({
        data: [{ id: 'asset1', arweave_tx_id: 'tx123', fid: 100 }],
        error: null,
      });

      const { chain: collectionsChain } = chainMock({
        data: [{ asset_id: 'asset1' }],
        error: null,
      });

      const callCount = { current: 0 };
      mockFrom.mockImplementation(() => {
        callCount.current += 1;
        return callCount.current === 1 ? assetsChain : collectionsChain;
      });

      const res = await GET(makeGetRequest('/api/music/permaweb'));
      const body = await res.json();

      expect(body.assets[0].collected).toBe(true);
    });

    it('marks assets as not collected when user has not collected them', async () => {
      const { chain: assetsChain } = chainMock({
        data: [{ id: 'asset1', arweave_tx_id: 'tx123', fid: 100 }],
        error: null,
      });

      const { chain: collectionsChain } = chainMock({
        data: [],
        error: null,
      });

      const callCount = { current: 0 };
      mockFrom.mockImplementation(() => {
        callCount.current += 1;
        return callCount.current === 1 ? assetsChain : collectionsChain;
      });

      const res = await GET(makeGetRequest('/api/music/permaweb'));
      const body = await res.json();

      expect(body.assets[0].collected).toBe(false);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 789 }));
    });

    it('returns 500 when arweave_assets query fails', async () => {
      const { chain } = chainMock({
        data: null,
        error: { message: 'Database connection failed' },
      });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/music/permaweb'));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch');
    });

    it('returns 500 when an unexpected error is thrown', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const res = await GET(makeGetRequest('/api/music/permaweb'));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch');
    });
  });

  describe('response format', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 789 }));
    });

    it('returns assets array and total count', async () => {
      const { chain: assetsChain } = chainMock({
        data: [
          { id: 'asset1', arweave_tx_id: 'tx1', fid: 100 },
          { id: 'asset2', arweave_tx_id: 'tx2', fid: 200 },
        ],
        error: null,
      });

      const { chain: collectionsChain } = chainMock({
        data: [],
        error: null,
      });

      const callCount = { current: 0 };
      mockFrom.mockImplementation(() => {
        callCount.current += 1;
        return callCount.current === 1 ? assetsChain : collectionsChain;
      });

      const res = await GET(makeGetRequest('/api/music/permaweb'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.assets).toHaveLength(2);
      expect(body.total).toBe(2);
      expect(Array.isArray(body.assets)).toBe(true);
    });

    it('includes Cache-Control header in response', async () => {
      const { chain: assetsChain } = chainMock({
        data: [],
        error: null,
      });

      const { chain: collectionsChain } = chainMock({
        data: [],
        error: null,
      });

      const callCount = { current: 0 };
      mockFrom.mockImplementation(() => {
        callCount.current += 1;
        return callCount.current === 1 ? assetsChain : collectionsChain;
      });

      const res = await GET(makeGetRequest('/api/music/permaweb'));

      expect(res.headers.get('Cache-Control')).toBe(
        'public, s-maxage=60, stale-while-revalidate=30',
      );
    });

    it('returns empty assets array when no assets match', async () => {
      const { chain: assetsChain } = chainMock({
        data: [],
        error: null,
      });

      const { chain: collectionsChain } = chainMock({
        data: [],
        error: null,
      });

      const callCount = { current: 0 };
      mockFrom.mockImplementation(() => {
        callCount.current += 1;
        return callCount.current === 1 ? assetsChain : collectionsChain;
      });

      const res = await GET(makeGetRequest('/api/music/permaweb'));
      const body = await res.json();

      expect(body.assets).toHaveLength(0);
      expect(body.total).toBe(0);
    });
  });
});
