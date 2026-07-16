import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makeGetRequest,
  makePostRequest,
  mockAuthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockPostCast, mockLogger } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockPostCast: vi.fn(),
  mockLogger: { error: vi.fn() },
}));

let mockSupabaseMock: ReturnType<typeof chainMock>;

vi.mock('@/lib/auth/session', () => ({
  getSessionData: mockGetSessionData,
}));

vi.mock('@/lib/db/supabase', () => {
  const mockFrom = vi.fn(() => {
    return mockSupabaseMock?.chain || chainMock({ error: null }).chain;
  });
  return {
    supabaseAdmin: {
      from: mockFrom,
    },
  };
});

vi.mock('@/lib/farcaster/neynar', () => ({
  postCast: mockPostCast,
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

import { DELETE, GET, PATCH, POST } from '../route';

describe('GET /api/chat/schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseMock = chainMock({ data: [], error: null });
  });

  // ========================================================================
  // Auth tests
  // ========================================================================

  it('returns 401 when getSessionData returns null', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const req = makeGetRequest('/api/chat/schedule');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  // ========================================================================
  // Success path
  // ========================================================================

  it('returns list of scheduled casts for authenticated user', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const mockScheduled = [
      { id: '1', text: 'Cast 1', status: 'pending', scheduled_for: '2026-07-17T10:00:00Z' },
      { id: '2', text: 'Cast 2', status: 'pending', scheduled_for: '2026-07-17T11:00:00Z' },
    ];
    mockSupabaseMock = chainMock({ data: mockScheduled, error: null });

    const req = makeGetRequest('/api/chat/schedule');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ scheduled: mockScheduled });
  });

  it('filters scheduled casts to pending and failed status', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    mockSupabaseMock = chainMock({ data: [], error: null });

    const req = makeGetRequest('/api/chat/schedule');
    await GET(req);

    // Verify the chain calls include the correct filters
    expect(mockSupabaseMock.chain.eq).toHaveBeenCalledWith('fid', 123);
    expect(mockSupabaseMock.chain.in).toHaveBeenCalledWith('status', ['pending', 'failed']);
    expect(mockSupabaseMock.chain.order).toHaveBeenCalledWith('scheduled_for', {
      ascending: true,
    });
  });

  it('returns 500 when supabase query fails', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    mockSupabaseMock = chainMock({ data: null, error: new Error('DB error') });

    const req = makeGetRequest('/api/chat/schedule');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: 'Failed to fetch' });
  });

  it('returns empty array when no scheduled casts exist', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    mockSupabaseMock = chainMock({ data: [], error: null });

    const req = makeGetRequest('/api/chat/schedule');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ scheduled: [] });
  });
});

describe('POST /api/chat/schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseMock = chainMock({ data: { id: 'cast-123', status: 'pending' }, error: null });
  });

  // ========================================================================
  // Auth tests
  // ========================================================================

  it('returns 401 when getSessionData returns null', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const req = makePostRequest('/api/chat/schedule', {
      text: 'Hello',
      channel: 'zao',
      scheduledFor: '2026-07-17T10:00:00Z',
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized or no signer');
  });

  it('returns 401 when session.signerUuid is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: null }));

    const req = makePostRequest('/api/chat/schedule', {
      text: 'Hello',
      channel: 'zao',
      scheduledFor: '2026-07-17T10:00:00Z',
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized or no signer');
  });

  // ========================================================================
  // Zod validation tests
  // ========================================================================

  it('returns 400 when text is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const req = makePostRequest('/api/chat/schedule', {
      channel: 'zao',
      scheduledFor: '2026-07-17T10:00:00Z',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when text is empty string', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const req = makePostRequest('/api/chat/schedule', {
      text: '',
      channel: 'zao',
      scheduledFor: '2026-07-17T10:00:00Z',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when text exceeds max length', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const longText = 'a'.repeat(1025);
    const req = makePostRequest('/api/chat/schedule', {
      text: longText,
      channel: 'zao',
      scheduledFor: '2026-07-17T10:00:00Z',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when channel is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const req = makePostRequest('/api/chat/schedule', {
      text: 'Hello',
      scheduledFor: '2026-07-17T10:00:00Z',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when channel is empty string', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const req = makePostRequest('/api/chat/schedule', {
      text: 'Hello',
      channel: '',
      scheduledFor: '2026-07-17T10:00:00Z',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when scheduledFor is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const req = makePostRequest('/api/chat/schedule', {
      text: 'Hello',
      channel: 'zao',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when scheduledFor is not a valid datetime', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const req = makePostRequest('/api/chat/schedule', {
      text: 'Hello',
      channel: 'zao',
      scheduledFor: 'not-a-datetime',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when embedHash has invalid format', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const req = makePostRequest('/api/chat/schedule', {
      text: 'Hello',
      channel: 'zao',
      scheduledFor: '2026-07-17T10:00:00Z',
      embedHash: 'invalid-hash',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('accepts valid embedHash format (0x followed by 40 hex chars)', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const validHash = '0x1234567890abcdef1234567890abcdef12345678';
    const req = makePostRequest('/api/chat/schedule', {
      text: 'Hello',
      channel: 'zao',
      scheduledFor: '2026-07-17T10:00:00Z',
      embedHash: validHash,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('returns 400 when embedUrls contains invalid URL', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const req = makePostRequest('/api/chat/schedule', {
      text: 'Hello',
      channel: 'zao',
      scheduledFor: '2026-07-17T10:00:00Z',
      embedUrls: ['not-a-url'],
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when embedUrls exceeds max length', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const req = makePostRequest('/api/chat/schedule', {
      text: 'Hello',
      channel: 'zao',
      scheduledFor: '2026-07-17T10:00:00Z',
      embedUrls: [
        'https://example.com/1.png',
        'https://example.com/2.png',
        'https://example.com/3.png',
      ],
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  // ========================================================================
  // Time validation tests
  // ========================================================================

  it('returns 400 when scheduled time is in the past', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);

    const req = makePostRequest('/api/chat/schedule', {
      text: 'Hello',
      channel: 'zao',
      scheduledFor: pastDate.toISOString(),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Scheduled time must be in the future');
  });

  it('returns 400 when scheduled time is now', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const now = new Date();

    const req = makePostRequest('/api/chat/schedule', {
      text: 'Hello',
      channel: 'zao',
      scheduledFor: now.toISOString(),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Scheduled time must be in the future');
  });

  it('accepts scheduled time in the future', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    const req = makePostRequest('/api/chat/schedule', {
      text: 'Hello',
      channel: 'zao',
      scheduledFor: futureDate.toISOString(),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  // ========================================================================
  // Channel allowlist tests
  // ========================================================================

  it('defaults to zao channel when channel is not in allowlist', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    const req = makePostRequest('/api/chat/schedule', {
      text: 'Hello',
      channel: 'not-in-allowlist',
      scheduledFor: futureDate.toISOString(),
    });

    await POST(req);

    // Verify insert was called with 'zao' as channel
    expect(mockSupabaseMock.chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        channel_id: 'zao',
      }),
    );
  });

  it('uses provided channel when it is in allowlist', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    const req = makePostRequest('/api/chat/schedule', {
      text: 'Hello',
      channel: 'wavewarz',
      scheduledFor: futureDate.toISOString(),
    });

    await POST(req);

    expect(mockSupabaseMock.chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        channel_id: 'wavewarz',
      }),
    );
  });

  // ========================================================================
  // Supabase insert success
  // ========================================================================

  it('inserts scheduled cast to supabase with all fields', async () => {
    const session = mockAuthenticatedSession({ signerUuid: 'test-uuid', fid: 456 });
    mockGetSessionData.mockResolvedValue(session);

    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);
    const isoDate = futureDate.toISOString();

    const embedHash = '0x1234567890abcdef1234567890abcdef12345678';
    const embedUrls = ['https://example.com/image.png'];

    const req = makePostRequest('/api/chat/schedule', {
      text: 'Test cast',
      channel: 'zao',
      scheduledFor: isoDate,
      embedHash,
      embedUrls,
    });

    await POST(req);

    expect(mockSupabaseMock.chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        fid: 456,
        text: 'Test cast',
        channel_id: 'zao',
        scheduled_for: isoDate,
        embed_hash: embedHash,
        embed_urls: embedUrls,
        cross_post_channels: [],
      }),
    );
  });

  it('returns inserted scheduled cast data on success', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const expectedData = {
      id: 'cast-123',
      status: 'pending',
      text: 'Test cast',
    };
    mockSupabaseMock = chainMock({ data: expectedData, error: null });

    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    const req = makePostRequest('/api/chat/schedule', {
      text: 'Test cast',
      channel: 'zao',
      scheduledFor: futureDate.toISOString(),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ scheduled: expectedData });
  });

  // ========================================================================
  // Cross-post channels filtering
  // ========================================================================

  it('filters cross-post channels to only those in allowlist', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    const req = makePostRequest('/api/chat/schedule', {
      text: 'Test cast',
      channel: 'zao',
      scheduledFor: futureDate.toISOString(),
      crossPostChannels: ['wavewarz', 'not-allowed', 'zabal'],
    });

    await POST(req);

    expect(mockSupabaseMock.chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        cross_post_channels: ['wavewarz', 'zabal'],
      }),
    );
  });

  it('sets empty array for cross-post channels when none are valid', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    const req = makePostRequest('/api/chat/schedule', {
      text: 'Test cast',
      channel: 'zao',
      scheduledFor: futureDate.toISOString(),
      crossPostChannels: ['not-allowed', 'invalid'],
    });

    await POST(req);

    expect(mockSupabaseMock.chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        cross_post_channels: [],
      }),
    );
  });

  // ========================================================================
  // Error handling
  // ========================================================================

  it('returns 500 when supabase insert fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));
    mockSupabaseMock = chainMock({ data: null, error: new Error('Insert failed') });

    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    const req = makePostRequest('/api/chat/schedule', {
      text: 'Test cast',
      channel: 'zao',
      scheduledFor: futureDate.toISOString(),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to schedule');

    expect(mockLogger.error).toHaveBeenCalledWith('[schedule] insert error:', expect.any(Error));
  });

  it('catches and logs JSON parse errors', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    // Create a mock request with invalid JSON
    const req = makePostRequest('/api/chat/schedule', {});
    // Manually create a broken request by directly instantiating
    const brokenReq = new Request(req, {
      method: 'POST',
      body: 'not-valid-json',
    });

    const res = await POST(brokenReq as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(500);

    expect(mockLogger.error).toHaveBeenCalledWith('[schedule] error:', expect.any(Error));
  });
});

describe('DELETE /api/chat/schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseMock = chainMock({ data: null, error: null });
  });

  // ========================================================================
  // Auth tests
  // ========================================================================

  it('returns 401 when getSessionData returns null', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const req = makeGetRequest('/api/chat/schedule', { id: 'cast-123' });
    const res = await DELETE(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ========================================================================
  // Input validation
  // ========================================================================

  it('returns 400 when id query param is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const req = makeGetRequest('/api/chat/schedule');
    const res = await DELETE(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Missing id');
  });

  it('returns 400 when id query param is empty string', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const req = makeGetRequest('/api/chat/schedule', { id: '' });
    const res = await DELETE(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Missing id');
  });

  // ========================================================================
  // Success path
  // ========================================================================

  it('updates scheduled cast status to cancelled', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const req = makeGetRequest('/api/chat/schedule', { id: 'cast-123' });
    await DELETE(req);

    // Verify the update was called with correct filters
    expect(mockSupabaseMock.chain.update).toHaveBeenCalledWith({ status: 'cancelled' });
    expect(mockSupabaseMock.chain.eq).toHaveBeenCalledWith('id', 'cast-123');
    expect(mockSupabaseMock.chain.eq).toHaveBeenCalledWith('fid', 123);
    expect(mockSupabaseMock.chain.eq).toHaveBeenCalledWith('status', 'pending');
  });

  it('returns success response', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const req = makeGetRequest('/api/chat/schedule', { id: 'cast-123' });
    const res = await DELETE(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true });
  });

  // ========================================================================
  // Error handling
  // ========================================================================

  it('returns 500 when supabase update fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockSupabaseMock = chainMock({ data: null, error: new Error('Update failed') });

    const req = makeGetRequest('/api/chat/schedule', { id: 'cast-123' });
    const res = await DELETE(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to cancel');
  });

  it('only cancels pending casts (filters by status)', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const req = makeGetRequest('/api/chat/schedule', { id: 'cast-123' });
    await DELETE(req);

    // The third eq call should be for status
    const eqCalls = mockSupabaseMock.chain.eq.mock.calls;
    expect(eqCalls).toContainEqual(['status', 'pending']);
  });
});

describe('PATCH /api/chat/schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseMock = chainMock({ data: [], error: null });
  });

  // ========================================================================
  // Auth tests
  // ========================================================================

  it('returns 401 when getSessionData returns null', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const req = makeGetRequest('/api/chat/schedule');
    const res = await PATCH(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when session.signerUuid is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: null }));

    const req = makeGetRequest('/api/chat/schedule');
    const res = await PATCH(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ========================================================================
  // Success path - no due casts
  // ========================================================================

  it('returns 0 processed when no due casts exist', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));
    mockSupabaseMock = chainMock({ data: [], error: null });

    const req = makeGetRequest('/api/chat/schedule');
    const res = await PATCH(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ processed: 0 });
  });

  it('returns 0 processed when data is null', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));
    mockSupabaseMock = chainMock({ data: null, error: null });

    const req = makeGetRequest('/api/chat/schedule');
    const res = await PATCH(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ processed: 0 });
  });

  // ========================================================================
  // Success path - processing due casts
  // ========================================================================

  it('processes due scheduled casts', async () => {
    const session = mockAuthenticatedSession({
      signerUuid: 'test-uuid',
      fid: 789,
    });
    mockGetSessionData.mockResolvedValue(session);

    const dueCast = {
      id: 'cast-1',
      text: 'Test cast',
      channel_id: 'zao',
      embed_hash: null,
      embed_urls: null,
      cross_post_channels: null,
    };
    mockSupabaseMock = chainMock({ data: [dueCast], error: null });
    mockPostCast.mockResolvedValue({ cast: { hash: '0xabc123' } });

    const req = makeGetRequest('/api/chat/schedule');
    const res = await PATCH(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ processed: 1 });

    // Verify postCast was called
    expect(mockPostCast).toHaveBeenCalledWith(
      'test-uuid',
      'Test cast',
      'zao',
      undefined,
      undefined,
      undefined,
    );
  });

  it('calls postCast with embedHash and embedUrls when present', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const embedHash = '0x1234567890abcdef1234567890abcdef12345678';
    const embedUrls = ['https://example.com/image.png'];
    const dueCast = {
      id: 'cast-1',
      text: 'Test cast',
      channel_id: 'zao',
      embed_hash: embedHash,
      embed_urls: embedUrls,
      cross_post_channels: null,
    };
    mockSupabaseMock = chainMock({ data: [dueCast], error: null });
    mockPostCast.mockResolvedValue({ cast: { hash: '0xabc123' } });

    const req = makeGetRequest('/api/chat/schedule');
    await PATCH(req);

    expect(mockPostCast).toHaveBeenCalledWith(
      'test-uuid',
      'Test cast',
      'zao',
      undefined,
      embedHash,
      embedUrls,
    );
  });

  it('does not include embedUrls when array is empty', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const dueCast = {
      id: 'cast-1',
      text: 'Test cast',
      channel_id: 'zao',
      embed_hash: null,
      embed_urls: [],
      cross_post_channels: null,
    };
    mockSupabaseMock = chainMock({ data: [dueCast], error: null });
    mockPostCast.mockResolvedValue({ cast: { hash: '0xabc123' } });

    const req = makeGetRequest('/api/chat/schedule');
    await PATCH(req);

    expect(mockPostCast).toHaveBeenCalledWith(
      'test-uuid',
      'Test cast',
      'zao',
      undefined,
      undefined,
      undefined,
    );
  });

  it('updates cast status to sent after successful post', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const dueCast = {
      id: 'cast-1',
      text: 'Test cast',
      channel_id: 'zao',
      embed_hash: null,
      embed_urls: null,
      cross_post_channels: null,
    };
    mockSupabaseMock = chainMock({ data: [dueCast], error: null });
    mockPostCast.mockResolvedValue({ cast: { hash: '0xabc123' } });

    const req = makeGetRequest('/api/chat/schedule');
    await PATCH(req);

    // Verify update was called with status: 'sent'
    expect(mockSupabaseMock.chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'sent',
        sent_at: expect.any(String),
      }),
    );
    expect(mockSupabaseMock.chain.eq).toHaveBeenCalledWith('id', 'cast-1');
  });

  // ========================================================================
  // Cross-posting
  // ========================================================================

  it('cross-posts to channels in cross_post_channels array', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const dueCast = {
      id: 'cast-1',
      text: 'Test cast',
      channel_id: 'zao',
      embed_hash: null,
      embed_urls: null,
      cross_post_channels: ['wavewarz', 'zabal'],
    };
    mockSupabaseMock = chainMock({ data: [dueCast], error: null });
    mockPostCast
      .mockResolvedValueOnce({ cast: { hash: '0xabc123' } })
      .mockResolvedValueOnce({ cast: { hash: '0xdef456' } })
      .mockResolvedValueOnce({ cast: { hash: '0xghi789' } });

    const req = makeGetRequest('/api/chat/schedule');
    const res = await PATCH(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ processed: 1 });

    // postCast should be called 3 times: primary + 2 cross-posts
    expect(mockPostCast).toHaveBeenCalledTimes(3);
  });

  it('skips cross-posting when cross_post_channels is null', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const dueCast = {
      id: 'cast-1',
      text: 'Test cast',
      channel_id: 'zao',
      embed_hash: null,
      embed_urls: null,
      cross_post_channels: null,
    };
    mockSupabaseMock = chainMock({ data: [dueCast], error: null });
    mockPostCast.mockResolvedValue({ cast: { hash: '0xabc123' } });

    const req = makeGetRequest('/api/chat/schedule');
    await PATCH(req);

    // postCast should be called only once (primary)
    expect(mockPostCast).toHaveBeenCalledTimes(1);
  });

  it('skips cross-posting when cross_post_channels is empty array', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const dueCast = {
      id: 'cast-1',
      text: 'Test cast',
      channel_id: 'zao',
      embed_hash: null,
      embed_urls: null,
      cross_post_channels: [],
    };
    mockSupabaseMock = chainMock({ data: [dueCast], error: null });
    mockPostCast.mockResolvedValue({ cast: { hash: '0xabc123' } });

    const req = makeGetRequest('/api/chat/schedule');
    await PATCH(req);

    // postCast should be called only once (primary)
    expect(mockPostCast).toHaveBeenCalledTimes(1);
  });

  // ========================================================================
  // Limit and filtering
  // ========================================================================

  it('applies limit(5) to due casts query', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const dueCasts = Array.from({ length: 3 }, (_, i) => ({
      id: `cast-${i}`,
      text: `Cast ${i}`,
      channel_id: 'zao',
      embed_hash: null,
      embed_urls: null,
      cross_post_channels: null,
    }));
    mockSupabaseMock = chainMock({ data: dueCasts, error: null });
    mockPostCast.mockResolvedValue({ cast: { hash: '0xabc123' } });

    const req = makeGetRequest('/api/chat/schedule');
    const res = await PATCH(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.processed).toBe(3);

    // Verify limit was called with 5
    expect(mockSupabaseMock.chain.limit).toHaveBeenCalledWith(5);
  });

  it('queries only pending casts scheduled before now', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));
    mockSupabaseMock = chainMock({ data: [], error: null });

    const req = makeGetRequest('/api/chat/schedule');
    await PATCH(req);

    // Verify correct query filters
    expect(mockSupabaseMock.chain.eq).toHaveBeenCalledWith('status', 'pending');
    expect(mockSupabaseMock.chain.lte).toHaveBeenCalledWith('scheduled_for', expect.any(String));
    expect(mockSupabaseMock.chain.limit).toHaveBeenCalledWith(5);
  });

  // ========================================================================
  // Error handling
  // ========================================================================

  it('updates cast status to failed on postCast error', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const dueCast = {
      id: 'cast-1',
      text: 'Test cast',
      channel_id: 'zao',
      embed_hash: null,
      embed_urls: null,
      cross_post_channels: null,
    };
    mockSupabaseMock = chainMock({ data: [dueCast], error: null });
    mockPostCast.mockRejectedValue(new Error('Neynar API failed'));

    const req = makeGetRequest('/api/chat/schedule');
    const res = await PATCH(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ processed: 0 });

    // Verify update was called with failed status
    expect(mockSupabaseMock.chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        error_message: 'Neynar API failed',
      }),
    );
  });

  it('handles non-Error objects in catch block', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const dueCast = {
      id: 'cast-1',
      text: 'Test cast',
      channel_id: 'zao',
      embed_hash: null,
      embed_urls: null,
      cross_post_channels: null,
    };
    mockSupabaseMock = chainMock({ data: [dueCast], error: null });
    mockPostCast.mockRejectedValue('string error');

    const req = makeGetRequest('/api/chat/schedule');
    const res = await PATCH(req);

    expect(res.status).toBe(200);

    // Verify update was called with 'Unknown error' message
    expect(mockSupabaseMock.chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        error_message: 'Unknown error',
      }),
    );
  });

  it('continues processing even if one cast update fails after posting', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const dueCasts = [
      {
        id: 'cast-1',
        text: 'Cast 1',
        channel_id: 'zao',
        embed_hash: null,
        embed_urls: null,
        cross_post_channels: null,
      },
      {
        id: 'cast-2',
        text: 'Cast 2',
        channel_id: 'zao',
        embed_hash: null,
        embed_urls: null,
        cross_post_channels: null,
      },
    ];
    mockSupabaseMock = chainMock({ data: dueCasts, error: null });
    mockPostCast
      .mockResolvedValueOnce({ cast: { hash: '0xabc123' } })
      .mockResolvedValueOnce({ cast: { hash: '0xdef456' } });

    const req = makeGetRequest('/api/chat/schedule');
    const res = await PATCH(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    // Both should be processed even if the second's update fails
    expect(body.processed).toBeGreaterThan(0);
  });

  it('continues processing other casts if one fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const dueCasts = [
      {
        id: 'cast-1',
        text: 'Cast 1',
        channel_id: 'zao',
        embed_hash: null,
        embed_urls: null,
        cross_post_channels: null,
      },
      {
        id: 'cast-2',
        text: 'Cast 2',
        channel_id: 'zao',
        embed_hash: null,
        embed_urls: null,
        cross_post_channels: null,
      },
    ];
    mockSupabaseMock = chainMock({ data: dueCasts, error: null });
    mockPostCast
      .mockRejectedValueOnce(new Error('First failed'))
      .mockResolvedValueOnce({ cast: { hash: '0xabc123' } });

    const req = makeGetRequest('/api/chat/schedule');
    const res = await PATCH(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.processed).toBe(1); // Only one succeeded
  });

  it('uses Promise.allSettled for cross-posting to continue on failures', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const dueCast = {
      id: 'cast-1',
      text: 'Test cast',
      channel_id: 'zao',
      embed_hash: null,
      embed_urls: null,
      cross_post_channels: ['wavewarz', 'zabal'],
    };
    mockSupabaseMock = chainMock({ data: [dueCast], error: null });
    mockPostCast
      .mockResolvedValueOnce({ cast: { hash: '0xabc123' } }) // primary
      .mockRejectedValueOnce(new Error('Cross-post 1 failed')) // first cross-post
      .mockResolvedValueOnce({ cast: { hash: '0xdef456' } }); // second cross-post

    const req = makeGetRequest('/api/chat/schedule');
    const res = await PATCH(req);

    // Should still mark as sent even though one cross-post failed
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.processed).toBe(1);
  });
});
