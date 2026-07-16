import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
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

import { DELETE, POST } from '../route';

describe('POST /api/spaces/scheduled/[id]/rsvp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
  });

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await POST(makePostRequest('/api/spaces/scheduled/test-id/rsvp', {}), {
        params: Promise.resolve({ id: VALID_UUID }),
      });
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('proceeds when session exists', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

      const insertChain = chainMock({ error: null });
      const countChain = chainMock({ count: 5 });
      const updateChain = chainMock({ error: null });

      mockFrom
        .mockReturnValueOnce(insertChain.chain)
        .mockReturnValueOnce(countChain.chain)
        .mockReturnValueOnce(updateChain.chain);

      const res = await POST(makePostRequest('/api/spaces/scheduled/test-id/rsvp', {}), {
        params: Promise.resolve({ id: VALID_UUID }),
      });

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalled();
    });
  });

  describe('RSVP insertion', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 789 }));
    });

    it('successfully adds an RSVP', async () => {
      const insertChain = chainMock({ error: null });
      const countChain = chainMock({ count: 3 });
      const updateChain = chainMock({ error: null });

      mockFrom
        .mockReturnValueOnce(insertChain.chain)
        .mockReturnValueOnce(countChain.chain)
        .mockReturnValueOnce(updateChain.chain);

      const res = await POST(makePostRequest('/api/spaces/scheduled/test-id/rsvp', {}), {
        params: Promise.resolve({ id: VALID_UUID }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      // Verify insert was called with correct table and data
      expect(insertChain.chain.insert).toHaveBeenCalledWith({
        scheduled_room_id: VALID_UUID,
        fid: 789,
      });

      // Verify count was called
      expect(countChain.chain.select).toHaveBeenCalledWith('*', {
        count: 'exact',
        head: true,
      });
      expect(countChain.chain.eq).toHaveBeenCalledWith('scheduled_room_id', VALID_UUID);

      // Verify update was called with new count
      expect(updateChain.chain.update).toHaveBeenCalledWith({ rsvp_count: 3 });
      expect(updateChain.chain.eq).toHaveBeenCalledWith('id', VALID_UUID);
    });

    it('returns 409 when already RSVPed (duplicate key)', async () => {
      const insertChain = chainMock({ error: { code: '23505' } });

      mockFrom.mockReturnValueOnce(insertChain.chain);

      const res = await POST(makePostRequest('/api/spaces/scheduled/test-id/rsvp', {}), {
        params: Promise.resolve({ id: VALID_UUID }),
      });
      const body = await res.json();

      expect(res.status).toBe(409);
      expect(body.error).toBe('Already RSVPed');
      // Should not proceed to count/update
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });

    it('returns 500 when Supabase insert fails with other error', async () => {
      const insertChain = chainMock({ error: { code: 'PGSQL_ERROR', message: 'DB error' } });

      mockFrom.mockReturnValueOnce(insertChain.chain);

      const res = await POST(makePostRequest('/api/spaces/scheduled/test-id/rsvp', {}), {
        params: Promise.resolve({ id: VALID_UUID }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to RSVP');
    });

    it('returns 500 when Supabase throws an exception during insert', async () => {
      mockFrom.mockImplementationOnce(() => {
        throw new Error('Network error');
      });

      const res = await POST(makePostRequest('/api/spaces/scheduled/test-id/rsvp', {}), {
        params: Promise.resolve({ id: VALID_UUID }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to RSVP');
    });

    it('updates RSVP count even when count is null', async () => {
      const insertChain = chainMock({ error: null });
      const countChain = chainMock({ count: null });
      const updateChain = chainMock({ error: null });

      mockFrom
        .mockReturnValueOnce(insertChain.chain)
        .mockReturnValueOnce(countChain.chain)
        .mockReturnValueOnce(updateChain.chain);

      const res = await POST(makePostRequest('/api/spaces/scheduled/test-id/rsvp', {}), {
        params: Promise.resolve({ id: VALID_UUID }),
      });

      expect(res.status).toBe(200);
      expect(updateChain.chain.update).toHaveBeenCalledWith({ rsvp_count: 0 });
    });
  });

  describe('dynamic route parameters', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('reads id from params promise', async () => {
      const testId = '123e4567-e89b-12d3-a456-426614174000';
      const insertChain = chainMock({ error: null });
      const countChain = chainMock({ count: 1 });
      const updateChain = chainMock({ error: null });

      mockFrom
        .mockReturnValueOnce(insertChain.chain)
        .mockReturnValueOnce(countChain.chain)
        .mockReturnValueOnce(updateChain.chain);

      const res = await POST(makePostRequest('/api/spaces/scheduled/test-id/rsvp', {}), {
        params: Promise.resolve({ id: testId }),
      });

      expect(res.status).toBe(200);
      expect(insertChain.chain.insert).toHaveBeenCalledWith({
        scheduled_room_id: testId,
        fid: expect.any(Number),
      });
    });
  });
});

describe('DELETE /api/spaces/scheduled/[id]/rsvp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
  });

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await DELETE(makePostRequest('/api/spaces/scheduled/test-id/rsvp', {}), {
        params: Promise.resolve({ id: VALID_UUID }),
      });
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('proceeds when session exists', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 999 }));

      const deleteChain = chainMock({ error: null });
      const countChain = chainMock({ count: 2 });
      const updateChain = chainMock({ error: null });

      mockFrom
        .mockReturnValueOnce(deleteChain.chain)
        .mockReturnValueOnce(countChain.chain)
        .mockReturnValueOnce(updateChain.chain);

      const res = await DELETE(makePostRequest('/api/spaces/scheduled/test-id/rsvp', {}), {
        params: Promise.resolve({ id: VALID_UUID }),
      });

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalled();
    });
  });

  describe('RSVP deletion', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 555 }));
    });

    it('successfully removes an RSVP', async () => {
      const deleteChain = chainMock({ error: null });
      const countChain = chainMock({ count: 2 });
      const updateChain = chainMock({ error: null });

      mockFrom
        .mockReturnValueOnce(deleteChain.chain)
        .mockReturnValueOnce(countChain.chain)
        .mockReturnValueOnce(updateChain.chain);

      const res = await DELETE(makePostRequest('/api/spaces/scheduled/test-id/rsvp', {}), {
        params: Promise.resolve({ id: VALID_UUID }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      // Verify delete was called with correct table and conditions
      expect(deleteChain.chain.eq).toHaveBeenNthCalledWith(1, 'scheduled_room_id', VALID_UUID);
      expect(deleteChain.chain.eq).toHaveBeenNthCalledWith(2, 'fid', 555);

      // Verify count was called
      expect(countChain.chain.select).toHaveBeenCalledWith('*', {
        count: 'exact',
        head: true,
      });
      expect(countChain.chain.eq).toHaveBeenCalledWith('scheduled_room_id', VALID_UUID);

      // Verify update was called with new count
      expect(updateChain.chain.update).toHaveBeenCalledWith({ rsvp_count: 2 });
      expect(updateChain.chain.eq).toHaveBeenCalledWith('id', VALID_UUID);
    });

    it('returns 500 when Supabase delete fails', async () => {
      const deleteChain = chainMock({ error: { code: 'PGSQL_ERROR' } });

      mockFrom.mockReturnValueOnce(deleteChain.chain);

      const res = await DELETE(makePostRequest('/api/spaces/scheduled/test-id/rsvp', {}), {
        params: Promise.resolve({ id: VALID_UUID }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to cancel RSVP');
    });

    it('returns 500 when Supabase throws an exception during delete', async () => {
      mockFrom.mockImplementationOnce(() => {
        throw new Error('Network error');
      });

      const res = await DELETE(makePostRequest('/api/spaces/scheduled/test-id/rsvp', {}), {
        params: Promise.resolve({ id: VALID_UUID }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to cancel RSVP');
    });

    it('updates RSVP count even when count is null', async () => {
      const deleteChain = chainMock({ error: null });
      const countChain = chainMock({ count: null });
      const updateChain = chainMock({ error: null });

      mockFrom
        .mockReturnValueOnce(deleteChain.chain)
        .mockReturnValueOnce(countChain.chain)
        .mockReturnValueOnce(updateChain.chain);

      const res = await DELETE(makePostRequest('/api/spaces/scheduled/test-id/rsvp', {}), {
        params: Promise.resolve({ id: VALID_UUID }),
      });

      expect(res.status).toBe(200);
      expect(updateChain.chain.update).toHaveBeenCalledWith({ rsvp_count: 0 });
    });

    it('only deletes RSVPs for the current user', async () => {
      const deleteChain = chainMock({ error: null });
      const countChain = chainMock({ count: 5 });
      const updateChain = chainMock({ error: null });

      mockFrom
        .mockReturnValueOnce(deleteChain.chain)
        .mockReturnValueOnce(countChain.chain)
        .mockReturnValueOnce(updateChain.chain);

      const res = await DELETE(makePostRequest('/api/spaces/scheduled/test-id/rsvp', {}), {
        params: Promise.resolve({ id: VALID_UUID }),
      });

      expect(res.status).toBe(200);
      // Verify fid filter ensures only current user's RSVP is deleted
      expect(deleteChain.chain.eq).toHaveBeenNthCalledWith(2, 'fid', 555);
    });
  });

  describe('dynamic route parameters', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('reads id from params promise', async () => {
      const testId = '550e8400-e29b-41d4-a716-446655440001';
      const deleteChain = chainMock({ error: null });
      const countChain = chainMock({ count: 4 });
      const updateChain = chainMock({ error: null });

      mockFrom
        .mockReturnValueOnce(deleteChain.chain)
        .mockReturnValueOnce(countChain.chain)
        .mockReturnValueOnce(updateChain.chain);

      const res = await DELETE(makePostRequest('/api/spaces/scheduled/test-id/rsvp', {}), {
        params: Promise.resolve({ id: testId }),
      });

      expect(res.status).toBe(200);
      expect(deleteChain.chain.eq).toHaveBeenNthCalledWith(1, 'scheduled_room_id', testId);
    });
  });
});
