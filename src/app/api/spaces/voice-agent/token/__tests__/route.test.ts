import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  makePostRequest,
  mockUnauthenticatedSession,
  mockAuthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockGetSignedConversationUrl } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockGetSignedConversationUrl: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/agents/voice/elevenlabs', () => ({
  getSignedConversationUrl: (agentId: string) =>
    mockGetSignedConversationUrl(agentId),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

const ORIGINAL_AGENT_ID = process.env.ELEVENLABS_SPACE_AGENT_ID;

describe('POST /api/spaces/voice-agent/token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ELEVENLABS_SPACE_AGENT_ID = 'agent_test_123';
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockGetSignedConversationUrl.mockResolvedValue({
      signedUrl: 'wss://api.elevenlabs.io/signed/abc',
      agentId: 'agent_test_123',
    });
  });

  afterEach(() => {
    process.env.ELEVENLABS_SPACE_AGENT_ID = ORIGINAL_AGENT_ID;
  });

  describe('authorisation', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const req = makePostRequest('/api/spaces/voice-agent/token', {
        agent: 'zoe',
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      expect(mockGetSignedConversationUrl).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('returns 400 for an unknown agent slug', async () => {
      const req = makePostRequest('/api/spaces/voice-agent/token', {
        agent: 'not-a-real-agent',
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('defaults to the zoe agent when no agent is supplied', async () => {
      const req = makePostRequest('/api/spaces/voice-agent/token', {});
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockGetSignedConversationUrl).toHaveBeenCalledWith('agent_test_123');
    });
  });

  describe('configuration', () => {
    it('returns 503 when the agent id env var is unset', async () => {
      delete process.env.ELEVENLABS_SPACE_AGENT_ID;
      const req = makePostRequest('/api/spaces/voice-agent/token', {
        agent: 'zoe',
      });
      const res = await POST(req);
      expect(res.status).toBe(503);
      expect(mockGetSignedConversationUrl).not.toHaveBeenCalled();
    });
  });

  describe('success', () => {
    it('returns the signed url for an authenticated caller', async () => {
      const req = makePostRequest('/api/spaces/voice-agent/token', {
        agent: 'zoe',
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({
        success: true,
        signedUrl: 'wss://api.elevenlabs.io/signed/abc',
      });
    });
  });

  describe('errors', () => {
    it('returns 500 when the helper throws', async () => {
      mockGetSignedConversationUrl.mockRejectedValue(
        new Error('ElevenLabs signed-url request failed: 500'),
      );
      const req = makePostRequest('/api/spaces/voice-agent/token', {
        agent: 'zoe',
      });
      const res = await POST(req);
      expect(res.status).toBe(500);
    });
  });
});
