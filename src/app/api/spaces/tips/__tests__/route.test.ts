import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makeGetRequest,
  makePostRequest,
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

import { GET, POST } from '../route';

describe('POST /api/spaces/tips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
  });

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await POST(
        makePostRequest('/api/spaces/tips', {
          amount: '1.0',
          txHash: `0x${'a'.repeat(64)}`,
          chain: 'base',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts a request with a valid authenticated session', async () => {
      const session = mockAuthenticatedSession({ fid: 456 });
      mockGetSessionData.mockResolvedValue(session);

      const tipChain = chainMock({
        data: { id: 1, sender_fid: 456, amount: '1.0', tx_hash: `0x${'a'.repeat(64)}` },
        error: null,
      });
      mockFrom.mockReturnValue(tipChain.chain);

      const res = await POST(
        makePostRequest('/api/spaces/tips', {
          amount: '1.0',
          txHash: `0x${'a'.repeat(64)}`,
          chain: 'base',
        }),
      );

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 400 when amount is missing', async () => {
      const res = await POST(
        makePostRequest('/api/spaces/tips', {
          txHash: `0x${'a'.repeat(64)}`,
          chain: 'base',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when amount is not a numeric string', async () => {
      const res = await POST(
        makePostRequest('/api/spaces/tips', {
          amount: 'not-a-number',
          txHash: `0x${'a'.repeat(64)}`,
          chain: 'base',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when txHash is missing', async () => {
      const res = await POST(
        makePostRequest('/api/spaces/tips', {
          amount: '1.0',
          chain: 'base',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when txHash is not a valid transaction hash format', async () => {
      const res = await POST(
        makePostRequest('/api/spaces/tips', {
          amount: '1.0',
          txHash: 'invalid-hash',
          chain: 'base',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when txHash is 0x but wrong length', async () => {
      const res = await POST(
        makePostRequest('/api/spaces/tips', {
          amount: '1.0',
          txHash: `0x${'a'.repeat(63)}`, // 63 chars instead of 64
          chain: 'base',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('accepts mixed case hex in txHash', async () => {
      const tipChain = chainMock({
        data: {
          id: 1,
          tx_hash: '0xAaBbCcDdEeFfAaBbCcDdEeFfAaBbCcDdEeFfAaBbCcDdEeFfAaBbCcDdEeFfAaBb',
        },
        error: null,
      });
      mockFrom.mockReturnValue(tipChain.chain);

      const res = await POST(
        makePostRequest('/api/spaces/tips', {
          amount: '1.0',
          txHash: '0xAaBbCcDdEeFfAaBbCcDdEeFfAaBbCcDdEeFfAaBbCcDdEeFfAaBbCcDdEeFfAaBb', // 64 hex chars, mixed case
          chain: 'base',
        }),
      );

      expect(res.status).toBe(200);
    });

    it('returns 400 when roomId is not a valid UUID', async () => {
      const res = await POST(
        makePostRequest('/api/spaces/tips', {
          roomId: 'not-a-uuid',
          amount: '1.0',
          txHash: `0x${'a'.repeat(64)}`,
          chain: 'base',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('accepts optional roomId when it is a valid UUID', async () => {
      const tipChain = chainMock({
        data: { id: 1, room_id: VALID_UUID, amount: '1.0' },
        error: null,
      });
      mockFrom.mockReturnValue(tipChain.chain);

      const res = await POST(
        makePostRequest('/api/spaces/tips', {
          roomId: VALID_UUID,
          amount: '1.0',
          txHash: `0x${'a'.repeat(64)}`,
          chain: 'base',
        }),
      );

      expect(res.status).toBe(200);
    });

    it('accepts optional recipientFid as an integer', async () => {
      const tipChain = chainMock({
        data: { id: 1, recipient_fid: 789 },
        error: null,
      });
      mockFrom.mockReturnValue(tipChain.chain);

      const res = await POST(
        makePostRequest('/api/spaces/tips', {
          amount: '1.0',
          txHash: `0x${'a'.repeat(64)}`,
          recipientFid: 789,
        }),
      );

      expect(res.status).toBe(200);
    });

    it('returns 400 when recipientFid is not an integer', async () => {
      const res = await POST(
        makePostRequest('/api/spaces/tips', {
          amount: '1.0',
          txHash: `0x${'a'.repeat(64)}`,
          recipientFid: 12.5,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('allows amount as a decimal string', async () => {
      const tipChain = chainMock({
        data: { id: 1, amount: '0.5' },
        error: null,
      });
      mockFrom.mockReturnValue(tipChain.chain);

      const res = await POST(
        makePostRequest('/api/spaces/tips', {
          amount: '0.5',
          txHash: `0x${'a'.repeat(64)}`,
        }),
      );

      expect(res.status).toBe(200);
    });

    it('allows amount as an integer string', async () => {
      const tipChain = chainMock({
        data: { id: 1, amount: '1' },
        error: null,
      });
      mockFrom.mockReturnValue(tipChain.chain);

      const res = await POST(
        makePostRequest('/api/spaces/tips', {
          amount: '1',
          txHash: `0x${'a'.repeat(64)}`,
        }),
      );

      expect(res.status).toBe(200);
    });

    it('defaults chain to base when not provided', async () => {
      const tipChain = chainMock({
        data: { id: 1, chain: 'base' },
        error: null,
      });
      mockFrom.mockReturnValue(tipChain.chain);

      const res = await POST(
        makePostRequest('/api/spaces/tips', {
          amount: '1.0',
          txHash: `0x${'a'.repeat(64)}`,
        }),
      );

      expect(res.status).toBe(200);
      const insertCall = tipChain.chain.insert.mock.calls[0][0] as Record<string, unknown>;
      expect(insertCall.chain).toBe('base');
    });
  });

  describe('Supabase persistence', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('inserts tip with correct payload shape', async () => {
      const tipChain = chainMock({
        data: {
          id: 1,
          sender_fid: 123,
          recipient_fid: 0,
          amount: '1.0',
          currency: 'ETH',
          chain: 'base',
          tx_hash: `0x${'a'.repeat(64)}`,
          room_id: null,
        },
        error: null,
      });
      mockFrom.mockReturnValue(tipChain.chain);

      const res = await POST(
        makePostRequest('/api/spaces/tips', {
          amount: '1.0',
          txHash: `0x${'a'.repeat(64)}`,
          chain: 'base',
        }),
      );

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalledWith('tips');
      expect(tipChain.chain.insert).toHaveBeenCalledTimes(1);

      const insertPayload = tipChain.chain.insert.mock.calls[0][0];
      expect(insertPayload).toEqual({
        room_id: null,
        sender_fid: 123,
        recipient_fid: 0,
        amount: '1.0',
        currency: 'ETH',
        chain: 'base',
        tx_hash: `0x${'a'.repeat(64)}`,
      });
    });

    it('inserts tip with all optional fields when provided', async () => {
      const tipChain = chainMock({
        data: {
          id: 1,
          room_id: VALID_UUID,
          sender_fid: 123,
          recipient_fid: 789,
          amount: '2.5',
          currency: 'ETH',
          chain: 'optimism',
          tx_hash: `0x${'b'.repeat(64)}`,
        },
        error: null,
      });
      mockFrom.mockReturnValue(tipChain.chain);

      const res = await POST(
        makePostRequest('/api/spaces/tips', {
          roomId: VALID_UUID,
          amount: '2.5',
          txHash: `0x${'b'.repeat(64)}`,
          chain: 'optimism',
          recipientFid: 789,
        }),
      );

      expect(res.status).toBe(200);
      const insertPayload = tipChain.chain.insert.mock.calls[0][0];
      expect(insertPayload).toEqual({
        room_id: VALID_UUID,
        sender_fid: 123,
        recipient_fid: 789,
        amount: '2.5',
        currency: 'ETH',
        chain: 'optimism',
        tx_hash: `0x${'b'.repeat(64)}`,
      });
    });

    it('calls .select() and .single() on the insert chain', async () => {
      const tipChain = chainMock({
        data: { id: 1 },
        error: null,
      });
      mockFrom.mockReturnValue(tipChain.chain);

      await POST(
        makePostRequest('/api/spaces/tips', {
          amount: '1.0',
          txHash: `0x${'a'.repeat(64)}`,
        }),
      );

      expect(tipChain.chain.select).toHaveBeenCalledWith();
      expect(tipChain.chain.single).toHaveBeenCalledTimes(1);
    });

    it('returns 500 when Supabase insert returns an error', async () => {
      const tipChain = chainMock({
        data: null,
        error: new Error('Unique constraint violation'),
      });
      mockFrom.mockReturnValue(tipChain.chain);

      const res = await POST(
        makePostRequest('/api/spaces/tips', {
          amount: '1.0',
          txHash: `0x${'a'.repeat(64)}`,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to log tip');
    });

    it('returns the inserted tip data in response on success', async () => {
      const tipData = {
        id: 42,
        sender_fid: 123,
        recipient_fid: 0,
        amount: '1.5',
        currency: 'ETH',
        chain: 'base',
        tx_hash: `0x${'c'.repeat(64)}`,
        room_id: null,
        created_at: '2026-07-15T10:30:00Z',
      };
      const tipChain = chainMock({ data: tipData, error: null });
      mockFrom.mockReturnValue(tipChain.chain);

      const res = await POST(
        makePostRequest('/api/spaces/tips', {
          amount: '1.5',
          txHash: `0x${'c'.repeat(64)}`,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.tip).toEqual(tipData);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 500 when req.json() throws', async () => {
      const req = makePostRequest('/api/spaces/tips', {});
      // Sabotage the request to make json() fail
      Object.defineProperty(req, 'json', {
        value: () => Promise.reject(new Error('Invalid JSON')),
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal error');
    });

    it('returns 500 when getSessionData throws unexpectedly', async () => {
      mockGetSessionData.mockRejectedValue(new Error('Session service down'));

      const res = await POST(
        makePostRequest('/api/spaces/tips', {
          amount: '1.0',
          txHash: `0x${'a'.repeat(64)}`,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal error');
    });
  });
});

describe('GET /api/spaces/tips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
  });

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await GET(makeGetRequest('/api/spaces/tips', { roomId: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts a request with a valid authenticated session', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

      const tipChain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(tipChain.chain);

      const res = await GET(makeGetRequest('/api/spaces/tips', { roomId: VALID_UUID }));

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalled();
    });
  });

  describe('query parameter validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 400 when roomId query param is missing', async () => {
      const res = await GET(makeGetRequest('/api/spaces/tips', {}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('roomId required');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts a valid roomId and queries tips', async () => {
      const tipChain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(tipChain.chain);

      const res = await GET(makeGetRequest('/api/spaces/tips', { roomId: VALID_UUID }));

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalledWith('tips');
      expect(tipChain.chain.eq).toHaveBeenCalledWith('room_id', VALID_UUID);
    });
  });

  describe('Supabase query', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('queries tips table with select all', async () => {
      const tipChain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(tipChain.chain);

      await GET(makeGetRequest('/api/spaces/tips', { roomId: VALID_UUID }));

      expect(tipChain.chain.select).toHaveBeenCalledWith('*');
    });

    it('filters by room_id equality', async () => {
      const tipChain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(tipChain.chain);

      const roomId = '550e8400-e29b-41d4-a716-446655440001';
      await GET(makeGetRequest('/api/spaces/tips', { roomId }));

      expect(tipChain.chain.eq).toHaveBeenCalledWith('room_id', roomId);
    });

    it('orders by created_at descending', async () => {
      const tipChain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(tipChain.chain);

      await GET(makeGetRequest('/api/spaces/tips', { roomId: VALID_UUID }));

      expect(tipChain.chain.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
    });

    it('limits results to 50', async () => {
      const tipChain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(tipChain.chain);

      await GET(makeGetRequest('/api/spaces/tips', { roomId: VALID_UUID }));

      expect(tipChain.chain.limit).toHaveBeenCalledWith(50);
    });

    it('returns empty array when no tips exist', async () => {
      const tipChain = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(tipChain.chain);

      const res = await GET(makeGetRequest('/api/spaces/tips', { roomId: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.tips).toEqual([]);
    });

    it('returns list of tips when results exist', async () => {
      const tipsData = [
        {
          id: 1,
          room_id: VALID_UUID,
          sender_fid: 100,
          recipient_fid: 200,
          amount: '1.0',
          currency: 'ETH',
          chain: 'base',
          tx_hash: `0x${'a'.repeat(64)}`,
          created_at: '2026-07-15T10:00:00Z',
        },
        {
          id: 2,
          room_id: VALID_UUID,
          sender_fid: 300,
          recipient_fid: 400,
          amount: '0.5',
          currency: 'ETH',
          chain: 'base',
          tx_hash: `0x${'b'.repeat(64)}`,
          created_at: '2026-07-15T09:00:00Z',
        },
      ];
      const tipChain = chainMock({ data: tipsData, error: null });
      mockFrom.mockReturnValue(tipChain.chain);

      const res = await GET(makeGetRequest('/api/spaces/tips', { roomId: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.tips).toEqual(tipsData);
      expect(body.tips).toHaveLength(2);
    });

    it('returns 500 when Supabase query returns an error', async () => {
      const tipChain = chainMock({
        data: null,
        error: new Error('Database connection failed'),
      });
      mockFrom.mockReturnValue(tipChain.chain);

      const res = await GET(makeGetRequest('/api/spaces/tips', { roomId: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch tips');
    });

    it('respects the query chain order (select -> eq -> order -> limit)', async () => {
      const tipChain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(tipChain.chain);

      const callOrder: string[] = [];
      tipChain.chain.select.mockImplementation(() => {
        callOrder.push('select');
        return tipChain.chain;
      });
      tipChain.chain.eq.mockImplementation(() => {
        callOrder.push('eq');
        return tipChain.chain;
      });
      tipChain.chain.order.mockImplementation(() => {
        callOrder.push('order');
        return tipChain.chain;
      });
      tipChain.chain.limit.mockImplementation(() => {
        callOrder.push('limit');
        return tipChain.chain;
      });

      await GET(makeGetRequest('/api/spaces/tips', { roomId: VALID_UUID }));

      expect(callOrder).toEqual(['select', 'eq', 'order', 'limit']);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 500 when getSessionData throws unexpectedly', async () => {
      mockGetSessionData.mockRejectedValue(new Error('Session service down'));

      const res = await GET(makeGetRequest('/api/spaces/tips', { roomId: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal error');
    });

    it('returns 500 on unexpected error in try/catch', async () => {
      const tipChain = chainMock({ data: [], error: null });
      tipChain.chain.then.mockImplementation(() => {
        throw new Error('Unexpected chain error');
      });
      mockFrom.mockReturnValue(tipChain.chain);

      const res = await GET(makeGetRequest('/api/spaces/tips', { roomId: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal error');
    });
  });
});
