import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

// ===== Hoisted mocks =====
const { mockGetSessionData, mockClientConnect } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockClientConnect: vi.fn(),
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

vi.mock('@gradio/client', () => {
  return {
    Client: {
      connect: mockClientConnect,
    },
  };
});

// Set env var before importing route
beforeEach(() => {
  process.env.HF_TOKEN = 'hf_test-token-123456789';
});

import { POST } from '../route';

// ===== Test fixtures =====

const validGeneratePayload = {
  prompt: 'upbeat electronic dance music with synth leads',
  lyrics: 'Dance all night, feel the light',
  duration: 30,
};

const validSession = mockAuthenticatedSession({ fid: 456, username: 'testuser' });

// Mock Gradio client result with audio URL string
const mockAudioResultString = 'https://huggingface.co/file/abc123/output.wav';

// Mock Gradio client result with audio object containing url
const mockAudioResultObject = {
  url: 'https://huggingface.co/file/xyz789/output.wav',
};

describe('POST /api/music/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(null);
    mockClientConnect.mockClear();
  });

  // ===== AUTHENTICATION TESTS =====
  describe('authentication', () => {
    it('returns 401 when no session is provided', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await POST(makePostRequest('/api/music/generate', validGeneratePayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when getSessionData returns null (unauthenticated)', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await POST(makePostRequest('/api/music/generate', validGeneratePayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('allows request when authenticated', async () => {
      mockGetSessionData.mockResolvedValue(validSession);
      const mockPredict = vi.fn().mockResolvedValue({
        data: [mockAudioResultString],
      });
      mockClientConnect.mockResolvedValue({
        predict: mockPredict,
      });

      const res = await POST(makePostRequest('/api/music/generate', validGeneratePayload));

      expect(res.status).toBe(200);
    });
  });

  // ===== VALIDATION TESTS =====
  describe('input validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(validSession);
    });

    it('returns 400 when prompt is empty', async () => {
      const payload = { ...validGeneratePayload, prompt: '' };
      const res = await POST(makePostRequest('/api/music/generate', payload));
      const body = (await res.json()) as { error?: string; details?: unknown };

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when prompt is missing', async () => {
      const payload = { lyrics: 'test' };
      const res = await POST(makePostRequest('/api/music/generate', payload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when prompt exceeds 500 characters', async () => {
      const payload = { ...validGeneratePayload, prompt: 'a'.repeat(501) };
      const res = await POST(makePostRequest('/api/music/generate', payload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('accepts prompt at minimum boundary (1 char)', async () => {
      const payload = { ...validGeneratePayload, prompt: 'a' };
      const mockPredict = vi.fn().mockResolvedValue({
        data: [mockAudioResultString],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', payload));

      expect(res.status).toBe(200);
    });

    it('accepts prompt at maximum boundary (500 chars)', async () => {
      const payload = { ...validGeneratePayload, prompt: 'a'.repeat(500) };
      const mockPredict = vi.fn().mockResolvedValue({
        data: [mockAudioResultString],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', payload));

      expect(res.status).toBe(200);
    });

    it('returns 400 when lyrics exceeds 2000 characters', async () => {
      const payload = { ...validGeneratePayload, lyrics: 'a'.repeat(2001) };
      const res = await POST(makePostRequest('/api/music/generate', payload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('accepts lyrics at maximum boundary (2000 chars)', async () => {
      const payload = { ...validGeneratePayload, lyrics: 'a'.repeat(2000) };
      const mockPredict = vi.fn().mockResolvedValue({
        data: [mockAudioResultString],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', payload));

      expect(res.status).toBe(200);
    });

    it('returns 400 when duration is below 10', async () => {
      const payload = { ...validGeneratePayload, duration: 9 };
      const res = await POST(makePostRequest('/api/music/generate', payload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when duration exceeds 120', async () => {
      const payload = { ...validGeneratePayload, duration: 121 };
      const res = await POST(makePostRequest('/api/music/generate', payload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('accepts duration at minimum boundary (10 seconds)', async () => {
      const payload = { ...validGeneratePayload, duration: 10 };
      const mockPredict = vi.fn().mockResolvedValue({
        data: [mockAudioResultString],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', payload));

      expect(res.status).toBe(200);
    });

    it('accepts duration at maximum boundary (120 seconds)', async () => {
      const payload = { ...validGeneratePayload, duration: 120 };
      const mockPredict = vi.fn().mockResolvedValue({
        data: [mockAudioResultString],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', payload));

      expect(res.status).toBe(200);
    });
  });

  // ===== DEFAULT VALUE TESTS =====
  describe('default values', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(validSession);
    });

    it('uses empty string for lyrics when not provided', async () => {
      const payload = { prompt: 'test music' };
      const mockPredict = vi.fn().mockResolvedValue({
        data: [mockAudioResultString],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      await POST(makePostRequest('/api/music/generate', payload));

      expect(mockPredict).toHaveBeenCalledWith(
        '/generate',
        expect.objectContaining({ lyrics: '' }),
      );
    });

    it('uses 30 seconds as default duration when not provided', async () => {
      const payload = { prompt: 'test music' };
      const mockPredict = vi.fn().mockResolvedValue({
        data: [mockAudioResultString],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      await POST(makePostRequest('/api/music/generate', payload));

      expect(mockPredict).toHaveBeenCalledWith(
        '/generate',
        expect.objectContaining({ audio_duration: 30 }),
      );
    });

    it('passes specified lyrics to Gradio predict', async () => {
      const lyrics = 'Custom song lyrics here';
      const payload = { prompt: 'test', lyrics };
      const mockPredict = vi.fn().mockResolvedValue({
        data: [mockAudioResultString],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      await POST(makePostRequest('/api/music/generate', payload));

      expect(mockPredict).toHaveBeenCalledWith('/generate', expect.objectContaining({ lyrics }));
    });

    it('passes specified duration to Gradio predict', async () => {
      const payload = { prompt: 'test', duration: 45 };
      const mockPredict = vi.fn().mockResolvedValue({
        data: [mockAudioResultString],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      await POST(makePostRequest('/api/music/generate', payload));

      expect(mockPredict).toHaveBeenCalledWith(
        '/generate',
        expect.objectContaining({ audio_duration: 45 }),
      );
    });
  });

  // ===== GRADIO CLIENT INTEGRATION TESTS =====
  describe('Gradio Client integration', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(validSession);
    });

    it('returns 500 when HF_TOKEN is not configured', async () => {
      delete process.env.HF_TOKEN;

      const res = await POST(makePostRequest('/api/music/generate', validGeneratePayload));
      const body = (await res.json()) as {
        audioUrl?: null;
        message?: string;
        mock?: boolean;
      };

      expect(res.status).toBe(200);
      expect(body.audioUrl).toBe(null);
      expect(body.mock).toBe(true);
      expect(body.message).toBe('Set HF_TOKEN env var to enable AI music generation');
    });

    it('connects to ACE-Step Space with HF token', async () => {
      const mockPredict = vi.fn().mockResolvedValue({
        data: [mockAudioResultString],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      await POST(makePostRequest('/api/music/generate', validGeneratePayload));

      expect(mockClientConnect).toHaveBeenCalledWith('ACE-Step/Ace-Step-v1.5', {
        token: 'hf_test-token-123456789',
      });
    });

    it('calls predict with /generate endpoint', async () => {
      const mockPredict = vi.fn().mockResolvedValue({
        data: [mockAudioResultString],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      await POST(makePostRequest('/api/music/generate', validGeneratePayload));

      expect(mockPredict).toHaveBeenCalledWith('/generate', expect.any(Object));
    });

    it('passes all generation parameters to predict', async () => {
      const mockPredict = vi.fn().mockResolvedValue({
        data: [mockAudioResultString],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const payload = {
        prompt: 'upbeat music',
        lyrics: 'test lyrics',
        duration: 45,
      };

      await POST(makePostRequest('/api/music/generate', payload));

      expect(mockPredict).toHaveBeenCalledWith(
        '/generate',
        expect.objectContaining({
          prompt: 'upbeat music',
          lyrics: 'test lyrics',
          audio_duration: 45,
          infer_step: 8,
          guidance_scale: 3.0,
          scheduler_type: 'euler',
          cfg_type: 'apg',
          omega_scale: 10.0,
        }),
      );
    });
  });

  // ===== SUCCESS RESPONSE TESTS =====
  describe('successful audio generation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(validSession);
    });

    it('returns 200 with audioUrl when Gradio returns string result', async () => {
      const mockPredict = vi.fn().mockResolvedValue({
        data: [mockAudioResultString],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', validGeneratePayload));
      const body = (await res.json()) as { audioUrl?: string };

      expect(res.status).toBe(200);
      expect(body.audioUrl).toBe(mockAudioResultString);
    });

    it('extracts url from object result with url property', async () => {
      const mockPredict = vi.fn().mockResolvedValue({
        data: [mockAudioResultObject],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', validGeneratePayload));
      const body = (await res.json()) as { audioUrl?: string };

      expect(res.status).toBe(200);
      expect(body.audioUrl).toBe(mockAudioResultObject.url);
    });

    it('handles data array with multiple items (uses first)', async () => {
      const mockPredict = vi.fn().mockResolvedValue({
        data: [mockAudioResultString, 'https://huggingface.co/file/second.wav'],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', validGeneratePayload));
      const body = (await res.json()) as { audioUrl?: string };

      expect(res.status).toBe(200);
      expect(body.audioUrl).toBe(mockAudioResultString);
    });
  });

  // ===== ERROR HANDLING TESTS =====
  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(validSession);
    });

    it('returns 502 when data array is empty', async () => {
      const mockPredict = vi.fn().mockResolvedValue({
        data: [],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', validGeneratePayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(502);
      expect(body.error).toBe('No audio returned from generator');
    });

    it('returns 502 when data is undefined', async () => {
      const mockPredict = vi.fn().mockResolvedValue({
        data: undefined,
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', validGeneratePayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(502);
      expect(body.error).toBe('No audio returned from generator');
    });

    it('returns 502 when data is null', async () => {
      const mockPredict = vi.fn().mockResolvedValue({
        data: null,
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', validGeneratePayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(502);
      expect(body.error).toBe('No audio returned from generator');
    });

    it('returns 502 when audio result is neither string nor has url property', async () => {
      const mockPredict = vi.fn().mockResolvedValue({
        data: [{ noUrlProperty: true }],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', validGeneratePayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(502);
      expect(body.error).toBe('Unexpected response from generator');
    });

    it('returns 502 when audio result is a number', async () => {
      const mockPredict = vi.fn().mockResolvedValue({
        data: [123],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', validGeneratePayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(502);
      expect(body.error).toBe('Unexpected response from generator');
    });

    it('logs unexpected result format to error logger', async () => {
      const mockPredict = vi.fn().mockResolvedValue({
        data: [{ unexpected: 'format' }],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      await POST(makePostRequest('/api/music/generate', validGeneratePayload));

      const { logger } = await import('@/lib/logger');
      expect(logger.error).toHaveBeenCalledWith(
        '[music/generate] Unexpected result format:',
        expect.any(String),
      );
    });

    it('returns 500 when Client.connect throws', async () => {
      mockClientConnect.mockRejectedValue(new Error('Connection failed'));

      const res = await POST(makePostRequest('/api/music/generate', validGeneratePayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to generate audio');
    });

    it('returns 500 when predict throws', async () => {
      const mockPredict = vi.fn().mockRejectedValue(new Error('Prediction failed'));
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', validGeneratePayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to generate audio');
    });

    it('returns service busy message when error includes queue', async () => {
      const mockPredict = vi.fn().mockRejectedValue(new Error('queue timeout'));
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', validGeneratePayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(500);
      expect(body.error).toBe('AI music service is busy — try again in a minute');
    });

    it('returns generic message when error does not include queue', async () => {
      const mockPredict = vi.fn().mockRejectedValue(new Error('Network error'));
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', validGeneratePayload));
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to generate audio');
    });

    it('logs errors via logger.error', async () => {
      mockClientConnect.mockRejectedValue(new Error('API failure'));

      await POST(makePostRequest('/api/music/generate', validGeneratePayload));

      const { logger } = await import('@/lib/logger');
      expect(logger.error).toHaveBeenCalledWith('[music/generate] error:', expect.any(Error));
    });
  });

  // ===== EDGE CASES =====
  describe('edge cases', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(validSession);
    });

    it('handles empty lyrics string (default)', async () => {
      const payload = { prompt: 'test', lyrics: '' };
      const mockPredict = vi.fn().mockResolvedValue({
        data: [mockAudioResultString],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', payload));

      expect(res.status).toBe(200);
      expect(mockPredict).toHaveBeenCalledWith(
        '/generate',
        expect.objectContaining({ lyrics: '' }),
      );
    });

    it('handles response with object containing empty url', async () => {
      const mockPredict = vi.fn().mockResolvedValue({
        data: [{ url: '' }],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', validGeneratePayload));
      const body = (await res.json()) as { error?: string };

      // Empty string is still falsy, should fail
      expect(res.status).toBe(502);
      expect(body.error).toBe('Unexpected response from generator');
    });

    it('handles special characters in prompt', async () => {
      const payload = {
        prompt: 'upbeat 🎵 electronic @ 140 BPM (fast)',
        lyrics: '',
        duration: 30,
      };
      const mockPredict = vi.fn().mockResolvedValue({
        data: [mockAudioResultString],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', payload));

      expect(res.status).toBe(200);
      expect(mockPredict).toHaveBeenCalledWith(
        '/generate',
        expect.objectContaining({ prompt: payload.prompt }),
      );
    });

    it('handles very long prompt at boundary', async () => {
      const longPrompt = 'a'.repeat(500);
      const payload = { prompt: longPrompt };
      const mockPredict = vi.fn().mockResolvedValue({
        data: [mockAudioResultString],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', payload));

      expect(res.status).toBe(200);
      expect(mockPredict).toHaveBeenCalledWith(
        '/generate',
        expect.objectContaining({ prompt: longPrompt }),
      );
    });

    it('handles request with only required fields', async () => {
      const payload = { prompt: 'test music' };
      const mockPredict = vi.fn().mockResolvedValue({
        data: [mockAudioResultString],
      });
      mockClientConnect.mockResolvedValue({ predict: mockPredict });

      const res = await POST(makePostRequest('/api/music/generate', payload));

      expect(res.status).toBe(200);
      const body = (await res.json()) as { audioUrl?: string };
      expect(body).toBeDefined();
    });
  });
});
