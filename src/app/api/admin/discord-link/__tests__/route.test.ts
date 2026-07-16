import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makePostRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_UUID,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

const { mockGetClientIp, mockLogAuditEvent } = vi.hoisted(() => ({
  mockGetClientIp: vi.fn(),
  mockLogAuditEvent: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/db/audit-log', () => ({
  getClientIp: mockGetClientIp,
  logAuditEvent: mockLogAuditEvent,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET, PATCH, POST } from '../route';

// ============================================================================
// GET /api/admin/discord-link
// ============================================================================

describe('GET /api/admin/discord-link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
    mockGetClientIp.mockReturnValue('192.168.1.1');
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('Supabase interaction', () => {
    it('queries users table with correct fields and filters', async () => {
      const usersChain = chainMock({ data: [], error: null }).chain;
      const introsChain = chainMock({ data: [], error: null }).chain;
      const proposalsChain = chainMock({ data: [], error: null }).chain;
      const votesChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return usersChain;
        if (callCount === 2) return introsChain;
        if (callCount === 3) return proposalsChain;
        return votesChain;
      });

      await GET();

      expect(mockFrom).toHaveBeenNthCalledWith(1, 'users');
      const usersSelect = vi.mocked(usersChain.select);
      expect(usersSelect).toHaveBeenCalledWith(
        'id, primary_wallet, fid, username, display_name, pfp_url, discord_id, role, is_active, created_at',
      );
      expect(usersChain.eq).toHaveBeenCalledWith('is_active', true);
      expect(usersChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('queries discord_intros table for discord_id', async () => {
      const usersChain = chainMock({ data: [], error: null }).chain;
      const introsChain = chainMock({ data: [], error: null }).chain;
      const proposalsChain = chainMock({ data: [], error: null }).chain;
      const votesChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return usersChain;
        if (callCount === 2) return introsChain;
        if (callCount === 3) return proposalsChain;
        return votesChain;
      });

      await GET();

      expect(mockFrom).toHaveBeenNthCalledWith(2, 'discord_intros');
      expect(introsChain.select).toHaveBeenCalledWith('discord_id');
    });

    it('queries discord_proposals table for author_id', async () => {
      const usersChain = chainMock({ data: [], error: null }).chain;
      const introsChain = chainMock({ data: [], error: null }).chain;
      const proposalsChain = chainMock({ data: [], error: null }).chain;
      const votesChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return usersChain;
        if (callCount === 2) return introsChain;
        if (callCount === 3) return proposalsChain;
        return votesChain;
      });

      await GET();

      expect(mockFrom).toHaveBeenNthCalledWith(3, 'discord_proposals');
      expect(proposalsChain.select).toHaveBeenCalledWith('author_id');
    });

    it('queries discord_proposal_votes table for voter_id', async () => {
      const usersChain = chainMock({ data: [], error: null }).chain;
      const introsChain = chainMock({ data: [], error: null }).chain;
      const proposalsChain = chainMock({ data: [], error: null }).chain;
      const votesChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return usersChain;
        if (callCount === 2) return introsChain;
        if (callCount === 3) return proposalsChain;
        return votesChain;
      });

      await GET();

      expect(mockFrom).toHaveBeenNthCalledWith(4, 'discord_proposal_votes');
      expect(votesChain.select).toHaveBeenCalledWith('voter_id');
    });
  });

  describe('data enrichment', () => {
    it('enriches users with discord link status and counts', async () => {
      const userId = VALID_UUID;
      const discordId = 'discord-123';
      const userData = [
        {
          id: userId,
          primary_wallet: '0xabc',
          fid: 100,
          username: 'testuser',
          display_name: 'Test User',
          pfp_url: 'https://example.com/pfp.jpg',
          discord_id: discordId,
          role: 'user',
          is_active: true,
          created_at: '2026-01-01',
        },
      ];
      const introsData = [{ discord_id: discordId }];
      const proposalsData = [{ author_id: discordId }, { author_id: discordId }];
      const votesData = [{ voter_id: discordId }, { voter_id: discordId }, { voter_id: discordId }];

      const usersChain = chainMock({ data: userData, error: null }).chain;
      const introsChain = chainMock({ data: introsData, error: null }).chain;
      const proposalsChain = chainMock({ data: proposalsData, error: null }).chain;
      const votesChain = chainMock({ data: votesData, error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return usersChain;
        if (callCount === 2) return introsChain;
        if (callCount === 3) return proposalsChain;
        return votesChain;
      });

      const res = await GET();
      const body = await res.json();

      expect(body.users[0]).toEqual(
        expect.objectContaining({
          id: userId,
          discord_id: discordId,
          has_intro: true,
          proposal_count: 2,
          vote_count: 3,
        }),
      );
    });

    it('sets has_intro to false when user has no discord_id', async () => {
      const userData = [
        {
          id: VALID_UUID,
          primary_wallet: '0xabc',
          fid: 100,
          username: 'testuser',
          display_name: 'Test User',
          pfp_url: 'https://example.com/pfp.jpg',
          discord_id: null,
          role: 'user',
          is_active: true,
          created_at: '2026-01-01',
        },
      ];

      const usersChain = chainMock({ data: userData, error: null }).chain;
      const introsChain = chainMock({ data: [], error: null }).chain;
      const proposalsChain = chainMock({ data: [], error: null }).chain;
      const votesChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return usersChain;
        if (callCount === 2) return introsChain;
        if (callCount === 3) return proposalsChain;
        return votesChain;
      });

      const res = await GET();
      const body = await res.json();

      expect(body.users[0].has_intro).toBe(false);
      expect(body.users[0].proposal_count).toBe(0);
      expect(body.users[0].vote_count).toBe(0);
    });

    it('calculates correct stats with linked and unlinked users', async () => {
      const userData = [
        {
          id: VALID_UUID,
          primary_wallet: '0xabc',
          fid: 100,
          username: 'user1',
          display_name: 'User 1',
          pfp_url: null,
          discord_id: 'discord-1',
          role: 'user',
          is_active: true,
          created_at: '2026-01-01',
        },
        {
          id: VALID_UUID,
          primary_wallet: '0xdef',
          fid: 200,
          username: 'user2',
          display_name: 'User 2',
          pfp_url: null,
          discord_id: null,
          role: 'user',
          is_active: true,
          created_at: '2026-01-02',
        },
        {
          id: VALID_UUID,
          primary_wallet: '0x123',
          fid: 300,
          username: 'user3',
          display_name: 'User 3',
          pfp_url: null,
          discord_id: 'discord-3',
          role: 'user',
          is_active: true,
          created_at: '2026-01-03',
        },
      ];

      const usersChain = chainMock({ data: userData, error: null }).chain;
      const introsChain = chainMock({ data: [{ discord_id: 'discord-1' }], error: null }).chain;
      const proposalsChain = chainMock({ data: [], error: null }).chain;
      const votesChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return usersChain;
        if (callCount === 2) return introsChain;
        if (callCount === 3) return proposalsChain;
        return votesChain;
      });

      const res = await GET();
      const body = await res.json();

      expect(body.stats).toEqual({
        linked: 2,
        unlinked: 1,
        introCount: 1,
      });
    });
  });

  describe('error handling', () => {
    it('returns 500 when users query fails', async () => {
      const dbError = new Error('Database connection failed');
      const usersChain = chainMock({ data: null, error: dbError }).chain;
      mockFrom.mockReturnValue(usersChain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch users');
    });

    it('continues when intros query fails (optional)', async () => {
      const userData = [
        {
          id: VALID_UUID,
          primary_wallet: '0xabc',
          fid: 100,
          username: 'testuser',
          display_name: 'Test User',
          pfp_url: null,
          discord_id: 'discord-1',
          role: 'user',
          is_active: true,
          created_at: '2026-01-01',
        },
      ];

      const usersChain = chainMock({ data: userData, error: null }).chain;
      const introsChain = chainMock({ data: null, error: new Error('Query failed') }).chain;
      const proposalsChain = chainMock({ data: [], error: null }).chain;
      const votesChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return usersChain;
        if (callCount === 2) return introsChain;
        if (callCount === 3) return proposalsChain;
        return votesChain;
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.users).toHaveLength(1);
    });

    it('returns 500 when unexpected exception is thrown', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch discord link data');
    });

    it('logs errors to logger.error', async () => {
      const { logger } = await import('@/lib/logger');
      const dbError = new Error('Database error');
      const usersChain = chainMock({ data: null, error: dbError }).chain;
      mockFrom.mockReturnValue(usersChain);

      await GET();

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        '[discord-link] Users query error:',
        expect.any(Error),
      );
    });
  });

  describe('success response', () => {
    it('returns 200 with users array and stats', async () => {
      const usersChain = chainMock({ data: [], error: null }).chain;
      const introsChain = chainMock({ data: [], error: null }).chain;
      const proposalsChain = chainMock({ data: [], error: null }).chain;
      const votesChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return usersChain;
        if (callCount === 2) return introsChain;
        if (callCount === 3) return proposalsChain;
        return votesChain;
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveProperty('users');
      expect(body).toHaveProperty('stats');
      expect(Array.isArray(body.users)).toBe(true);
      expect(body.stats).toHaveProperty('linked');
      expect(body.stats).toHaveProperty('unlinked');
      expect(body.stats).toHaveProperty('introCount');
    });
  });
});

// ============================================================================
// PATCH /api/admin/discord-link
// ============================================================================

describe('PATCH /api/admin/discord-link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
    mockGetClientIp.mockReturnValue('192.168.1.1');
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const req = makePostRequest('/api/admin/discord-link', {
        userId: VALID_UUID,
        discordId: 'discord-123',
      });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const req = makePostRequest('/api/admin/discord-link', {
        userId: VALID_UUID,
        discordId: 'discord-123',
      });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('returns 400 when userId is missing', async () => {
      const req = makePostRequest('/api/admin/discord-link', {
        discordId: 'discord-123',
      });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when userId is not a valid UUID', async () => {
      const req = makePostRequest('/api/admin/discord-link', {
        userId: 'not-a-uuid',
        discordId: 'discord-123',
      });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when discordId is empty string', async () => {
      const req = makePostRequest('/api/admin/discord-link', {
        userId: VALID_UUID,
        discordId: '',
      });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts valid UUID and discord ID for linking', async () => {
      const checkChain = chainMock({ data: null, error: null }).chain;
      const updateChain = chainMock({
        data: { id: VALID_UUID, discord_id: 'discord-123', display_name: 'Test', username: 'test' },
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? checkChain : updateChain;
      });

      const req = makePostRequest('/api/admin/discord-link', {
        userId: VALID_UUID,
        discordId: 'discord-123',
      });
      const res = await PATCH(req);

      expect(res.status).toBe(200);
    });

    it('accepts null discordId for unlinking', async () => {
      const chain = chainMock({
        data: { id: VALID_UUID, discord_id: null, display_name: 'Test', username: 'test' },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/admin/discord-link', {
        userId: VALID_UUID,
        discordId: null,
      });
      const res = await PATCH(req);

      expect(res.status).toBe(200);
    });
  });

  describe('duplicate link prevention', () => {
    it('returns 409 when discord_id is already linked to another user', async () => {
      const discordId = 'discord-123';
      const otherUserId = 'other-uuid-1234-5678-90ab-cdef12345678';

      const checkChain = chainMock({
        data: { id: otherUserId, display_name: 'Other User' },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(checkChain);

      const req = makePostRequest('/api/admin/discord-link', {
        userId: VALID_UUID,
        discordId,
      });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(409);
      expect(body.error).toContain('already linked to Other User');
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('does not prevent linking when user unlinking (discordId is null)', async () => {
      const updateChain = chainMock({
        data: { id: VALID_UUID, discord_id: null, display_name: 'Test', username: 'test' },
        error: null,
      }).chain;

      let _callCount = 0;
      mockFrom.mockImplementation(() => {
        _callCount += 1;
        return updateChain;
      });

      const req = makePostRequest('/api/admin/discord-link', {
        userId: VALID_UUID,
        discordId: null,
      });
      const res = await PATCH(req);

      expect(res.status).toBe(200);
    });
  });

  describe('Supabase update', () => {
    it('updates users table with discord_id', async () => {
      const checkChain = chainMock({ data: null, error: null }).chain;
      const updateChain = chainMock({
        data: { id: VALID_UUID, discord_id: 'discord-123', display_name: 'Test', username: 'test' },
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? checkChain : updateChain;
      });

      const req = makePostRequest('/api/admin/discord-link', {
        userId: VALID_UUID,
        discordId: 'discord-123',
      });
      await PATCH(req);

      expect(mockFrom).toHaveBeenCalledWith('users');
      expect(updateChain.update).toHaveBeenCalledWith({ discord_id: 'discord-123' });
      expect(updateChain.eq).toHaveBeenCalledWith('id', VALID_UUID);
    });

    it('updates users table with null discord_id for unlink', async () => {
      const updateChain = chainMock({
        data: { id: VALID_UUID, discord_id: null, display_name: 'Test', username: 'test' },
        error: null,
      }).chain;

      let _callCount = 0;
      mockFrom.mockImplementation(() => {
        _callCount += 1;
        return updateChain;
      });

      const req = makePostRequest('/api/admin/discord-link', {
        userId: VALID_UUID,
        discordId: null,
      });
      await PATCH(req);

      expect(updateChain.update).toHaveBeenCalledWith({ discord_id: null });
    });

    it('returns 500 when update fails', async () => {
      const updateChain = chainMock({
        data: null,
        error: new Error('Update failed'),
      }).chain;
      mockFrom.mockReturnValue(updateChain);

      const req = makePostRequest('/api/admin/discord-link', {
        userId: VALID_UUID,
        discordId: 'discord-123',
      });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to update discord link');
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('audit logging', () => {
    it('logs audit event for link action', async () => {
      const checkChain = chainMock({ data: null, error: null }).chain;
      const updateChain = chainMock({
        data: { id: VALID_UUID, discord_id: 'discord-123', display_name: 'Test', username: 'test' },
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? checkChain : updateChain;
      });

      const req = makePostRequest('/api/admin/discord-link', {
        userId: VALID_UUID,
        discordId: 'discord-123',
      });
      await PATCH(req);

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 123,
          action: 'discord.link',
          targetType: 'user',
          targetId: VALID_UUID,
          details: { discord_id: 'discord-123' },
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('logs audit event for unlink action', async () => {
      const updateChain = chainMock({
        data: { id: VALID_UUID, discord_id: null, display_name: 'Test', username: 'test' },
        error: null,
      }).chain;

      let _callCount = 0;
      mockFrom.mockImplementation(() => {
        _callCount += 1;
        return updateChain;
      });

      const req = makePostRequest('/api/admin/discord-link', {
        userId: VALID_UUID,
        discordId: null,
      });
      await PATCH(req);

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 123,
          action: 'discord.unlink',
          targetType: 'user',
          targetId: VALID_UUID,
          details: { discord_id: null },
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('calls getClientIp with the request', async () => {
      const checkChain = chainMock({ data: null, error: null }).chain;
      const updateChain = chainMock({
        data: { id: VALID_UUID, discord_id: 'discord-123', display_name: 'Test', username: 'test' },
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? checkChain : updateChain;
      });

      const req = makePostRequest('/api/admin/discord-link', {
        userId: VALID_UUID,
        discordId: 'discord-123',
      });
      await PATCH(req);

      expect(mockGetClientIp).toHaveBeenCalledWith(req);
    });

    it('includes correct admin fid in audit event', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
      const checkChain = chainMock({ data: null, error: null }).chain;
      const updateChain = chainMock({
        data: { id: VALID_UUID, discord_id: 'discord-123', display_name: 'Test', username: 'test' },
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? checkChain : updateChain;
      });

      const req = makePostRequest('/api/admin/discord-link', {
        userId: VALID_UUID,
        discordId: 'discord-123',
      });
      await PATCH(req);

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 999,
        }),
      );
    });
  });

  describe('success response', () => {
    it('returns 200 with ok=true and action=linked', async () => {
      const userData = {
        id: VALID_UUID,
        discord_id: 'discord-123',
        display_name: 'Test',
        username: 'test',
      };
      const checkChain = chainMock({ data: null, error: null }).chain;
      const updateChain = chainMock({
        data: userData,
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? checkChain : updateChain;
      });

      const req = makePostRequest('/api/admin/discord-link', {
        userId: VALID_UUID,
        discordId: 'discord-123',
      });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.action).toBe('linked');
      expect(body.user).toEqual(userData);
    });

    it('returns 200 with action=unlinked for null discord_id', async () => {
      const userData = {
        id: VALID_UUID,
        discord_id: null,
        display_name: 'Test',
        username: 'test',
      };
      const updateChain = chainMock({
        data: userData,
        error: null,
      }).chain;

      let _callCount = 0;
      mockFrom.mockImplementation(() => {
        _callCount += 1;
        return updateChain;
      });

      const req = makePostRequest('/api/admin/discord-link', {
        userId: VALID_UUID,
        discordId: null,
      });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.action).toBe('unlinked');
      expect(body.user).toEqual(userData);
    });
  });

  describe('error handling', () => {
    it('returns 500 when request body is not valid JSON', async () => {
      const malformedReq = new (await import('next/server')).NextRequest(
        new URL('/api/admin/discord-link', 'http://localhost:3000'),
        {
          method: 'PATCH',
          body: '{invalid json',
        },
      );

      const res = await PATCH(malformedReq);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to update discord link');
    });

    it('logs error to logger.error when exception occurs', async () => {
      const { logger } = await import('@/lib/logger');
      mockFrom.mockImplementation(() => {
        throw new Error('Patch failed');
      });

      const req = makePostRequest('/api/admin/discord-link', {
        userId: VALID_UUID,
        discordId: 'discord-123',
      });
      await PATCH(req);

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        '[discord-link] PATCH error:',
        expect.any(Error),
      );
    });
  });
});

// ============================================================================
// POST /api/admin/discord-link (bulk auto-link)
// ============================================================================

describe('POST /api/admin/discord-link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
    mockGetClientIp.mockReturnValue('192.168.1.1');
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const req = makePostRequest('/api/admin/discord-link', {
        preview: true,
        walletMap: {},
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const req = makePostRequest('/api/admin/discord-link', {
        preview: true,
        walletMap: {},
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('returns 400 when walletMap is missing', async () => {
      const req = makePostRequest('/api/admin/discord-link', {
        preview: true,
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('walletMap is required');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when walletMap is empty', async () => {
      const req = makePostRequest('/api/admin/discord-link', {
        preview: true,
        walletMap: {},
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('walletMap is required');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts preview=true (default)', async () => {
      const chain = chainMock({ data: [], error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/admin/discord-link', {
        walletMap: { 'discord-1': '0xabc' },
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
    });

    it('accepts preview=false for execution mode', async () => {
      const chain = chainMock({ data: [], error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/admin/discord-link', {
        preview: false,
        walletMap: { 'discord-1': '0xabc' },
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
    });

    it('returns 400 when preview is not a boolean', async () => {
      const req = makePostRequest('/api/admin/discord-link', {
        preview: 'yes',
        walletMap: { 'discord-1': '0xabc' },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });
  });

  describe('preview mode', () => {
    it('returns preview response without executing updates', async () => {
      const userData = [
        {
          id: VALID_UUID,
          primary_wallet: '0xabc',
          discord_id: null,
          display_name: 'Test User',
          username: 'testuser',
          verified_addresses: [],
          custody_address: null,
        },
      ];

      const chain = chainMock({ data: userData, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/admin/discord-link', {
        preview: true,
        walletMap: { 'discord-1': '0xabc' },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.preview).toBe(true);
      expect(body.matches).toHaveLength(1);
      expect(body.alreadyLinked).toBe(0);
      expect(body.total).toBe(1);
    });

    it('normalizes wallet addresses to lowercase in preview', async () => {
      const userData = [
        {
          id: VALID_UUID,
          primary_wallet: '0xABC',
          discord_id: null,
          display_name: 'Test User',
          username: 'testuser',
          verified_addresses: [],
          custody_address: null,
        },
      ];

      const chain = chainMock({ data: userData, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/admin/discord-link', {
        preview: true,
        walletMap: { 'discord-1': '0xabc' },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(body.matches).toHaveLength(1);
      expect(body.matches[0].wallet).toBe('0xabc');
    });

    it('categorizes users correctly in preview', async () => {
      const userData = [
        {
          id: 'id-1',
          primary_wallet: '0xmatch',
          discord_id: null,
          display_name: 'Matched User',
          username: 'matched',
          verified_addresses: [],
          custody_address: null,
        },
        {
          id: 'id-2',
          primary_wallet: '0xalready',
          discord_id: 'existing-discord',
          display_name: 'Already Linked',
          username: 'already',
          verified_addresses: [],
          custody_address: null,
        },
        {
          id: 'id-3',
          primary_wallet: '0xnomatch',
          discord_id: null,
          display_name: 'No Match',
          username: 'nomatch',
          verified_addresses: [],
          custody_address: null,
        },
      ];

      const chain = chainMock({ data: userData, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/admin/discord-link', {
        preview: true,
        walletMap: { 'discord-1': '0xmatch' },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(body.matches).toHaveLength(1);
      expect(body.alreadyLinked).toBe(1);
      expect(body.noMatch).toBe(1);
      expect(body.total).toBe(3);
    });
  });

  describe('execution mode', () => {
    it('executes links when preview=false', async () => {
      const userData = [
        {
          id: VALID_UUID,
          primary_wallet: '0xabc',
          discord_id: null,
          display_name: 'Test User',
          username: 'testuser',
          verified_addresses: [],
          custody_address: null,
        },
      ];

      const usersChain = chainMock({ data: userData, error: null }).chain;
      const checkChain = chainMock({ data: null, error: null }).chain;
      const updateChain = chainMock({ error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return usersChain;
        if (callCount === 2) return checkChain;
        return updateChain;
      });

      const req = makePostRequest('/api/admin/discord-link', {
        preview: false,
        walletMap: { 'discord-1': '0xabc' },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.preview).toBe(false);
      expect(body.linked).toBe(1);
    });

    it('prevents duplicate discord_id linking in execute mode', async () => {
      const userData = [
        {
          id: VALID_UUID,
          primary_wallet: '0xabc',
          discord_id: null,
          display_name: 'Test User',
          username: 'testuser',
          verified_addresses: [],
          custody_address: null,
        },
      ];

      const usersChain = chainMock({ data: userData, error: null }).chain;
      const checkChain = chainMock({
        data: { id: 'other-id' },
        error: null,
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? usersChain : checkChain;
      });

      const req = makePostRequest('/api/admin/discord-link', {
        preview: false,
        walletMap: { 'discord-1': '0xabc' },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(body.linked).toBe(0);
      expect(body.errors).toHaveLength(1);
      expect(body.errors[0]).toContain('already on another user');
    });

    it('handles mixed success and errors in execute mode', async () => {
      const userData = [
        {
          id: 'id-1',
          primary_wallet: '0xabc',
          discord_id: null,
          display_name: 'Success User',
          username: 'success',
          verified_addresses: [],
          custody_address: null,
        },
        {
          id: 'id-2',
          primary_wallet: '0xdef',
          discord_id: null,
          display_name: 'Error User',
          username: 'error',
          verified_addresses: [],
          custody_address: null,
        },
      ];

      const usersChain = chainMock({ data: userData, error: null }).chain;
      const checkChain1 = chainMock({ data: null, error: null }).chain;
      const updateChain1 = chainMock({ error: null }).chain;
      const checkChain2 = chainMock({ data: null, error: null }).chain;
      const updateChain2 = chainMock({
        error: new Error('Update failed'),
      }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return usersChain;
        if (callCount === 2) return checkChain1;
        if (callCount === 3) return updateChain1;
        if (callCount === 4) return checkChain2;
        return updateChain2;
      });

      const req = makePostRequest('/api/admin/discord-link', {
        preview: false,
        walletMap: { 'discord-1': '0xabc', 'discord-2': '0xdef' },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(body.linked).toBe(1);
      expect(body.errors).toHaveLength(1);
    });

    it('matches against custody_address', async () => {
      const userData = [
        {
          id: VALID_UUID,
          primary_wallet: '0xprimary',
          discord_id: null,
          display_name: 'Test User',
          username: 'test',
          verified_addresses: [],
          custody_address: '0xcustody',
        },
      ];

      const usersChain = chainMock({ data: userData, error: null }).chain;
      const checkChain = chainMock({ data: null, error: null }).chain;
      const updateChain = chainMock({ error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return usersChain;
        if (callCount === 2) return checkChain;
        return updateChain;
      });

      const req = makePostRequest('/api/admin/discord-link', {
        preview: false,
        walletMap: { 'discord-1': '0xcustody' },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(body.linked).toBe(1);
    });

    it('matches against verified_addresses', async () => {
      const userData = [
        {
          id: VALID_UUID,
          primary_wallet: '0xprimary',
          discord_id: null,
          display_name: 'Test User',
          username: 'test',
          verified_addresses: ['0xverified1', '0xverified2'],
          custody_address: null,
        },
      ];

      const usersChain = chainMock({ data: userData, error: null }).chain;
      const checkChain = chainMock({ data: null, error: null }).chain;
      const updateChain = chainMock({ error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return usersChain;
        if (callCount === 2) return checkChain;
        return updateChain;
      });

      const req = makePostRequest('/api/admin/discord-link', {
        preview: false,
        walletMap: { 'discord-1': '0xverified2' },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(body.linked).toBe(1);
    });
  });

  describe('audit logging', () => {
    it('logs audit event for bulk link action', async () => {
      const userData = [
        {
          id: VALID_UUID,
          primary_wallet: '0xabc',
          discord_id: null,
          display_name: 'Test User',
          username: 'test',
          verified_addresses: [],
          custody_address: null,
        },
      ];

      const usersChain = chainMock({ data: userData, error: null }).chain;
      const checkChain = chainMock({ data: null, error: null }).chain;
      const updateChain = chainMock({ error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return usersChain;
        if (callCount === 2) return checkChain;
        return updateChain;
      });

      const req = makePostRequest('/api/admin/discord-link', {
        preview: false,
        walletMap: { 'discord-1': '0xabc' },
      });
      await POST(req);

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 123,
          action: 'discord.bulk_link',
          targetType: 'system',
          details: expect.objectContaining({
            linked: expect.any(Number),
          }),
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('only logs audit event in execute mode (not preview)', async () => {
      const userData = [
        {
          id: VALID_UUID,
          primary_wallet: '0xabc',
          discord_id: null,
          display_name: 'Test User',
          username: 'test',
          verified_addresses: [],
          custody_address: null,
        },
      ];

      const chain = chainMock({ data: userData, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/admin/discord-link', {
        preview: true,
        walletMap: { 'discord-1': '0xabc' },
      });
      await POST(req);

      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('includes correct admin fid in audit event', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
      const userData = [
        {
          id: VALID_UUID,
          primary_wallet: '0xabc',
          discord_id: null,
          display_name: 'Test User',
          username: 'test',
          verified_addresses: [],
          custody_address: null,
        },
      ];

      const usersChain = chainMock({ data: userData, error: null }).chain;
      const checkChain = chainMock({ data: null, error: null }).chain;
      const updateChain = chainMock({ error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return usersChain;
        if (callCount === 2) return checkChain;
        return updateChain;
      });

      const req = makePostRequest('/api/admin/discord-link', {
        preview: false,
        walletMap: { 'discord-1': '0xabc' },
      });
      await POST(req);

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 999,
        }),
      );
    });
  });

  describe('error handling', () => {
    it('returns 500 when users query fails', async () => {
      const chain = chainMock({ data: null, error: new Error('Query failed') }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/admin/discord-link', {
        preview: true,
        walletMap: { 'discord-1': '0xabc' },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch users');
    });

    it('returns 500 when request body is not valid JSON', async () => {
      const malformedReq = new (await import('next/server')).NextRequest(
        new URL('/api/admin/discord-link', 'http://localhost:3000'),
        {
          method: 'POST',
          body: '{invalid json',
        },
      );

      const res = await POST(malformedReq);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Bulk link failed');
    });

    it('logs error to logger.error when exception occurs', async () => {
      const { logger } = await import('@/lib/logger');
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const req = makePostRequest('/api/admin/discord-link', {
        preview: false,
        walletMap: { 'discord-1': '0xabc' },
      });
      await POST(req);

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        '[discord-link] POST error:',
        expect.any(Error),
      );
    });
  });

  describe('success response', () => {
    it('returns preview response with correct structure', async () => {
      const chain = chainMock({ data: [], error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/admin/discord-link', {
        preview: true,
        walletMap: { 'discord-1': '0xabc' },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({
        preview: true,
        matches: [],
        alreadyLinked: 0,
        noMatch: 0,
        total: 0,
      });
    });

    it('returns execute response with correct structure', async () => {
      const chain = chainMock({ data: [], error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/admin/discord-link', {
        preview: false,
        walletMap: { 'discord-1': '0xabc' },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.preview).toBe(false);
      expect(body).toHaveProperty('linked');
      expect(body).toHaveProperty('alreadyLinked');
      expect(body).toHaveProperty('noMatch');
      expect(body).toHaveProperty('errors');
      expect(body).toHaveProperty('total');
    });
  });
});
