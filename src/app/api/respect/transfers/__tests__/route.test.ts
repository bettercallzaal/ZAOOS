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
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

describe('GET /api/respect/transfers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when no session is present', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await GET(makeGetRequest('/api/respect/transfers'));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns transfers when session is authenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const mockChain = chainMock({
        data: [
          {
            tx_hash: '0x123',
            from_address: '0x0000000000000000000000000000000000000000',
            to_address: '0xabc123',
            token_type: 'og_erc20',
            amount: '100',
            block_number: 1000,
            block_timestamp: '2026-07-15T10:00:00Z',
          },
        ],
      });

      mockFrom.mockReturnValue(mockChain.chain);

      const res = await GET(makeGetRequest('/api/respect/transfers'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.transfers).toHaveLength(1);
      expect(body.transfers[0].isMint).toBe(true);
    });
  });

  describe('query parameter validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 400 when address is not a valid Ethereum address', async () => {
      const mockChain = chainMock({ data: [] });
      mockFrom.mockReturnValue(mockChain.chain);

      const res = await GET(
        makeGetRequest('/api/respect/transfers', { address: 'not-an-address' }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid params');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when limit exceeds maximum of 500', async () => {
      const mockChain = chainMock({ data: [] });
      mockFrom.mockReturnValue(mockChain.chain);

      const res = await GET(makeGetRequest('/api/respect/transfers', { limit: '501' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid params');
    });

    it('returns 400 when limit is less than 1', async () => {
      const mockChain = chainMock({ data: [] });
      mockFrom.mockReturnValue(mockChain.chain);

      const res = await GET(makeGetRequest('/api/respect/transfers', { limit: '0' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid params');
    });

    it('returns 400 when sync is not "true" or "false"', async () => {
      const mockChain = chainMock({ data: [] });
      mockFrom.mockReturnValue(mockChain.chain);

      const res = await GET(makeGetRequest('/api/respect/transfers', { sync: 'maybe' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid params');
    });

    it('accepts valid Ethereum address with proper checksum', async () => {
      const mockChain = chainMock({
        data: [
          {
            tx_hash: '0x456',
            from_address: '0xaaa',
            to_address: '0x1234567890abcdef1234567890abcdef12345678',
            token_type: 'og_erc20',
            amount: '50',
            block_number: 2000,
            block_timestamp: '2026-07-14T10:00:00Z',
          },
        ],
      });

      mockFrom.mockReturnValue(mockChain.chain);

      const res = await GET(
        makeGetRequest('/api/respect/transfers', {
          address: '0x1234567890abcdef1234567890abcdef12345678',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.transfers).toHaveLength(1);
    });

    it('coerces limit string to integer', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const mockChain = chainMock({ data: [] });
      mockFrom.mockReturnValue(mockChain.chain);

      const res = await GET(makeGetRequest('/api/respect/transfers', { limit: '50' }));
      const _body = await res.json();

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalled();
    });

    it('uses default limit of 100 when not provided', async () => {
      const mockChain = chainMock({ data: [] });
      mockFrom.mockReturnValue(mockChain.chain);

      await GET(makeGetRequest('/api/respect/transfers'));

      const chain = mockChain.chain;
      expect(chain.limit).toHaveBeenCalledWith(100);
    });
  });

  describe('address filtering', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('filters by address when provided', async () => {
      const mockChain = chainMock({ data: [] });
      mockFrom.mockReturnValue(mockChain.chain);

      const testAddress = '0xaabbccddaabbccddaabbccddaabbccddaabbccdd';
      await GET(makeGetRequest('/api/respect/transfers', { address: testAddress }));

      const chain = mockChain.chain;
      expect(chain.ilike).toHaveBeenCalledWith('to_address', testAddress.toLowerCase());
    });

    it('does not filter by address when not provided', async () => {
      const mockChain = chainMock({ data: [] });
      mockFrom.mockReturnValue(mockChain.chain);

      await GET(makeGetRequest('/api/respect/transfers'));

      const chain = mockChain.chain;
      expect(chain.ilike).not.toHaveBeenCalled();
    });
  });

  describe('data transformation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('transforms database fields to API response format', async () => {
      const mockChain = chainMock({
        data: [
          {
            tx_hash: '0xaabbcc',
            from_address: '0xsender',
            to_address: '0xrecipient',
            token_type: 'og_erc20',
            amount: '250',
            block_number: 5000,
            block_timestamp: '2026-07-13T15:30:00Z',
          },
        ],
      });

      mockFrom.mockReturnValue(mockChain.chain);

      const res = await GET(makeGetRequest('/api/respect/transfers'));
      const body = await res.json();

      expect(body.transfers[0]).toEqual({
        txHash: '0xaabbcc',
        from: '0xsender',
        to: '0xrecipient',
        tokenType: 'og_erc20',
        amount: '250',
        blockNumber: 5000,
        timestamp: '2026-07-13T15:30:00Z',
        isMint: false,
        explorerUrl: 'https://optimistic.etherscan.io/tx/0xaabbcc',
      });
    });

    it('marks transfers from zero address as mints', async () => {
      const mockChain = chainMock({
        data: [
          {
            tx_hash: '0xmint1',
            from_address: '0x0000000000000000000000000000000000000000',
            to_address: '0xrecipient',
            token_type: 'zor_erc1155',
            amount: '1',
            block_number: 6000,
            block_timestamp: '2026-07-12T10:00:00Z',
          },
        ],
      });

      mockFrom.mockReturnValue(mockChain.chain);

      const res = await GET(makeGetRequest('/api/respect/transfers'));
      const body = await res.json();

      expect(body.transfers[0].isMint).toBe(true);
      expect(body.transfers[0].from).toBe('0x0000000000000000000000000000000000000000');
    });

    it('includes explorer URL for each transfer', async () => {
      const mockChain = chainMock({
        data: [
          {
            tx_hash: '0x789def',
            from_address: '0xfrom',
            to_address: '0xto',
            token_type: 'og_erc20',
            amount: '100',
            block_number: 3000,
            block_timestamp: '2026-07-11T10:00:00Z',
          },
        ],
      });

      mockFrom.mockReturnValue(mockChain.chain);

      const res = await GET(makeGetRequest('/api/respect/transfers'));
      const body = await res.json();

      expect(body.transfers[0].explorerUrl).toBe('https://optimistic.etherscan.io/tx/0x789def');
    });
  });

  describe('result formatting', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns populated transfers with total count', async () => {
      const transfers = [
        {
          tx_hash: '0x1',
          from_address: '0xa',
          to_address: '0xb',
          token_type: 'og_erc20',
          amount: '10',
          block_number: 100,
          block_timestamp: '2026-07-15T10:00:00Z',
        },
        {
          tx_hash: '0x2',
          from_address: '0xc',
          to_address: '0xd',
          token_type: 'zor_erc1155',
          amount: '5',
          block_number: 200,
          block_timestamp: '2026-07-15T11:00:00Z',
        },
      ];

      const mockChain = chainMock({ data: transfers });
      mockFrom.mockReturnValue(mockChain.chain);

      const res = await GET(makeGetRequest('/api/respect/transfers'));
      const body = await res.json();

      expect(body.transfers).toHaveLength(2);
      expect(body.total).toBe(2);
    });

    it('returns empty transfers list with zero total when no data', async () => {
      const mockChain = chainMock({ data: [] });
      mockFrom.mockReturnValue(mockChain.chain);

      const res = await GET(makeGetRequest('/api/respect/transfers'));
      const body = await res.json();

      expect(body.transfers).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('returns empty transfers list when data is null', async () => {
      const mockChain = chainMock({ data: null });
      mockFrom.mockReturnValue(mockChain.chain);

      const res = await GET(makeGetRequest('/api/respect/transfers'));
      const body = await res.json();

      expect(body.transfers).toEqual([]);
      expect(body.total).toBe(0);
    });
  });

  describe('query ordering', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('orders by block_timestamp descending', async () => {
      const mockChain = chainMock({ data: [] });
      mockFrom.mockReturnValue(mockChain.chain);

      await GET(makeGetRequest('/api/respect/transfers'));

      const chain = mockChain.chain;
      expect(chain.order).toHaveBeenCalledWith('block_timestamp', {
        ascending: false,
        nullsFirst: false,
      });
    });

    it('applies limit after ordering', async () => {
      const mockChain = chainMock({ data: [] });
      mockFrom.mockReturnValue(mockChain.chain);

      await GET(makeGetRequest('/api/respect/transfers', { limit: '25' }));

      const chain = mockChain.chain;
      expect(chain.order).toHaveBeenCalled();
      expect(chain.limit).toHaveBeenCalledWith(25);
    });
  });

  describe('database errors', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 when Supabase returns an error', async () => {
      const mockChain = chainMock({
        error: new Error('connection timeout'),
        data: null,
      });
      mockFrom.mockReturnValue(mockChain.chain);

      const res = await GET(makeGetRequest('/api/respect/transfers'));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to load transfers');
    });

    it('returns 500 when query throws an error', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('database connection failed');
      });

      const res = await GET(makeGetRequest('/api/respect/transfers'));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to load transfers');
    });
  });

  describe('integration scenarios', () => {
    it('returns 401 without attempting database query when not authenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      await GET(makeGetRequest('/api/respect/transfers'));

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 without attempting database query for invalid params', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      const mockChain = chainMock({ data: [] });
      mockFrom.mockReturnValue(mockChain.chain);

      await GET(makeGetRequest('/api/respect/transfers', { address: 'invalid-address' }));

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('handles multiple transfers from different sources (og + zor)', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const transfers = [
        {
          tx_hash: '0x111',
          from_address: '0x0000000000000000000000000000000000000000',
          to_address: '0xuser1',
          token_type: 'og_erc20',
          amount: '100',
          block_number: 1000,
          block_timestamp: '2026-07-15T10:00:00Z',
        },
        {
          tx_hash: '0x222',
          from_address: '0xsender2',
          to_address: '0xuser1',
          token_type: 'zor_erc1155',
          amount: '1',
          block_number: 1001,
          block_timestamp: '2026-07-15T09:00:00Z',
        },
      ];

      const mockChain = chainMock({ data: transfers });
      mockFrom.mockReturnValue(mockChain.chain);

      const res = await GET(makeGetRequest('/api/respect/transfers'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.transfers).toHaveLength(2);
      expect(body.transfers[0].tokenType).toBe('og_erc20');
      expect(body.transfers[1].tokenType).toBe('zor_erc1155');
      expect(body.total).toBe(2);
    });
  });
});
