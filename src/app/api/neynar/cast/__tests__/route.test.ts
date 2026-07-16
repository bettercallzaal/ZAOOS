import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_UUID,
} from '@/test-utils/api-helpers';

const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.stubGlobal('fetch', vi.fn());

// Mock environment variables
process.env.NEYNAR_API_KEY = 'test-neynar-key-12345';

import { POST } from '../route';

describe('POST /api/neynar/cast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: VALID_UUID }));
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        cast: {
          hash: '0x123abc',
          text: 'Hello Farcaster',
          embeds: [],
        },
      }),
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST(makePostRequest('/api/neynar/cast', { text: 'Hello' }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized — no signer');
  });

  it('returns 401 when session has no signerUuid', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: undefined }));
    const res = await POST(makePostRequest('/api/neynar/cast', { text: 'Hello' }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized — no signer');
  });

  it('returns 400 when text is empty', async () => {
    const res = await POST(makePostRequest('/api/neynar/cast', { text: '' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid input');
  });

  it('returns 400 when text exceeds 1024 characters', async () => {
    const longText = 'a'.repeat(1025);
    const res = await POST(makePostRequest('/api/neynar/cast', { text: longText }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid input');
  });

  it('returns 400 when embeds contains an invalid URL', async () => {
    const res = await POST(
      makePostRequest('/api/neynar/cast', {
        text: 'Check this out',
        embeds: ['not-a-valid-url'],
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid input');
  });

  it('publishes a cast with text only', async () => {
    const res = await POST(makePostRequest('/api/neynar/cast', { text: 'Hello Farcaster' }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.cast.text).toBe('Hello Farcaster');
    expect(global.fetch).toHaveBeenCalledWith('https://api.neynar.com/v2/farcaster/cast', {
      method: 'POST',
      headers: {
        'x-api-key': 'test-neynar-key-12345',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        signer_uuid: VALID_UUID,
        text: 'Hello Farcaster',
        embeds: [],
      }),
    });
  });

  it('publishes a cast with embeds', async () => {
    const res = await POST(
      makePostRequest('/api/neynar/cast', {
        text: 'Check this out',
        embeds: ['https://example.com/image.png', 'https://example.com/video.mp4'],
      }),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('https://api.neynar.com/v2/farcaster/cast', {
      method: 'POST',
      headers: {
        'x-api-key': 'test-neynar-key-12345',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        signer_uuid: VALID_UUID,
        text: 'Check this out',
        embeds: [
          { url: 'https://example.com/image.png' },
          { url: 'https://example.com/video.mp4' },
        ],
      }),
    });
  });

  it('returns 500 when Neynar API responds with an error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Signer not active' }),
    });
    const res = await POST(makePostRequest('/api/neynar/cast', { text: 'Hello' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to publish cast');
  });

  it('returns 500 when fetch throws', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    const res = await POST(makePostRequest('/api/neynar/cast', { text: 'Hello' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Internal server error');
  });

  it('handles missing body gracefully', async () => {
    const req = makePostRequest('/api/neynar/cast', { text: 'Hello' });
    // Simulate malformed JSON by mocking req.json to throw
    vi.spyOn(req, 'json').mockRejectedValue(new SyntaxError('Unexpected token'));
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
