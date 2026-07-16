import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

const { mockGetSession, mockGetHindsightClient, mockLogger } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGetHindsightClient: vi.fn(),
  mockLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: () => mockGetSession(),
}));

vi.mock('@/lib/hindsight', () => ({
  getHindsightClient: () => mockGetHindsightClient(),
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

import { POST } from '../route';

describe('POST /api/memory/[userId]/reflect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ fid: undefined });
    mockGetHindsightClient.mockResolvedValue(null);
  });

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSession.mockResolvedValue({ fid: undefined });

      const res = await POST(
        makePostRequest('/api/memory/123/reflect', { prompt: 'test prompt' }),
        {
          params: Promise.resolve({ userId: '123' }),
        },
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('proceeds when session exists with valid fid', async () => {
      mockGetSession.mockResolvedValue({ fid: 123 });
      const mockReflect = vi.fn().mockResolvedValue('Reflection result');
      mockGetHindsightClient.mockResolvedValue({ reflect: mockReflect });

      const res = await POST(
        makePostRequest('/api/memory/123/reflect', { prompt: 'test prompt' }),
        {
          params: Promise.resolve({ userId: '123' }),
        },
      );

      expect(res.status).toBe(200);
      expect(mockReflect).toHaveBeenCalled();
    });
  });

  describe('authorization', () => {
    it('returns 403 when session fid does not match userId', async () => {
      mockGetSession.mockResolvedValue({ fid: 123 });

      const res = await POST(
        makePostRequest('/api/memory/456/reflect', { prompt: 'test prompt' }),
        {
          params: Promise.resolve({ userId: '456' }),
        },
      );
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Forbidden');
    });

    it('allows when session fid matches userId as string', async () => {
      mockGetSession.mockResolvedValue({ fid: 789 });
      const mockReflect = vi.fn().mockResolvedValue('Reflection');
      mockGetHindsightClient.mockResolvedValue({ reflect: mockReflect });

      const res = await POST(
        makePostRequest('/api/memory/789/reflect', { prompt: 'test prompt' }),
        {
          params: Promise.resolve({ userId: '789' }),
        },
      );

      expect(res.status).toBe(200);
      expect(mockReflect).toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ fid: 123 });
    });

    it('returns 400 when prompt is empty string', async () => {
      const res = await POST(makePostRequest('/api/memory/123/reflect', { prompt: '' }), {
        params: Promise.resolve({ userId: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when prompt is missing', async () => {
      const res = await POST(makePostRequest('/api/memory/123/reflect', {}), {
        params: Promise.resolve({ userId: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when prompt exceeds 2000 characters', async () => {
      const longPrompt = 'x'.repeat(2001);
      const res = await POST(makePostRequest('/api/memory/123/reflect', { prompt: longPrompt }), {
        params: Promise.resolve({ userId: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 500 when body is not JSON (caught in try/catch)', async () => {
      const req = new Request(new URL('/api/memory/123/reflect', 'http://localhost:3000'), {
        method: 'POST',
        body: 'not json',
      });

      const res = await POST(req, {
        params: Promise.resolve({ userId: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to reflect on memories');
    });

    it('accepts prompt at exactly 2000 characters', async () => {
      const promptAt2000 = 'x'.repeat(2000);
      mockGetSession.mockResolvedValue({ fid: 123 });
      const mockReflect = vi.fn().mockResolvedValue('Reflection');
      mockGetHindsightClient.mockResolvedValue({ reflect: mockReflect });

      const res = await POST(makePostRequest('/api/memory/123/reflect', { prompt: promptAt2000 }), {
        params: Promise.resolve({ userId: '123' }),
      });

      expect(res.status).toBe(200);
      expect(mockReflect).toHaveBeenCalledWith('123', promptAt2000);
    });
  });

  describe('hindsight integration', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ fid: 123 });
    });

    it('returns 503 when hindsight client is not available', async () => {
      mockGetHindsightClient.mockResolvedValue(null);

      const res = await POST(
        makePostRequest('/api/memory/123/reflect', { prompt: 'test prompt' }),
        {
          params: Promise.resolve({ userId: '123' }),
        },
      );
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.error).toBe('Hindsight not available');
    });

    it('successfully calls hindsight reflect and returns result', async () => {
      const reflectionText = 'You reflected on past experiences';
      const mockReflect = vi.fn().mockResolvedValue(reflectionText);
      mockGetHindsightClient.mockResolvedValue({ reflect: mockReflect });

      const res = await POST(
        makePostRequest('/api/memory/123/reflect', { prompt: 'what did I learn?' }),
        {
          params: Promise.resolve({ userId: '123' }),
        },
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.reflection).toBe(reflectionText);
      expect(mockReflect).toHaveBeenCalledWith('123', 'what did I learn?');
    });

    it('handles hindsight reflect promise rejection', async () => {
      const mockReflect = vi.fn().mockRejectedValue(new Error('Hindsight service error'));
      mockGetHindsightClient.mockResolvedValue({ reflect: mockReflect });

      const res = await POST(makePostRequest('/api/memory/123/reflect', { prompt: 'test' }), {
        params: Promise.resolve({ userId: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to reflect on memories');
    });
  });

  describe('dynamic route parameters', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ fid: 456 });
    });

    it('reads userId from params promise correctly', async () => {
      const mockReflect = vi.fn().mockResolvedValue('Result');
      mockGetHindsightClient.mockResolvedValue({ reflect: mockReflect });

      const testUserId = '456';
      const res = await POST(makePostRequest('/api/memory/456/reflect', { prompt: 'test' }), {
        params: Promise.resolve({ userId: testUserId }),
      });

      expect(res.status).toBe(200);
      expect(mockReflect).toHaveBeenCalledWith(testUserId, expect.any(String));
    });

    it('passes string userId to hindsight, not numeric conversion', async () => {
      const mockReflect = vi.fn().mockResolvedValue('Result');
      mockGetHindsightClient.mockResolvedValue({ reflect: mockReflect });

      mockGetSession.mockResolvedValue({ fid: 999 });

      await POST(makePostRequest('/api/memory/999/reflect', { prompt: 'test' }), {
        params: Promise.resolve({ userId: '999' }),
      });

      expect(mockReflect).toHaveBeenCalledWith('999', expect.any(String));
      const [passedUserId] = mockReflect.mock.calls[0];
      expect(typeof passedUserId).toBe('string');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ fid: 123 });
    });

    it('returns 500 with generic message when unexpected error occurs', async () => {
      mockGetHindsightClient.mockRejectedValue(new Error('Unexpected error'));

      const res = await POST(makePostRequest('/api/memory/123/reflect', { prompt: 'test' }), {
        params: Promise.resolve({ userId: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to reflect on memories');
    });

    it('logs error to logger on exception', async () => {
      mockGetHindsightClient.mockRejectedValue(new Error('Test error'));

      await POST(makePostRequest('/api/memory/123/reflect', { prompt: 'test' }), {
        params: Promise.resolve({ userId: '123' }),
      });

      expect(mockLogger.error).toHaveBeenCalled();
      const [msg, err] = mockLogger.error.mock.calls[0];
      expect(msg).toBe('Failed to reflect on memories:');
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Test error');
    });

    it('does not expose error details to client', async () => {
      mockGetHindsightClient.mockRejectedValue(new Error('Internal DB connection pooled out'));

      const res = await POST(makePostRequest('/api/memory/123/reflect', { prompt: 'test' }), {
        params: Promise.resolve({ userId: '123' }),
      });
      const body = await res.json();

      expect(body.error).toBe('Failed to reflect on memories');
      expect(body.details).toBeUndefined();
    });
  });
});
