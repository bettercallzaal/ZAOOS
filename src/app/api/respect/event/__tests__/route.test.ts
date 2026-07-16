import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makePostRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_UUID,
  VALID_WALLET,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

const { mockAutoCastToZao } = vi.hoisted(() => ({
  mockAutoCastToZao: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/publish/auto-cast', () => ({
  autoCastToZao: mockAutoCastToZao,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

// ============================================================================
// POST /api/respect/event
// ============================================================================

describe('POST /api/respect/event', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
    mockAutoCastToZao.mockResolvedValue(null);
  });

  // --------------------------------------------------------------------------
  // Authentication Tests
  // --------------------------------------------------------------------------

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          event_type: 'introduction',
          amount: 10,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const res = await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          event_type: 'introduction',
          amount: 10,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Input Validation Tests
  // --------------------------------------------------------------------------

  describe('input validation', () => {
    it('returns 400 when member_name is missing', async () => {
      const res = await POST(
        makePostRequest('/api/respect/event', {
          event_type: 'introduction',
          amount: 10,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when member_name is empty string', async () => {
      const res = await POST(
        makePostRequest('/api/respect/event', {
          member_name: '',
          event_type: 'introduction',
          amount: 10,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when event_type is missing', async () => {
      const res = await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          amount: 10,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when event_type is invalid enum value', async () => {
      const res = await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          event_type: 'invalid_type',
          amount: 10,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when amount is missing', async () => {
      const res = await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          event_type: 'introduction',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when amount is not positive', async () => {
      const res = await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          event_type: 'introduction',
          amount: 0,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when amount is negative', async () => {
      const res = await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          event_type: 'introduction',
          amount: -5,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts event_date with valid YYYY-MM-DD format', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(eventChain);

      const res = await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          event_type: 'introduction',
          amount: 10,
          event_date: '2026-07-15',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 400 when event_date has invalid format', async () => {
      const res = await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          event_type: 'introduction',
          amount: 10,
          event_date: '07-15-2026',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts optional wallet_address', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(eventChain);

      const res = await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          event_type: 'introduction',
          amount: 10,
          wallet_address: VALID_WALLET,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('accepts optional wallet_address as null', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(eventChain);

      const res = await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          event_type: 'introduction',
          amount: 10,
          wallet_address: null,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('accepts optional description', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(eventChain);

      const res = await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          event_type: 'introduction',
          amount: 10,
          description: 'Great introduction talk',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('accepts all valid event types', async () => {
      const eventTypes = [
        'introduction',
        'camera',
        'article',
        'hosting',
        'festival',
        'bonus',
        'listing',
        'other',
      ];

      for (const eventType of eventTypes) {
        vi.clearAllMocks();
        const eventChain = chainMock({
          data: { id: '1' },
          error: null,
        }).chain;
        mockFrom.mockReturnValue(eventChain);

        const res = await POST(
          makePostRequest('/api/respect/event', {
            member_name: 'Alice',
            event_type: eventType,
            amount: 10,
          }),
        );

        expect(res.status).toBe(200);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Supabase Interaction Tests
  // --------------------------------------------------------------------------

  describe('Supabase interaction - event creation', () => {
    it('inserts event into respect_events table', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(eventChain);

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          event_type: 'introduction',
          amount: 10,
        }),
      );

      expect(mockFrom).toHaveBeenCalledWith('respect_events');
      expect(vi.mocked(eventChain.insert)).toHaveBeenCalledWith({
        member_name: 'Alice',
        wallet_address: null,
        event_type: 'introduction',
        amount: 10,
        description: null,
        event_date: null,
      });
    });

    it('inserts event with wallet_address when provided', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(eventChain);

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          wallet_address: VALID_WALLET,
          event_type: 'introduction',
          amount: 10,
        }),
      );

      const insertCall = vi.mocked(eventChain.insert);
      const [payload] = insertCall.mock.calls[0] as unknown as [Record<string, unknown>];
      expect(payload.wallet_address).toBe(VALID_WALLET);
    });

    it('inserts event with description when provided', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(eventChain);

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          event_type: 'introduction',
          amount: 10,
          description: 'Test description',
        }),
      );

      const insertCall = vi.mocked(eventChain.insert);
      const [payload] = insertCall.mock.calls[0] as unknown as [Record<string, unknown>];
      expect(payload.description).toBe('Test description');
    });

    it('returns 500 when event insert fails', async () => {
      const dbError = new Error('Insert failed');
      const eventChain = chainMock({
        data: null,
        error: dbError,
      }).chain;
      mockFrom.mockReturnValue(eventChain);

      const res = await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          event_type: 'introduction',
          amount: 10,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to create respect event');
    });
  });

  describe('Supabase interaction - member lookup and update', () => {
    it('queries respect_members by wallet_address first', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;

      const memberChain = chainMock({
        data: null,
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? eventChain : memberChain;
      });

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          wallet_address: VALID_WALLET,
          event_type: 'introduction',
          amount: 10,
        }),
      );

      const memberEqCall = vi.mocked(memberChain.eq);
      expect(memberEqCall).toHaveBeenCalledWith('wallet_address', VALID_WALLET);
    });

    it('falls back to member_name query when wallet_address not found', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;

      const memberChain1 = chainMock({
        data: null,
        error: null,
      }).chain;

      const memberChain2 = chainMock({
        data: null,
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return eventChain;
        if (callCount === 2) return memberChain1;
        return memberChain2;
      });

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          wallet_address: VALID_WALLET,
          event_type: 'introduction',
          amount: 10,
        }),
      );

      const memberChain2EqCall = vi.mocked(memberChain2.eq);
      expect(memberChain2EqCall).toHaveBeenCalledWith('name', 'Alice');
    });

    it('queries by member_name when wallet_address is not provided', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;

      const memberChain = chainMock({
        data: null,
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return eventChain;
        return memberChain;
      });

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          event_type: 'introduction',
          amount: 10,
        }),
      );

      // Should query by member_name, not wallet
      const memberChainEqCall = vi.mocked(memberChain.eq);
      expect(memberChainEqCall).toHaveBeenCalledWith('name', 'Alice');
    });

    it('updates existing member totals when found by wallet', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;

      const memberChain = chainMock({
        data: {
          id: VALID_UUID,
          total_respect: 50,
          event_respect: 30,
          hosting_respect: 0,
          bonus_respect: 20,
          hosting_count: 0,
          first_respect_at: '2026-01-01',
        },
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return eventChain;
        return memberChain;
      });

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          wallet_address: VALID_WALLET,
          event_type: 'introduction',
          amount: 10,
        }),
      );

      expect(mockFrom).toHaveBeenCalledWith('respect_members');
      const updateCall = vi.mocked(memberChain.update);
      expect(updateCall).toHaveBeenCalled();
      const [updates] = updateCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(updates.total_respect).toBe(60); // 50 + 10
      expect(updates.event_respect).toBe(40); // 30 + 10
    });

    it('increments hosting_count for hosting events', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;

      const memberChain = chainMock({
        data: {
          id: VALID_UUID,
          total_respect: 50,
          hosting_respect: 30,
          hosting_count: 2,
          first_respect_at: '2026-01-01',
        },
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return eventChain;
        return memberChain;
      });

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          wallet_address: VALID_WALLET,
          event_type: 'hosting',
          amount: 15,
        }),
      );

      const updateCall = vi.mocked(memberChain.update);
      const [updates] = updateCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(updates.hosting_count).toBe(3); // 2 + 1
      expect(updates.hosting_respect).toBe(45); // 30 + 15
    });

    it('sets first_respect_at when member has no prior respect and event_date provided', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;

      const memberChain = chainMock({
        data: {
          id: VALID_UUID,
          total_respect: 0,
          event_respect: 0,
          first_respect_at: null,
        },
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return eventChain;
        return memberChain;
      });

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          wallet_address: VALID_WALLET,
          event_type: 'introduction',
          amount: 10,
          event_date: '2026-07-15',
        }),
      );

      const updateCall = vi.mocked(memberChain.update);
      const [updates] = updateCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(updates.first_respect_at).toBe('2026-07-15');
    });

    it('does not overwrite first_respect_at when already set', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;

      const memberChain = chainMock({
        data: {
          id: VALID_UUID,
          total_respect: 50,
          event_respect: 30,
          first_respect_at: '2026-01-01',
        },
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return eventChain;
        return memberChain;
      });

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          wallet_address: VALID_WALLET,
          event_type: 'introduction',
          amount: 10,
          event_date: '2026-07-15',
        }),
      );

      const updateCall = vi.mocked(memberChain.update);
      const [updates] = updateCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(updates.first_respect_at).toBeUndefined();
    });
  });

  describe('Supabase interaction - new member creation', () => {
    it('creates new member when not found', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;

      const memberChain = chainMock({
        data: null,
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return eventChain;
        return memberChain;
      });

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'NewMember',
          event_type: 'introduction',
          amount: 20,
        }),
      );

      expect(mockFrom).toHaveBeenCalledWith('respect_members');
      const insertCall = vi.mocked(eventChain.insert as unknown as ReturnType<typeof vi.fn>);
      expect(insertCall).toHaveBeenCalled();
    });

    it('creates new member with all category columns initialized', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;

      const memberChain = chainMock({
        data: null,
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return eventChain;
        return memberChain;
      });

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'NewMember',
          wallet_address: VALID_WALLET,
          event_type: 'introduction',
          amount: 20,
        }),
      );

      // Note: we need to check the last from() call, which creates the member
      const lastFromCall = vi.mocked(mockFrom);
      expect(lastFromCall).toHaveBeenCalledWith('respect_members');
    });

    it('sets hosting_count to 1 for new member with hosting event', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;

      const memberChain = chainMock({
        data: null,
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return eventChain;
        return memberChain;
      });

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'NewMember',
          event_type: 'hosting',
          amount: 15,
        }),
      );

      expect(mockFrom).toHaveBeenCalledWith('respect_members');
    });

    it('sets first_respect_at for new member when event_date provided', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;

      const memberChain = chainMock({
        data: null,
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return eventChain;
        return memberChain;
      });

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'NewMember',
          event_type: 'introduction',
          amount: 10,
          event_date: '2026-07-15',
        }),
      );

      expect(mockFrom).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Milestone and Auto-Cast Tests
  // --------------------------------------------------------------------------

  describe('respect milestone detection and auto-cast', () => {
    it('announces when member reaches 100 respect milestone', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;

      const memberChain = chainMock({
        data: {
          id: VALID_UUID,
          total_respect: 95,
          event_respect: 95,
          hosting_respect: 0,
          bonus_respect: 0,
          first_respect_at: '2026-01-01',
        },
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return eventChain;
        return memberChain;
      });

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          wallet_address: VALID_WALLET,
          event_type: 'introduction',
          amount: 10, // 95 + 10 = 105, crosses 100
        }),
      );

      expect(mockAutoCastToZao).toHaveBeenCalledWith(expect.stringContaining('Alice'));
      expect(mockAutoCastToZao).toHaveBeenCalledWith(expect.stringContaining('100'));
    });

    it('announces when member reaches 500 respect milestone', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;

      const memberChain = chainMock({
        data: {
          id: VALID_UUID,
          total_respect: 490,
          event_respect: 490,
          hosting_respect: 0,
          bonus_respect: 0,
          first_respect_at: '2026-01-01',
        },
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return eventChain;
        return memberChain;
      });

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Bob',
          wallet_address: VALID_WALLET,
          event_type: 'introduction',
          amount: 15, // 490 + 15 = 505, crosses 500
        }),
      );

      expect(mockAutoCastToZao).toHaveBeenCalledWith(expect.stringContaining('Bob'));
      expect(mockAutoCastToZao).toHaveBeenCalledWith(expect.stringContaining('500'));
    });

    it('announces when member reaches 1000 respect milestone', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;

      const memberChain = chainMock({
        data: {
          id: VALID_UUID,
          total_respect: 990,
          event_respect: 990,
          hosting_respect: 0,
          bonus_respect: 0,
          first_respect_at: '2026-01-01',
        },
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return eventChain;
        return memberChain;
      });

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Charlie',
          wallet_address: VALID_WALLET,
          event_type: 'introduction',
          amount: 20, // 990 + 20 = 1010, crosses 1000
        }),
      );

      expect(mockAutoCastToZao).toHaveBeenCalledWith(expect.stringContaining('Charlie'));
      expect(mockAutoCastToZao).toHaveBeenCalledWith(expect.stringContaining('1000'));
    });

    it('announces only once when crossing multiple milestones', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;

      const memberChain = chainMock({
        data: {
          id: VALID_UUID,
          total_respect: 50,
          event_respect: 50,
          hosting_respect: 0,
          bonus_respect: 0,
          first_respect_at: '2026-01-01',
        },
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return eventChain;
        return memberChain;
      });

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Delta',
          wallet_address: VALID_WALLET,
          event_type: 'introduction',
          amount: 600, // 50 + 600 = 650, crosses 100, 500 but announces the first (100)
        }),
      );

      expect(mockAutoCastToZao).toHaveBeenCalledTimes(1);
      expect(mockAutoCastToZao).toHaveBeenCalledWith(expect.stringContaining('Delta'));
      expect(mockAutoCastToZao).toHaveBeenCalledWith(expect.stringContaining('100'));
    });

    it('does not announce when not crossing any milestone', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;

      const memberChain = chainMock({
        data: {
          id: VALID_UUID,
          total_respect: 150,
          event_respect: 150,
          hosting_respect: 0,
          bonus_respect: 0,
          first_respect_at: '2026-01-01',
        },
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return eventChain;
        return memberChain;
      });

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Eve',
          wallet_address: VALID_WALLET,
          event_type: 'introduction',
          amount: 10, // 150 + 10 = 160, no milestone crossed
        }),
      );

      expect(mockAutoCastToZao).not.toHaveBeenCalled();
    });

    it('announces for new member when crossing milestone (0 to amount)', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;

      const memberChain = chainMock({
        data: null, // Member not found by name
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return eventChain;
        return memberChain;
      });

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Frank',
          event_type: 'introduction',
          amount: 150, // 0 + 150 = 150, crosses 100 milestone
        }),
      );

      // autoCastToZao should be called because oldTotal=0, newTotal=150
      expect(mockAutoCastToZao).toHaveBeenCalledWith(expect.stringContaining('Frank'));
      expect(mockAutoCastToZao).toHaveBeenCalledWith(expect.stringContaining('100'));
    });
  });

  // --------------------------------------------------------------------------
  // Error Handling Tests
  // --------------------------------------------------------------------------

  describe('error handling', () => {
    it('returns 500 when JSON parsing fails', async () => {
      const malformedReq = new (await import('next/server')).NextRequest(
        new URL('/api/respect/event', 'http://localhost:3000'),
        {
          method: 'POST',
          body: '{invalid json',
        },
      );

      const res = await POST(malformedReq);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to record respect event');
    });

    it('logs error to logger.error when exception occurs', async () => {
      const { logger } = await import('@/lib/logger');
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          event_type: 'introduction',
          amount: 10,
        }),
      );

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'Record respect event error:',
        expect.any(Error),
      );
    });

    it('returns success with warning when member update fails but event was inserted', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;

      const memberChain = chainMock({
        data: {
          id: VALID_UUID,
          total_respect: 50,
          event_respect: 30,
        },
        error: null,
      }).chain;

      const memberUpdateChain = chainMock({
        data: null,
        error: new Error('Update failed'),
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return eventChain;
        if (callCount === 2) return memberChain;
        return memberUpdateChain;
      });

      const res = await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          wallet_address: VALID_WALLET,
          event_type: 'introduction',
          amount: 10,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.event_id).toBe('1');
      expect(body.warning).toBe('Event recorded but member totals failed to update');
    });

    it('returns success with warning when new member creation fails but event was inserted', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;

      const memberChain = chainMock({
        data: null,
        error: null,
      }).chain;

      const memberInsertChain = chainMock({
        data: null,
        error: new Error('Insert failed'),
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return eventChain;
        if (callCount === 2) return memberChain;
        return memberInsertChain;
      });

      const res = await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'NewMember',
          event_type: 'introduction',
          amount: 10,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.event_id).toBe('1');
      expect(body.warning).toBe('Event recorded but member record failed to create');
    });

    it('does not expose sensitive error details in response', async () => {
      const dbError = new Error('Connection to db.example.com:5432 failed');
      const eventChain = chainMock({
        data: null,
        error: dbError,
      }).chain;
      mockFrom.mockReturnValue(eventChain);

      const res = await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          event_type: 'introduction',
          amount: 10,
        }),
      );
      const body = await res.json();

      expect(body.error).toBe('Failed to create respect event');
      expect(body.details).toBeUndefined();
      expect(body.errorMessage).toBeUndefined();
    });
  });

  // --------------------------------------------------------------------------
  // Success Response Tests
  // --------------------------------------------------------------------------

  describe('success response', () => {
    it('returns 200 with success true and event_id', async () => {
      const eventChain = chainMock({
        data: { id: 'event-123' },
        error: null,
      }).chain;

      mockFrom.mockReturnValue(eventChain);

      const res = await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          event_type: 'introduction',
          amount: 10,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.event_id).toBe('event-123');
    });

    it('returns correct structure with no extra fields on success', async () => {
      const eventChain = chainMock({
        data: { id: '1' },
        error: null,
      }).chain;

      mockFrom.mockReturnValue(eventChain);

      const res = await POST(
        makePostRequest('/api/respect/event', {
          member_name: 'Alice',
          event_type: 'introduction',
          amount: 10,
        }),
      );
      const body = await res.json();

      expect(Object.keys(body).sort()).toEqual(['event_id', 'success'].sort());
    });
  });

  // --------------------------------------------------------------------------
  // Event Type Mapping Tests
  // --------------------------------------------------------------------------

  describe('event type to column mapping', () => {
    const testCases = [
      { type: 'introduction', expectedColumn: 'event_respect' },
      { type: 'camera', expectedColumn: 'event_respect' },
      { type: 'article', expectedColumn: 'event_respect' },
      { type: 'listing', expectedColumn: 'event_respect' },
      { type: 'other', expectedColumn: 'event_respect' },
      { type: 'hosting', expectedColumn: 'hosting_respect' },
      { type: 'festival', expectedColumn: 'bonus_respect' },
      { type: 'bonus', expectedColumn: 'bonus_respect' },
    ];

    for (const { type, expectedColumn } of testCases) {
      it(`maps ${type} to ${expectedColumn}`, async () => {
        const eventChain = chainMock({
          data: { id: '1' },
          error: null,
        }).chain;

        const memberChain = chainMock({
          data: {
            id: VALID_UUID,
            total_respect: 50,
            event_respect: 30,
            hosting_respect: 0,
            bonus_respect: 20,
            hosting_count: 0,
            first_respect_at: '2026-01-01',
          },
          error: null,
        }).chain;

        let callCount = 0;
        mockFrom.mockImplementation(() => {
          callCount += 1;
          if (callCount === 1) return eventChain;
          return memberChain;
        });

        await POST(
          makePostRequest('/api/respect/event', {
            member_name: 'Alice',
            wallet_address: VALID_WALLET,
            event_type: type,
            amount: 10,
          }),
        );

        const updateCall = vi.mocked(memberChain.update);
        const [updates] = updateCall.mock.calls[0] as unknown as [Record<string, unknown>];

        expect(updates[expectedColumn]).toBeDefined();
      });
    }
  });
});
