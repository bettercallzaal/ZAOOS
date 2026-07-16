import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAdminSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const mockEnv = vi.hoisted(() => ({
  JUKE_API_KEY: 'jk_sec_live_test' as string | undefined,
}));

const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/env', () => ({ ENV: mockEnv }));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Mock global fetch
global.fetch = vi.fn();

import { POST } from '../route';

describe('POST /api/juke/admin/agent-join', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.JUKE_API_KEY = 'jk_sec_live_test';
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    vi.mocked(global.fetch).mockClear();
  });

  describe('authorization', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await POST(
        makePostRequest('/api/juke/admin/agent-join', { spaceId: 'test-space' }),
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Admin only');
    });

    it('returns 401 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue({
        fid: 123,
        username: 'regularuser',
        displayName: 'Regular User',
        isAdmin: false,
      });

      const res = await POST(
        makePostRequest('/api/juke/admin/agent-join', { spaceId: 'test-space' }),
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Admin only');
      expect(vi.mocked(global.fetch)).not.toHaveBeenCalled();
    });
  });

  describe('configuration', () => {
    it('returns 503 when JUKE_API_KEY is not configured', async () => {
      mockEnv.JUKE_API_KEY = undefined;

      const res = await POST(
        makePostRequest('/api/juke/admin/agent-join', { spaceId: 'test-space' }),
      );
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.error).toContain('JUKE_API_KEY not configured on the server');
    });
  });

  describe('request validation', () => {
    it('returns 400 when body is not valid JSON', async () => {
      const res = await POST(
        new (await import('next/server')).NextRequest(
          new URL('/api/juke/admin/agent-join', 'http://localhost:3000'),
          {
            method: 'POST',
            body: '{not json',
          },
        ),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Request body must be valid JSON');
    });

    it('returns 400 when spaceId is missing', async () => {
      const res = await POST(makePostRequest('/api/juke/admin/agent-join', { agentName: 'ZOE' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid body');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when spaceId is empty', async () => {
      const res = await POST(
        makePostRequest('/api/juke/admin/agent-join', { spaceId: '', agentName: 'ZOE' }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid body');
    });

    it('returns 400 when spaceId exceeds max length', async () => {
      const res = await POST(
        makePostRequest('/api/juke/admin/agent-join', {
          spaceId: 'a'.repeat(129),
          agentName: 'ZOE',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid body');
    });

    it('returns 400 when agentName exceeds max length', async () => {
      const res = await POST(
        makePostRequest('/api/juke/admin/agent-join', {
          spaceId: 'test-space',
          agentName: 'a'.repeat(65),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid body');
    });

    it('returns 400 when agentPfpUrl is not a valid URL', async () => {
      const res = await POST(
        makePostRequest('/api/juke/admin/agent-join', {
          spaceId: 'test-space',
          agentPfpUrl: 'not-a-url',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid body');
    });

    it('accepts valid inputs with agentName defaulting to ZOE', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            session_token: 'st_test_abc123',
            agent_id: 'agent_123',
          }),
          { status: 200 },
        ),
      );

      const res = await POST(
        makePostRequest('/api/juke/admin/agent-join', { spaceId: 'test-space' }),
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.ok).toBe(true);
      expect(body.agentName).toBe('ZOE');
      expect(vi.mocked(global.fetch)).toHaveBeenCalledWith(
        'https://api.juke.audio/v1/developer/rooms/test-space/agent-join',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Juke-Api-Key': 'jk_sec_live_test',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            agent_name: 'ZOE',
            agent_pfp_url: undefined,
          }),
        }),
      );
    });

    it('trims whitespace from agentName', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ session_token: 'st_test' }), { status: 200 }),
      );

      const res = await POST(
        makePostRequest('/api/juke/admin/agent-join', {
          spaceId: 'test-space',
          agentName: '  CUSTOM  ',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.agentName).toBe('CUSTOM');
    });
  });

  describe('Juke API interaction', () => {
    it('encodes spaceId in the URL', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ session_token: 'st_test' }), { status: 200 }),
      );

      await POST(
        makePostRequest('/api/juke/admin/agent-join', {
          spaceId: 'space with spaces',
          agentName: 'ZOE',
        }),
      );

      expect(vi.mocked(global.fetch)).toHaveBeenCalledWith(
        'https://api.juke.audio/v1/developer/rooms/space%20with%20spaces/agent-join',
        expect.any(Object),
      );
    });

    it('includes optional agentPfpUrl when provided', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ session_token: 'st_test' }), { status: 200 }),
      );

      await POST(
        makePostRequest('/api/juke/admin/agent-join', {
          spaceId: 'test-space',
          agentName: 'ZOE',
          agentPfpUrl: 'https://example.com/pfp.png',
        }),
      );

      expect(vi.mocked(global.fetch)).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            agent_name: 'ZOE',
            agent_pfp_url: 'https://example.com/pfp.png',
          }),
        }),
      );
    });

    it('returns 201 with juke response on success', async () => {
      const jukeResponse = {
        session_token: 'st_live_secret123',
        agent_id: 'agent_001',
        room_id: 'test-space',
      };
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify(jukeResponse), { status: 200 }),
      );

      const res = await POST(
        makePostRequest('/api/juke/admin/agent-join', {
          spaceId: 'test-space',
          agentName: 'ZOE',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.ok).toBe(true);
      expect(body.spaceId).toBe('test-space');
      expect(body.agentName).toBe('ZOE');
      expect(body.juke).toEqual(jukeResponse);
      expect(body.action_required).toContain('session_token');
    });
  });

  describe('Juke API error handling', () => {
    it('returns 404 when Juke returns 404', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 }),
      );

      const res = await POST(
        makePostRequest('/api/juke/admin/agent-join', { spaceId: 'nonexistent' }),
      );
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.ok).toBe(false);
      expect(body.error).toContain('Juke returned 404');
    });

    it('returns 429 when Juke returns 429 (rate limit or per-room cap)', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 }),
      );

      const res = await POST(
        makePostRequest('/api/juke/admin/agent-join', { spaceId: 'test-space' }),
      );
      const body = await res.json();

      expect(res.status).toBe(429);
      expect(body.ok).toBe(false);
      expect(body.error).toContain('Juke returned 429');
    });

    it('returns 502 when Juke returns 5xx', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 }),
      );

      const res = await POST(
        makePostRequest('/api/juke/admin/agent-join', { spaceId: 'test-space' }),
      );
      const body = await res.json();

      expect(res.status).toBe(502);
      expect(body.ok).toBe(false);
      expect(body.error).toContain('Juke returned 500');
    });

    it('handles non-JSON response from Juke gracefully', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response('Internal Server Error', { status: 502 }),
      );

      const res = await POST(
        makePostRequest('/api/juke/admin/agent-join', { spaceId: 'test-space' }),
      );
      const body = await res.json();

      expect(res.status).toBe(502);
      expect(body.juke).toBe('Internal Server Error');
    });

    it('returns 502 when fetch times out', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('AbortError: Request timeout'));

      const res = await POST(
        makePostRequest('/api/juke/admin/agent-join', { spaceId: 'test-space' }),
      );
      const body = await res.json();

      expect(res.status).toBe(502);
      expect(body.error).toBe('Juke agent-join API unreachable');
    });

    it('returns 502 when fetch fails for other reasons', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      const res = await POST(
        makePostRequest('/api/juke/admin/agent-join', { spaceId: 'test-space' }),
      );
      const body = await res.json();

      expect(res.status).toBe(502);
      expect(body.error).toBe('Juke agent-join API unreachable');
    });
  });
});
