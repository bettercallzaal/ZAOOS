import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
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

vi.mock('@/lib/twitch/client', () => ({
  getValidTwitchToken: vi.fn(),
  createTwitchPrediction: vi.fn(),
  endTwitchPrediction: vi.fn(),
}));

import {
  createTwitchPrediction,
  endTwitchPrediction,
  getValidTwitchToken,
} from '@/lib/twitch/client';
import { PATCH, POST } from '../route';

describe('POST /api/twitch/prediction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  describe('authentication guard', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await POST(makePostRequest('/api/twitch/prediction', { title: 'Test' }));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('input validation', () => {
    it('returns 400 when title is missing', async () => {
      const res = await POST(
        makePostRequest('/api/twitch/prediction', { outcomes: ['Yes', 'No'] }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when title is empty string', async () => {
      const res = await POST(
        makePostRequest('/api/twitch/prediction', {
          title: '',
          outcomes: ['Yes', 'No'],
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when title exceeds 45 chars', async () => {
      const res = await POST(
        makePostRequest('/api/twitch/prediction', {
          title: 'a'.repeat(46),
          outcomes: ['Yes', 'No'],
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when outcomes is missing', async () => {
      const res = await POST(makePostRequest('/api/twitch/prediction', { title: 'Test' }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when outcomes array has less than 2 items', async () => {
      const res = await POST(
        makePostRequest('/api/twitch/prediction', {
          title: 'Test',
          outcomes: ['Yes'],
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when outcomes array exceeds 10 items', async () => {
      const res = await POST(
        makePostRequest('/api/twitch/prediction', {
          title: 'Test',
          outcomes: Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`),
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when outcome item is empty string', async () => {
      const res = await POST(
        makePostRequest('/api/twitch/prediction', {
          title: 'Test',
          outcomes: ['Yes', ''],
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when outcome item exceeds 25 chars', async () => {
      const res = await POST(
        makePostRequest('/api/twitch/prediction', {
          title: 'Test',
          outcomes: ['Yes', 'a'.repeat(26)],
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when duration is below 30', async () => {
      const res = await POST(
        makePostRequest('/api/twitch/prediction', {
          title: 'Test',
          outcomes: ['Yes', 'No'],
          duration: 29,
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when duration exceeds 1800', async () => {
      const res = await POST(
        makePostRequest('/api/twitch/prediction', {
          title: 'Test',
          outcomes: ['Yes', 'No'],
          duration: 1801,
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when duration is not an integer', async () => {
      const res = await POST(
        makePostRequest('/api/twitch/prediction', {
          title: 'Test',
          outcomes: ['Yes', 'No'],
          duration: 60.5,
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when request body is malformed JSON', async () => {
      const req = new Request(new URL('http://localhost:3000/api/twitch/prediction'), {
        method: 'POST',
        body: 'not json',
      });
      const res = await POST(req as unknown as Parameters<typeof POST>[0]);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('accepts valid duration within range', async () => {
      vi.mocked(getValidTwitchToken).mockResolvedValue({
        accessToken: 'token-123',
        userId: 'user-456',
      });
      vi.mocked(createTwitchPrediction).mockResolvedValue({
        id: 'pred-123',
        outcomes: [{ id: 'out-1', title: 'Yes' }],
      });

      const res = await POST(
        makePostRequest('/api/twitch/prediction', {
          title: 'Test',
          outcomes: ['Yes', 'No'],
          duration: 120,
        }),
      );
      expect(res.status).toBe(200);
      expect(vi.mocked(createTwitchPrediction)).toHaveBeenCalledWith(
        'token-123',
        'user-456',
        expect.objectContaining({ duration: 120 }),
      );
    });

    it('omits duration from call when not provided', async () => {
      vi.mocked(getValidTwitchToken).mockResolvedValue({
        accessToken: 'token-123',
        userId: 'user-456',
      });
      vi.mocked(createTwitchPrediction).mockResolvedValue({
        id: 'pred-123',
        outcomes: [{ id: 'out-1', title: 'Yes' }],
      });

      const res = await POST(
        makePostRequest('/api/twitch/prediction', {
          title: 'Test',
          outcomes: ['Yes', 'No'],
        }),
      );
      expect(res.status).toBe(200);
      expect(vi.mocked(createTwitchPrediction)).toHaveBeenCalledWith(
        'token-123',
        'user-456',
        expect.objectContaining({ title: 'Test', outcomes: ['Yes', 'No'] }),
      );
    });
  });

  describe('Twitch connection', () => {
    it('returns 400 when Twitch is not connected', async () => {
      vi.mocked(getValidTwitchToken).mockResolvedValue(null);

      const res = await POST(
        makePostRequest('/api/twitch/prediction', {
          title: 'Test',
          outcomes: ['Yes', 'No'],
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Twitch not connected');
    });

    it('fetches valid token for the session user', async () => {
      const sessionWithFid = mockAuthenticatedSession({ fid: 999 });
      mockGetSessionData.mockResolvedValue(sessionWithFid);

      vi.mocked(getValidTwitchToken).mockResolvedValue({
        accessToken: 'token-abc',
        userId: 'user-xyz',
      });
      vi.mocked(createTwitchPrediction).mockResolvedValue({
        id: 'pred-123',
        outcomes: [{ id: 'out-1', title: 'Yes' }],
      });

      await POST(
        makePostRequest('/api/twitch/prediction', {
          title: 'Test',
          outcomes: ['Yes', 'No'],
        }),
      );

      expect(vi.mocked(getValidTwitchToken)).toHaveBeenCalledWith(999);
    });
  });

  describe('Twitch API call', () => {
    beforeEach(() => {
      vi.mocked(getValidTwitchToken).mockResolvedValue({
        accessToken: 'token-123',
        userId: 'user-456',
      });
    });

    it('calls createTwitchPrediction with correct parameters', async () => {
      vi.mocked(createTwitchPrediction).mockResolvedValue({
        id: 'pred-123',
        outcomes: [
          { id: 'out-1', title: 'Yes' },
          { id: 'out-2', title: 'No' },
        ],
      });

      const res = await POST(
        makePostRequest('/api/twitch/prediction', {
          title: 'Will it work?',
          outcomes: ['Yes', 'No'],
          duration: 300,
        }),
      );

      expect(vi.mocked(createTwitchPrediction)).toHaveBeenCalledWith('token-123', 'user-456', {
        title: 'Will it work?',
        outcomes: ['Yes', 'No'],
        duration: 300,
      });
      expect(res.status).toBe(200);
    });

    it('returns 500 when createTwitchPrediction returns null (stream not live)', async () => {
      vi.mocked(createTwitchPrediction).mockResolvedValue(null);

      const res = await POST(
        makePostRequest('/api/twitch/prediction', {
          title: 'Test',
          outcomes: ['Yes', 'No'],
        }),
      );
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to create prediction — stream must be live');
    });

    it('returns successful prediction creation response', async () => {
      vi.mocked(createTwitchPrediction).mockResolvedValue({
        id: 'pred-abc-123',
        outcomes: [
          { id: 'out-1', title: 'Yes' },
          { id: 'out-2', title: 'No' },
        ],
      });

      const res = await POST(
        makePostRequest('/api/twitch/prediction', {
          title: 'Will it work?',
          outcomes: ['Yes', 'No'],
        }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        success: true,
        predictionId: 'pred-abc-123',
        outcomes: [
          { id: 'out-1', title: 'Yes' },
          { id: 'out-2', title: 'No' },
        ],
      });
    });
  });

  describe('error handling', () => {
    it('returns 500 on unexpected exception', async () => {
      mockGetSessionData.mockImplementation(() => {
        throw new Error('session check failed');
      });

      const res = await POST(
        makePostRequest('/api/twitch/prediction', {
          title: 'Test',
          outcomes: ['Yes', 'No'],
        }),
      );
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to create prediction');
    });
  });
});

describe('PATCH /api/twitch/prediction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  describe('authentication guard', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await PATCH(
        makePostRequest('/api/twitch/prediction', {
          predictionId: 'pred-123',
          winningOutcomeId: 'out-123',
        }),
      );
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('input validation', () => {
    it('returns 400 when predictionId is missing', async () => {
      const res = await PATCH(
        makePostRequest('/api/twitch/prediction', {
          winningOutcomeId: 'out-123',
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when predictionId is empty string', async () => {
      const res = await PATCH(
        makePostRequest('/api/twitch/prediction', {
          predictionId: '',
          winningOutcomeId: 'out-123',
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when winningOutcomeId is missing', async () => {
      const res = await PATCH(
        makePostRequest('/api/twitch/prediction', {
          predictionId: 'pred-123',
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when winningOutcomeId is empty string', async () => {
      const res = await PATCH(
        makePostRequest('/api/twitch/prediction', {
          predictionId: 'pred-123',
          winningOutcomeId: '',
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when request body is malformed JSON', async () => {
      const req = new Request(new URL('http://localhost:3000/api/twitch/prediction'), {
        method: 'PATCH',
        body: 'not json',
      });
      const res = await PATCH(req as unknown as Parameters<typeof PATCH>[0]);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('accepts valid predictionId and winningOutcomeId', async () => {
      vi.mocked(getValidTwitchToken).mockResolvedValue({
        accessToken: 'token-123',
        userId: 'user-456',
      });
      vi.mocked(endTwitchPrediction).mockResolvedValue(true);

      const res = await PATCH(
        makePostRequest('/api/twitch/prediction', {
          predictionId: 'pred-abc-123',
          winningOutcomeId: 'out-xyz-789',
        }),
      );
      expect(res.status).toBe(200);
      expect(vi.mocked(endTwitchPrediction)).toHaveBeenCalledWith(
        'token-123',
        'user-456',
        'pred-abc-123',
        'out-xyz-789',
      );
    });
  });

  describe('Twitch connection', () => {
    it('returns 400 when Twitch is not connected', async () => {
      vi.mocked(getValidTwitchToken).mockResolvedValue(null);

      const res = await PATCH(
        makePostRequest('/api/twitch/prediction', {
          predictionId: 'pred-123',
          winningOutcomeId: 'out-123',
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Twitch not connected');
    });

    it('fetches valid token for the session user', async () => {
      const sessionWithFid = mockAuthenticatedSession({ fid: 888 });
      mockGetSessionData.mockResolvedValue(sessionWithFid);

      vi.mocked(getValidTwitchToken).mockResolvedValue({
        accessToken: 'token-abc',
        userId: 'user-xyz',
      });
      vi.mocked(endTwitchPrediction).mockResolvedValue(true);

      await PATCH(
        makePostRequest('/api/twitch/prediction', {
          predictionId: 'pred-123',
          winningOutcomeId: 'out-123',
        }),
      );

      expect(vi.mocked(getValidTwitchToken)).toHaveBeenCalledWith(888);
    });
  });

  describe('Twitch API call', () => {
    beforeEach(() => {
      vi.mocked(getValidTwitchToken).mockResolvedValue({
        accessToken: 'token-123',
        userId: 'user-456',
      });
    });

    it('calls endTwitchPrediction with correct parameters', async () => {
      vi.mocked(endTwitchPrediction).mockResolvedValue(true);

      const res = await PATCH(
        makePostRequest('/api/twitch/prediction', {
          predictionId: 'pred-abc-123',
          winningOutcomeId: 'out-xyz-789',
        }),
      );

      expect(vi.mocked(endTwitchPrediction)).toHaveBeenCalledWith(
        'token-123',
        'user-456',
        'pred-abc-123',
        'out-xyz-789',
      );
      expect(res.status).toBe(200);
    });

    it('returns 500 when endTwitchPrediction returns false', async () => {
      vi.mocked(endTwitchPrediction).mockResolvedValue(false);

      const res = await PATCH(
        makePostRequest('/api/twitch/prediction', {
          predictionId: 'pred-123',
          winningOutcomeId: 'out-123',
        }),
      );
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to resolve prediction');
    });

    it('returns successful resolution response', async () => {
      vi.mocked(endTwitchPrediction).mockResolvedValue(true);

      const res = await PATCH(
        makePostRequest('/api/twitch/prediction', {
          predictionId: 'pred-abc-123',
          winningOutcomeId: 'out-xyz-789',
        }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ success: true });
    });
  });

  describe('error handling', () => {
    it('returns 500 on unexpected exception', async () => {
      mockGetSessionData.mockImplementation(() => {
        throw new Error('session check failed');
      });

      const res = await PATCH(
        makePostRequest('/api/twitch/prediction', {
          predictionId: 'pred-123',
          winningOutcomeId: 'out-123',
        }),
      );
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to resolve prediction');
    });
  });
});
