import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

// ===== Hoisted mocks =====
const { mockGetSessionData, mockMultistreamCreate, mockStreamCreate } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockMultistreamCreate: vi.fn(),
  mockStreamCreate: vi.fn(),
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
    multistream: {
      create: mockMultistreamCreate,
    },
    stream: {
      create: mockStreamCreate,
    },
  })),
}));

// Dynamically set the env var before importing the route
beforeEach(() => {
  process.env.LIVEPEER_API_KEY = 'test-livepeer-key';
});

import { POST } from '../route';

// ===== Test fixtures =====

const validCreateStreamPayload = {
  name: 'test-stream',
  targets: [
    {
      platform: 'twitch',
      rtmpUrl: 'rtmp://live.twitch.tv/app',
      streamKey: 'sk123',
    },
  ],
};

const validSession = mockAuthenticatedSession({ fid: 456, username: 'testuser' });

const mockMultistreamResponse = {
  multistreamTarget: {
    id: 'mst-123',
    name: 'twitch-456',
    url: 'rtmp://live.twitch.tv/app/sk123',
  },
};

const mockStreamResponse = {
  stream: {
    id: 'stream-xyz',
    streamKey: 'sk-livepeer-abc',
    playbackId: 'playback-123',
  },
};

describe('POST /api/livepeer/stream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(null);
    mockMultistreamCreate.mockClear();
    mockStreamCreate.mockClear();
  });

  // ===== AUTHENTICATION TESTS =====
  describe('authentication', () => {
    it('returns 401 when no session is provided', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await POST(makePostRequest('/api/livepeer/stream', validCreateStreamPayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when getSessionData returns null', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await POST(makePostRequest('/api/livepeer/stream', validCreateStreamPayload));
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

    it('returns 400 when name is empty', async () => {
      const payload = { ...validCreateStreamPayload, name: '' };
      const res = await POST(makePostRequest('/api/livepeer/stream', payload));
      const body = (await res.json()) as { error?: string; details?: object };

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when name exceeds max length (100 chars)', async () => {
      const payload = {
        ...validCreateStreamPayload,
        name: 'a'.repeat(101),
      };
      const res = await POST(makePostRequest('/api/livepeer/stream', payload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when targets array is empty', async () => {
      const payload = { ...validCreateStreamPayload, targets: [] };
      const res = await POST(makePostRequest('/api/livepeer/stream', payload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when targets exceed max length (10)', async () => {
      const payload = {
        ...validCreateStreamPayload,
        targets: Array.from({ length: 11 }, (_, i) => ({
          platform: `platform-${i}`,
          rtmpUrl: `rtmp://example.com/${i}`,
          streamKey: `key-${i}`,
        })),
      };
      const res = await POST(makePostRequest('/api/livepeer/stream', payload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when target platform is missing', async () => {
      const payload = {
        name: 'test',
        targets: [
          {
            rtmpUrl: 'rtmp://example.com',
            streamKey: 'key123',
          },
        ],
      };
      const res = await POST(makePostRequest('/api/livepeer/stream', payload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when target rtmpUrl is missing', async () => {
      const payload = {
        name: 'test',
        targets: [
          {
            platform: 'twitch',
            streamKey: 'key123',
          },
        ],
      };
      const res = await POST(makePostRequest('/api/livepeer/stream', payload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when target streamKey is missing', async () => {
      const payload = {
        name: 'test',
        targets: [
          {
            platform: 'twitch',
            rtmpUrl: 'rtmp://example.com',
          },
        ],
      };
      const res = await POST(makePostRequest('/api/livepeer/stream', payload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 500 when payload is not valid JSON (catches JSON parsing errors)', async () => {
      const { makeRequest } = await import('@/test-utils/api-helpers');
      const res = await POST(
        makeRequest('/api/livepeer/stream', {
          method: 'POST',
          body: 'not json',
        }),
      );
      const body = (await res.json()) as { error?: string };

      // Route doesn't specifically handle req.json() parse errors, they're caught by try-catch
      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to create stream');
    });
  });

  // ===== LIVEPEER SDK INTEGRATION TESTS =====
  describe('Livepeer SDK integration', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(validSession);
      mockMultistreamCreate.mockResolvedValue(mockMultistreamResponse);
      mockStreamCreate.mockResolvedValue(mockStreamResponse);
    });

    it('returns 500 when LIVEPEER_API_KEY is not configured', async () => {
      delete process.env.LIVEPEER_API_KEY;

      const res = await POST(makePostRequest('/api/livepeer/stream', validCreateStreamPayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to create stream');
    });

    it('creates multistream targets before creating stream', async () => {
      mockMultistreamCreate.mockResolvedValue(mockMultistreamResponse);
      mockStreamCreate.mockResolvedValue(mockStreamResponse);

      const payload = {
        name: 'multi-target-stream',
        targets: [
          {
            platform: 'twitch',
            rtmpUrl: 'rtmp://live.twitch.tv/app',
            streamKey: 'twitch-key',
          },
          {
            platform: 'youtube',
            rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
            streamKey: 'youtube-key',
          },
        ],
      };

      const res = await POST(makePostRequest('/api/livepeer/stream', payload));
      const body = (await res.json()) as { success?: boolean };

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      // Verify multistream.create was called twice (once per target)
      expect(mockMultistreamCreate).toHaveBeenCalledTimes(2);

      // Verify the calls include proper formatting
      expect(mockMultistreamCreate).toHaveBeenNthCalledWith(1, {
        name: 'twitch-456',
        url: 'rtmp://live.twitch.tv/app/twitch-key',
      });
      expect(mockMultistreamCreate).toHaveBeenNthCalledWith(2, {
        name: 'youtube-456',
        url: 'rtmp://a.rtmp.youtube.com/live2/youtube-key',
      });

      // Verify stream.create was called with multistream targets
      expect(mockStreamCreate).toHaveBeenCalledTimes(1);
      const streamCall = mockStreamCreate.mock.calls[0]?.[0];
      expect(streamCall).toMatchObject({
        multistream: {
          targets: expect.any(Array),
        },
        record: true,
      });
      expect(streamCall?.multistream.targets).toHaveLength(2);
    });

    it('uses fid from session in multistream target name', async () => {
      mockMultistreamCreate.mockResolvedValue(mockMultistreamResponse);
      mockStreamCreate.mockResolvedValue(mockStreamResponse);

      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 789 }));

      const res = await POST(makePostRequest('/api/livepeer/stream', validCreateStreamPayload));

      expect(res.status).toBe(200);
      expect(mockMultistreamCreate).toHaveBeenCalledWith({
        name: 'twitch-789',
        url: 'rtmp://live.twitch.tv/app/sk123',
      });
    });

    it('prefixes stream name with zao- and timestamp', async () => {
      mockMultistreamCreate.mockResolvedValue(mockMultistreamResponse);
      mockStreamCreate.mockResolvedValue(mockStreamResponse);

      const res = await POST(
        makePostRequest('/api/livepeer/stream', {
          name: 'my-stream',
          targets: validCreateStreamPayload.targets,
        }),
      );

      expect(res.status).toBe(200);
      const streamCall = mockStreamCreate.mock.calls[0]?.[0];
      expect(streamCall?.name).toMatch(/^zao-my-stream-\d+$/);
    });

    it('sets record to true when creating stream', async () => {
      mockMultistreamCreate.mockResolvedValue(mockMultistreamResponse);
      mockStreamCreate.mockResolvedValue(mockStreamResponse);

      const res = await POST(makePostRequest('/api/livepeer/stream', validCreateStreamPayload));

      expect(res.status).toBe(200);
      const streamCall = mockStreamCreate.mock.calls[0]?.[0];
      expect(streamCall?.record).toBe(true);
    });
  });

  // ===== SUCCESS RESPONSE TESTS =====
  describe('successful stream creation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(validSession);
      mockMultistreamCreate.mockResolvedValue(mockMultistreamResponse);
      mockStreamCreate.mockResolvedValue(mockStreamResponse);
    });

    it('returns 200 with correct stream response shape', async () => {
      const res = await POST(makePostRequest('/api/livepeer/stream', validCreateStreamPayload));
      const body = (await res.json()) as { success?: boolean; stream?: object };

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.stream).toBeDefined();
    });

    it('returns stream id from Livepeer response', async () => {
      const res = await POST(makePostRequest('/api/livepeer/stream', validCreateStreamPayload));
      const body = (await res.json()) as { stream?: { id?: string } };

      expect(body.stream?.id).toBe('stream-xyz');
    });

    it('returns streamKey from Livepeer response', async () => {
      const res = await POST(makePostRequest('/api/livepeer/stream', validCreateStreamPayload));
      const body = (await res.json()) as { stream?: { streamKey?: string } };

      expect(body.stream?.streamKey).toBe('sk-livepeer-abc');
    });

    it('returns playbackId from Livepeer response', async () => {
      const res = await POST(makePostRequest('/api/livepeer/stream', validCreateStreamPayload));
      const body = (await res.json()) as { stream?: { playbackId?: string } };

      expect(body.stream?.playbackId).toBe('playback-123');
    });

    it('returns rtmpIngestUrl hardcoded value', async () => {
      const res = await POST(makePostRequest('/api/livepeer/stream', validCreateStreamPayload));
      const body = (await res.json()) as { stream?: { rtmpIngestUrl?: string } };

      expect(body.stream?.rtmpIngestUrl).toBe('rtmp://rtmp.livepeer.com/live');
    });
  });

  // ===== ERROR HANDLING TESTS =====
  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(validSession);
    });

    it('returns 500 when multistream.create throws', async () => {
      mockMultistreamCreate.mockRejectedValue(new Error('Multistream API error'));

      const res = await POST(makePostRequest('/api/livepeer/stream', validCreateStreamPayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to create stream');
    });

    it('returns 500 when stream.create throws', async () => {
      mockMultistreamCreate.mockResolvedValue(mockMultistreamResponse);
      mockStreamCreate.mockRejectedValue(new Error('Stream creation failed'));

      const res = await POST(makePostRequest('/api/livepeer/stream', validCreateStreamPayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to create stream');
    });

    it('skips multistream targets when multistreamTarget.id is missing', async () => {
      // Return a response without id
      mockMultistreamCreate.mockResolvedValue({
        multistreamTarget: {
          name: 'twitch-456',
          url: 'rtmp://live.twitch.tv/app/sk123',
          // id is missing
        },
      });
      mockStreamCreate.mockResolvedValue(mockStreamResponse);

      const res = await POST(makePostRequest('/api/livepeer/stream', validCreateStreamPayload));
      const body = (await res.json()) as { success?: boolean };

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      // Verify stream was created with empty targets array
      const streamCall = mockStreamCreate.mock.calls[0]?.[0];
      expect(streamCall?.multistream.targets).toHaveLength(0);
    });

    it('continues creating stream even if one multistream target fails id extraction', async () => {
      // First call succeeds, second has no id
      mockMultistreamCreate.mockResolvedValueOnce(mockMultistreamResponse).mockResolvedValueOnce({
        multistreamTarget: { name: 'youtube-456' },
      });
      mockStreamCreate.mockResolvedValue(mockStreamResponse);

      const payload = {
        name: 'multi-target',
        targets: [
          {
            platform: 'twitch',
            rtmpUrl: 'rtmp://live.twitch.tv/app',
            streamKey: 'key1',
          },
          {
            platform: 'youtube',
            rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
            streamKey: 'key2',
          },
        ],
      };

      const res = await POST(makePostRequest('/api/livepeer/stream', payload));

      expect(res.status).toBe(200);
      const streamCall = mockStreamCreate.mock.calls[0]?.[0];
      // Only the first target should be included (has id)
      expect(streamCall?.multistream.targets).toHaveLength(1);
    });

    it('logs errors via logger.error', async () => {
      mockMultistreamCreate.mockRejectedValue(new Error('API failure'));

      await POST(makePostRequest('/api/livepeer/stream', validCreateStreamPayload));

      const { logger } = await import('@/lib/logger');
      expect(logger.error).toHaveBeenCalledWith('Livepeer stream error:', expect.any(Error));
    });
  });

  // ===== EDGE CASES =====
  describe('edge cases', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(validSession);
      mockMultistreamCreate.mockResolvedValue(mockMultistreamResponse);
      mockStreamCreate.mockResolvedValue(mockStreamResponse);
    });

    it('accepts stream name at minimum boundary (1 char)', async () => {
      const payload = {
        name: 'a',
        targets: validCreateStreamPayload.targets,
      };

      const res = await POST(makePostRequest('/api/livepeer/stream', payload));

      expect(res.status).toBe(200);
    });

    it('accepts stream name at maximum boundary (100 chars)', async () => {
      const payload = {
        name: 'a'.repeat(100),
        targets: validCreateStreamPayload.targets,
      };

      const res = await POST(makePostRequest('/api/livepeer/stream', payload));

      expect(res.status).toBe(200);
    });

    it('accepts exactly 1 target', async () => {
      const payload = {
        name: 'test',
        targets: [validCreateStreamPayload.targets[0]],
      };

      const res = await POST(makePostRequest('/api/livepeer/stream', payload));

      expect(res.status).toBe(200);
    });

    it('accepts exactly 10 targets (max)', async () => {
      const payload = {
        name: 'test',
        targets: Array.from({ length: 10 }, (_, i) => ({
          platform: `platform-${i}`,
          rtmpUrl: `rtmp://example.com/${i}`,
          streamKey: `key-${i}`,
        })),
      };

      const res = await POST(makePostRequest('/api/livepeer/stream', payload));

      expect(res.status).toBe(200);
      expect(mockMultistreamCreate).toHaveBeenCalledTimes(10);
    });
  });
});
