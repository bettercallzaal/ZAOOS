import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

// ===== Hoisted mocks =====
const { mockGetSessionData, mockCreateClip } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockCreateClip: vi.fn(),
}));

// ===== Module mocks =====
vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('livepeer', () => ({
  Livepeer: vi.fn(() => ({
    stream: {
      createClip: mockCreateClip,
    },
  })),
}));

// Dynamically set the env var before importing the route
beforeEach(() => {
  process.env.LIVEPEER_API_KEY = 'test-livepeer-key';
});

import { POST } from '../route';

// ===== Test fixtures =====

const validClipPayload = {
  playbackId: 'playback-test-123',
  startTime: 0,
  endTime: 10,
  name: 'Test Clip',
};

const validSession = mockAuthenticatedSession({ fid: 456, username: 'testuser' });

const mockClipResponse = {
  id: 'clip-xyz-123',
  playbackId: 'playback-test-123',
  startTime: 0,
  endTime: 10,
  name: 'Test Clip',
  url: 'https://livepeer.com/clips/clip-xyz-123',
};

describe('POST /api/livepeer/clip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(null);
    mockCreateClip.mockClear();
  });

  // ===== AUTHENTICATION TESTS =====
  describe('authentication', () => {
    it('returns 401 when no session is provided', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await POST(makePostRequest('/api/livepeer/clip', validClipPayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when getSessionData returns null', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await POST(makePostRequest('/api/livepeer/clip', validClipPayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });
  });

  // ===== VALIDATION TESTS =====
  describe('input validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(validSession);
    });

    it('returns 400 when playbackId is missing', async () => {
      const payload = {
        startTime: 0,
        endTime: 10,
        name: 'Test Clip',
      };
      const res = await POST(makePostRequest('/api/livepeer/clip', payload));
      const body = (await res.json()) as { error?: string; details?: object };

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when playbackId is empty string', async () => {
      const payload = {
        playbackId: '',
        startTime: 0,
        endTime: 10,
      };
      const res = await POST(makePostRequest('/api/livepeer/clip', payload));
      const body = (await res.json()) as { error?: string; details?: object };

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when startTime is missing', async () => {
      const payload = {
        playbackId: 'playback-123',
        endTime: 10,
      };
      const res = await POST(makePostRequest('/api/livepeer/clip', payload));
      const body = (await res.json()) as { error?: string; details?: object };

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when endTime is missing', async () => {
      const payload = {
        playbackId: 'playback-123',
        startTime: 0,
      };
      const res = await POST(makePostRequest('/api/livepeer/clip', payload));
      const body = (await res.json()) as { error?: string; details?: object };

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when startTime is negative', async () => {
      const payload = {
        playbackId: 'playback-123',
        startTime: -1,
        endTime: 10,
      };
      const res = await POST(makePostRequest('/api/livepeer/clip', payload));
      const body = (await res.json()) as { error?: string; details?: object };

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when endTime is negative', async () => {
      const payload = {
        playbackId: 'playback-123',
        startTime: 0,
        endTime: -1,
      };
      const res = await POST(makePostRequest('/api/livepeer/clip', payload));
      const body = (await res.json()) as { error?: string; details?: object };

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('accepts 0 as valid startTime', async () => {
      mockCreateClip.mockResolvedValue(mockClipResponse);

      const payload = {
        playbackId: 'playback-123',
        startTime: 0,
        endTime: 10,
      };
      const res = await POST(makePostRequest('/api/livepeer/clip', payload));

      expect(res.status).toBe(200);
    });

    it('accepts 0 as valid endTime', async () => {
      mockCreateClip.mockResolvedValue(mockClipResponse);

      const payload = {
        playbackId: 'playback-123',
        startTime: 0,
        endTime: 0,
      };
      const res = await POST(makePostRequest('/api/livepeer/clip', payload));

      expect(res.status).toBe(200);
    });

    it('accepts optional name parameter', async () => {
      mockCreateClip.mockResolvedValue(mockClipResponse);

      const payload = {
        playbackId: 'playback-123',
        startTime: 0,
        endTime: 10,
        name: 'Custom Clip Name',
      };
      const res = await POST(makePostRequest('/api/livepeer/clip', payload));

      expect(res.status).toBe(200);
      expect(mockCreateClip).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Custom Clip Name',
        }),
      );
    });

    it('returns 500 when payload is not valid JSON', async () => {
      const { makeRequest } = await import('@/test-utils/api-helpers');
      const res = await POST(
        makeRequest('/api/livepeer/clip', {
          method: 'POST',
          body: 'not json',
        }),
      );
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to create clip');
    });
  });

  // ===== LIVEPEER SDK INTEGRATION TESTS =====
  describe('Livepeer SDK integration', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(validSession);
      mockCreateClip.mockResolvedValue(mockClipResponse);
    });

    it('returns 500 when LIVEPEER_API_KEY is not configured', async () => {
      delete process.env.LIVEPEER_API_KEY;

      const res = await POST(makePostRequest('/api/livepeer/clip', validClipPayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to create clip');
    });

    it('calls livepeer.stream.createClip with correct parameters', async () => {
      mockCreateClip.mockResolvedValue(mockClipResponse);

      const res = await POST(makePostRequest('/api/livepeer/clip', validClipPayload));

      expect(res.status).toBe(200);
      expect(mockCreateClip).toHaveBeenCalledWith({
        playbackId: 'playback-test-123',
        startTime: 0,
        endTime: 10,
        name: 'Test Clip',
      });
    });

    it('uses default name when name is not provided', async () => {
      mockCreateClip.mockResolvedValue(mockClipResponse);

      const payload = {
        playbackId: 'playback-123',
        startTime: 0,
        endTime: 10,
      };
      const res = await POST(makePostRequest('/api/livepeer/clip', payload));

      expect(res.status).toBe(200);
      expect(mockCreateClip).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackId: 'playback-123',
          startTime: 0,
          endTime: 10,
          name: expect.stringMatching(/^ZAO Clip \d+$/),
        }),
      );
    });

    it('preserves playbackId in SDK call', async () => {
      mockCreateClip.mockResolvedValue(mockClipResponse);

      const payload = {
        playbackId: 'special-playback-id-xyz',
        startTime: 5,
        endTime: 15,
      };
      const res = await POST(makePostRequest('/api/livepeer/clip', payload));

      expect(res.status).toBe(200);
      expect(mockCreateClip).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackId: 'special-playback-id-xyz',
        }),
      );
    });

    it('preserves startTime and endTime in SDK call', async () => {
      mockCreateClip.mockResolvedValue(mockClipResponse);

      const payload = {
        playbackId: 'playback-123',
        startTime: 5,
        endTime: 25,
      };
      const res = await POST(makePostRequest('/api/livepeer/clip', payload));

      expect(res.status).toBe(200);
      expect(mockCreateClip).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: 5,
          endTime: 25,
        }),
      );
    });
  });

  // ===== SUCCESS RESPONSE TESTS =====
  describe('successful clip creation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(validSession);
      mockCreateClip.mockResolvedValue(mockClipResponse);
    });

    it('returns 200 with correct clip response shape', async () => {
      const res = await POST(makePostRequest('/api/livepeer/clip', validClipPayload));
      const body = (await res.json()) as { success?: boolean; clip?: object };

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.clip).toBeDefined();
    });

    it('returns clip id from Livepeer response', async () => {
      const res = await POST(makePostRequest('/api/livepeer/clip', validClipPayload));
      const body = (await res.json()) as { clip?: { id?: string } };

      expect(body.clip?.id).toBe('clip-xyz-123');
    });

    it('returns clip playbackId from Livepeer response', async () => {
      const res = await POST(makePostRequest('/api/livepeer/clip', validClipPayload));
      const body = (await res.json()) as { clip?: { playbackId?: string } };

      expect(body.clip?.playbackId).toBe('playback-test-123');
    });

    it('returns clip url from Livepeer response', async () => {
      const res = await POST(makePostRequest('/api/livepeer/clip', validClipPayload));
      const body = (await res.json()) as { clip?: { url?: string } };

      expect(body.clip?.url).toBe('https://livepeer.com/clips/clip-xyz-123');
    });

    it('returns full clip object from Livepeer response', async () => {
      const res = await POST(makePostRequest('/api/livepeer/clip', validClipPayload));
      const body = (await res.json()) as { clip?: Record<string, unknown> };

      expect(body.clip).toMatchObject({
        id: 'clip-xyz-123',
        playbackId: 'playback-test-123',
        startTime: 0,
        endTime: 10,
        name: 'Test Clip',
        url: 'https://livepeer.com/clips/clip-xyz-123',
      });
    });
  });

  // ===== ERROR HANDLING TESTS =====
  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(validSession);
    });

    it('returns 500 when stream.createClip throws', async () => {
      mockCreateClip.mockRejectedValue(new Error('Clip creation failed'));

      const res = await POST(makePostRequest('/api/livepeer/clip', validClipPayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to create clip');
    });

    it('returns 500 when Livepeer SDK throws API error', async () => {
      mockCreateClip.mockRejectedValue(new Error('401 Unauthorized - Invalid API key'));

      const res = await POST(makePostRequest('/api/livepeer/clip', validClipPayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to create clip');
    });

    it('returns 500 when Livepeer SDK throws network error', async () => {
      mockCreateClip.mockRejectedValue(new Error('Network timeout'));

      const res = await POST(makePostRequest('/api/livepeer/clip', validClipPayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to create clip');
    });

    it('logs errors via logger.error', async () => {
      mockCreateClip.mockRejectedValue(new Error('Clip API error'));

      await POST(makePostRequest('/api/livepeer/clip', validClipPayload));

      const { logger } = await import('@/lib/logger');
      expect(logger.error).toHaveBeenCalledWith('Livepeer clip error:', expect.any(Error));
    });
  });

  // ===== EDGE CASES =====
  describe('edge cases', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(validSession);
      mockCreateClip.mockResolvedValue(mockClipResponse);
    });

    it('accepts playbackId with special characters', async () => {
      const payload = {
        playbackId: 'playback-123_abc-def.xyz',
        startTime: 0,
        endTime: 10,
      };

      const res = await POST(makePostRequest('/api/livepeer/clip', payload));

      expect(res.status).toBe(200);
      expect(mockCreateClip).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackId: 'playback-123_abc-def.xyz',
        }),
      );
    });

    it('accepts large startTime and endTime values', async () => {
      const payload = {
        playbackId: 'playback-123',
        startTime: 3600,
        endTime: 7200,
      };

      const res = await POST(makePostRequest('/api/livepeer/clip', payload));

      expect(res.status).toBe(200);
      expect(mockCreateClip).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: 3600,
          endTime: 7200,
        }),
      );
    });

    it('accepts decimal time values', async () => {
      mockCreateClip.mockResolvedValue(mockClipResponse);

      const payload = {
        playbackId: 'playback-123',
        startTime: 1.5,
        endTime: 10.7,
      };

      const res = await POST(makePostRequest('/api/livepeer/clip', payload));

      expect(res.status).toBe(200);
      expect(mockCreateClip).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: 1.5,
          endTime: 10.7,
        }),
      );
    });

    it('accepts very long clip name', async () => {
      const longName = 'a'.repeat(200);
      const payload = {
        playbackId: 'playback-123',
        startTime: 0,
        endTime: 10,
        name: longName,
      };

      const res = await POST(makePostRequest('/api/livepeer/clip', payload));

      expect(res.status).toBe(200);
      expect(mockCreateClip).toHaveBeenCalledWith(
        expect.objectContaining({
          name: longName,
        }),
      );
    });

    it('handles endTime equal to startTime', async () => {
      const payload = {
        playbackId: 'playback-123',
        startTime: 5,
        endTime: 5,
      };

      const res = await POST(makePostRequest('/api/livepeer/clip', payload));

      expect(res.status).toBe(200);
      expect(mockCreateClip).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: 5,
          endTime: 5,
        }),
      );
    });

    it('generates unique default names on successive calls', async () => {
      mockCreateClip.mockResolvedValue(mockClipResponse);

      const payload = {
        playbackId: 'playback-123',
        startTime: 0,
        endTime: 10,
      };

      await POST(makePostRequest('/api/livepeer/clip', payload));
      const firstCall = mockCreateClip.mock.calls[0]?.[0]?.name;

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 1));

      await POST(makePostRequest('/api/livepeer/clip', payload));
      const secondCall = mockCreateClip.mock.calls[1]?.[0]?.name;

      expect(firstCall).toMatch(/^ZAO Clip \d+$/);
      expect(secondCall).toMatch(/^ZAO Clip \d+$/);
      expect(firstCall).not.toBe(secondCall);
    });
  });

  // ===== SESSION DATA ISOLATION TESTS =====
  describe('session data isolation', () => {
    it('does not leak session data in response', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 789, username: 'secretuser' }),
      );
      mockCreateClip.mockResolvedValue(mockClipResponse);

      const res = await POST(makePostRequest('/api/livepeer/clip', validClipPayload));
      const body = (await res.json()) as Record<string, unknown>;

      // Response should only contain success and clip fields
      expect(Object.keys(body)).toEqual(expect.arrayContaining(['success', 'clip']));
      expect(JSON.stringify(body)).not.toContain('secretuser');
      expect(JSON.stringify(body)).not.toContain('789');
    });
  });
});
