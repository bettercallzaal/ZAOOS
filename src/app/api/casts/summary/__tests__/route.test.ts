import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockGetCastConversationSummary } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockGetCastConversationSummary: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: mockGetSessionData,
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getCastConversationSummary: mockGetCastConversationSummary,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

describe('POST /api/casts/summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const req = makePostRequest('/api/casts/summary', {
      castHash: '0x1234567890abcdef',
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
    expect(mockGetCastConversationSummary).not.toHaveBeenCalled();
  });

  it('returns 401 when session fid is missing', async () => {
    mockGetSessionData.mockResolvedValue({
      username: 'testuser',
      displayName: 'Test User',
    });

    const req = makePostRequest('/api/casts/summary', {
      castHash: '0x1234567890abcdef',
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when castHash is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const req = makePostRequest('/api/casts/summary', {});

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
    expect(Array.isArray(body.details)).toBe(true);
  });

  it('returns 400 when castHash does not start with 0x', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const req = makePostRequest('/api/casts/summary', {
      castHash: 'abcdef123456',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
    expect(Array.isArray(body.details)).toBe(true);
  });

  it('returns 400 when castHash is empty string', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const req = makePostRequest('/api/casts/summary', {
      castHash: '',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('accepts castHash of just 0x (edge case but valid per Zod startsWith)', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const summaryData = { conversation: { total_replies: 0 } };
    mockGetCastConversationSummary.mockResolvedValue(summaryData);

    const req = makePostRequest('/api/casts/summary', {
      castHash: '0x',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockGetCastConversationSummary).toHaveBeenCalledWith('0x');
  });

  it('returns 200 with summary data on success', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const summaryData = {
      cast: {
        hash: '0x1234567890abcdef',
        author: { fid: 456 },
        text: 'Test cast',
      },
      conversation: {
        total_replies: 5,
        total_recasts: 2,
      },
    };

    mockGetCastConversationSummary.mockResolvedValue(summaryData);

    const req = makePostRequest('/api/casts/summary', {
      castHash: '0x1234567890abcdef',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual(summaryData);
    expect(mockGetCastConversationSummary).toHaveBeenCalledWith('0x1234567890abcdef');
  });

  it('calls getCastConversationSummary with the provided castHash', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const summaryData = { conversation: { total_replies: 10 } };
    mockGetCastConversationSummary.mockResolvedValue(summaryData);

    const castHash = '0xaabbccddee1122334455';
    const req = makePostRequest('/api/casts/summary', { castHash });

    await POST(req);

    expect(mockGetCastConversationSummary).toHaveBeenCalledWith(castHash);
  });

  it('returns 500 when getCastConversationSummary throws', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockGetCastConversationSummary.mockRejectedValue(new Error('Neynar API error'));

    const req = makePostRequest('/api/casts/summary', {
      castHash: '0x1234567890abcdef',
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe('Failed to get cast summary');
  });

  it('logs error when getCastConversationSummary throws', async () => {
    const loggerMock = vi.mocked(await import('@/lib/logger')).logger;
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const testError = new Error('Neynar timeout');
    mockGetCastConversationSummary.mockRejectedValue(testError);

    const req = makePostRequest('/api/casts/summary', {
      castHash: '0x1234567890abcdef',
    });

    await POST(req);

    expect(loggerMock.error).toHaveBeenCalledWith('Cast summary error:', testError);
  });

  it('accepts castHash with multiple 0x prefixed hex values', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const summaryData = { conversation: { total_replies: 3 } };
    mockGetCastConversationSummary.mockResolvedValue(summaryData);

    const castHash = '0xdeadbeefcafebabe';
    const req = makePostRequest('/api/casts/summary', { castHash });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockGetCastConversationSummary).toHaveBeenCalledWith(castHash);
  });

  it('rejects castHash with leading whitespace', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const req = makePostRequest('/api/casts/summary', {
      castHash: ' 0x1234567890abcdef',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(mockGetCastConversationSummary).not.toHaveBeenCalled();
  });

  it('rejects castHash that is not a string', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const req = makePostRequest('/api/casts/summary', {
      castHash: 12345,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('ignores extra properties in request body', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const summaryData = { conversation: { total_replies: 1 } };
    mockGetCastConversationSummary.mockResolvedValue(summaryData);

    const req = makePostRequest('/api/casts/summary', {
      castHash: '0x1234567890abcdef',
      extraField: 'should be ignored',
      anotherField: 123,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockGetCastConversationSummary).toHaveBeenCalledWith('0x1234567890abcdef');
  });

  it('authenticates with a valid FID in session', async () => {
    const session = mockAuthenticatedSession({ fid: 999 });
    mockGetSessionData.mockResolvedValue(session);

    const summaryData = { conversation: { total_replies: 0 } };
    mockGetCastConversationSummary.mockResolvedValue(summaryData);

    const req = makePostRequest('/api/casts/summary', {
      castHash: '0x1234567890abcdef',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('returns NextResponse.json for all response types', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const summaryData = { test: 'data' };
    mockGetCastConversationSummary.mockResolvedValue(summaryData);

    const req = makePostRequest('/api/casts/summary', {
      castHash: '0x1234567890abcdef',
    });

    const res = await POST(req);

    expect(res.headers.get('content-type')).toContain('application/json');
  });
});
