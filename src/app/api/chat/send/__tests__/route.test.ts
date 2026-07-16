import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chainMock, makePostRequest, mockAuthenticatedSession } from '@/test-utils/api-helpers';

const {
  mockGetSessionData,
  mockPostCast,
  mockTouchActivity,
  mockExtractAndSaveSongs,
  mockCreateInAppNotification,
  mockSendNotification,
  mockLogger,
} = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockPostCast: vi.fn(),
  mockTouchActivity: vi.fn(),
  mockExtractAndSaveSongs: vi.fn(),
  mockCreateInAppNotification: vi.fn(),
  mockSendNotification: vi.fn(),
  mockLogger: { error: vi.fn() },
}));

let mockSupabaseMock: ReturnType<typeof chainMock>;
let mockUsersMock: ReturnType<typeof chainMock>;

vi.mock('@/lib/auth/session', () => ({
  getSessionData: mockGetSessionData,
}));

vi.mock('@/lib/db/supabase', () => {
  const mockFrom = vi.fn((table: string) => {
    if (table === 'users') {
      return mockUsersMock?.chain || chainMock({ data: [], error: null }).chain;
    }
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

vi.mock('@/lib/db/activity', () => ({
  touchActivity: mockTouchActivity,
}));

vi.mock('@/lib/music/library', () => ({
  extractAndSaveSongs: mockExtractAndSaveSongs,
}));

vi.mock('@/lib/notifications', () => ({
  createInAppNotification: mockCreateInAppNotification,
  sendNotification: mockSendNotification,
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

import { POST } from '../route';

describe('POST /api/chat/send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseMock = chainMock({ error: null });
    mockUsersMock = chainMock({ data: [], error: null });
    // Set up default resolved values for fire-and-forget functions
    mockExtractAndSaveSongs.mockResolvedValue(undefined);
    mockSendNotification.mockResolvedValue(undefined);
    mockCreateInAppNotification.mockResolvedValue(undefined);
  });

  // ========================================================================
  // Auth tests
  // ========================================================================

  it('returns 401 when getSessionData returns null', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const req = makePostRequest('/api/chat/send', {
      text: 'Hello world',
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 when session.signerUuid is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: null }));

    const req = makePostRequest('/api/chat/send', {
      text: 'Hello world',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('No signer configured. Please approve a signer first.');
  });

  // ========================================================================
  // Zod validation tests
  // ========================================================================

  it('returns 400 with validation error when text is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const req = makePostRequest('/api/chat/send', {
      channel: 'zao',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when text exceeds max length', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const longText = 'a'.repeat(1025);
    const req = makePostRequest('/api/chat/send', {
      text: longText,
      channel: 'zao',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when embedHash has invalid format', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const req = makePostRequest('/api/chat/send', {
      text: 'Hello world',
      embedHash: 'invalid-hash',
      channel: 'zao',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when channel has invalid format', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const req = makePostRequest('/api/chat/send', {
      text: 'Hello world',
      channel: 'INVALID_CAPS',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  // ========================================================================
  // Channel allowlist tests
  // ========================================================================

  it('defaults to zao channel when channel is not in allowlist', async () => {
    const session = mockAuthenticatedSession({ signerUuid: 'test-uuid' });
    mockGetSessionData.mockResolvedValue(session);

    const mockCast = { hash: '0x123abc', embeds: [] };
    mockPostCast.mockResolvedValue({ cast: mockCast });

    const req = makePostRequest('/api/chat/send', {
      text: 'Hello world',
      channel: 'not-in-allowlist',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Verify postCast was called with 'zao' as primary channel
    expect(mockPostCast).toHaveBeenCalledWith(
      'test-uuid',
      'Hello world',
      'zao', // defaulted
      undefined,
      undefined,
      undefined,
      undefined,
    );
  });

  it('uses provided channel when it is in allowlist', async () => {
    const session = mockAuthenticatedSession({ signerUuid: 'test-uuid' });
    mockGetSessionData.mockResolvedValue(session);

    const mockCast = { hash: '0x123abc', embeds: [] };
    mockPostCast.mockResolvedValue({ cast: mockCast });

    const req = makePostRequest('/api/chat/send', {
      text: 'Hello world',
      channel: 'wavewarz',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Verify postCast was called with 'wavewarz'
    expect(mockPostCast).toHaveBeenCalledWith(
      'test-uuid',
      'Hello world',
      'wavewarz',
      undefined,
      undefined,
      undefined,
      undefined,
    );
  });

  // ========================================================================
  // postCast success path
  // ========================================================================

  it('calls postCast with all params from the request', async () => {
    const session = mockAuthenticatedSession({ signerUuid: 'test-uuid' });
    mockGetSessionData.mockResolvedValue(session);

    const mockCast = { hash: '0xabc123', embeds: [] };
    mockPostCast.mockResolvedValue({ cast: mockCast });

    const parentHash = '0x1111111111111111111111111111111111111111';
    const embedHash = '0x2222222222222222222222222222222222222222';
    const embedUrls = ['https://example.com/image.png'];
    const embedFid = 42;

    const req = makePostRequest('/api/chat/send', {
      text: 'Hello with embed',
      parentHash,
      embedHash,
      embedFid,
      embedUrls,
      channel: 'zao',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockPostCast).toHaveBeenCalledWith(
      'test-uuid',
      'Hello with embed',
      'zao',
      parentHash,
      embedHash,
      embedUrls,
      embedFid,
    );
  });

  // ========================================================================
  // Supabase write tests
  // ========================================================================

  it('writes cast to supabase channel_casts table', async () => {
    const session = mockAuthenticatedSession({
      signerUuid: 'test-uuid',
      fid: 999,
      username: 'testuser',
      displayName: 'Test User',
      pfpUrl: 'https://example.com/pfp.png',
    });
    mockGetSessionData.mockResolvedValue(session);

    const mockCast = { hash: '0xabc123', embeds: [{ type: 'url', url: 'https://example.com' }] };
    mockPostCast.mockResolvedValue({ cast: mockCast });

    const req = makePostRequest('/api/chat/send', {
      text: 'Hello world',
      channel: 'zao',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Verify supabase upsert was called
    expect(mockSupabaseMock.chain.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          hash: '0xabc123',
          channel_id: 'zao',
          fid: 999,
          author_username: 'testuser',
          author_display: 'Test User',
          author_pfp: 'https://example.com/pfp.png',
          text: 'Hello world',
          embeds: expect.any(Array),
          reactions: expect.any(Object),
          replies_count: 0,
        }),
      ]),
      { onConflict: 'hash' },
    );
  });

  it('handles null parentHash in supabase write', async () => {
    const session = mockAuthenticatedSession({ signerUuid: 'test-uuid' });
    mockGetSessionData.mockResolvedValue(session);

    const mockCast = { hash: '0xabc123', embeds: [] };
    mockPostCast.mockResolvedValue({ cast: mockCast });

    const req = makePostRequest('/api/chat/send', {
      text: 'No parent',
      channel: 'zao',
    });

    await POST(req);

    const callArgs = mockSupabaseMock.chain.upsert.mock.calls[0];
    expect(callArgs[0][0].parent_hash).toBeNull();
  });

  // ========================================================================
  // Fire-and-forget activity/song tracking
  // ========================================================================

  it('calls touchActivity with session fid', async () => {
    const session = mockAuthenticatedSession({ signerUuid: 'test-uuid', fid: 777 });
    mockGetSessionData.mockResolvedValue(session);

    const mockCast = { hash: '0xabc123', embeds: [] };
    mockPostCast.mockResolvedValue({ cast: mockCast });

    const req = makePostRequest('/api/chat/send', {
      text: 'Track activity',
      channel: 'zao',
    });

    await POST(req);

    expect(mockTouchActivity).toHaveBeenCalledWith(777);
  });

  it('calls extractAndSaveSongs with text and embedUrls', async () => {
    const session = mockAuthenticatedSession({ signerUuid: 'test-uuid', fid: 777 });
    mockGetSessionData.mockResolvedValue(session);

    const mockCast = { hash: '0xabc123', embeds: [] };
    mockPostCast.mockResolvedValue({ cast: mockCast });

    mockExtractAndSaveSongs.mockResolvedValue(undefined);

    const embedUrls = ['https://spotify.com/song/123', 'https://soundcloud.com/track'];

    const req = makePostRequest('/api/chat/send', {
      text: 'Check this track',
      embedUrls,
      channel: 'zao',
    });

    await POST(req);

    expect(mockExtractAndSaveSongs).toHaveBeenCalledWith(
      'Check this track',
      embedUrls,
      777,
      'chat',
    );
  });

  it('logs error if extractAndSaveSongs throws', async () => {
    const session = mockAuthenticatedSession({ signerUuid: 'test-uuid', fid: 777 });
    mockGetSessionData.mockResolvedValue(session);

    const mockCast = { hash: '0xabc123', embeds: [] };
    mockPostCast.mockResolvedValue({ cast: mockCast });

    const extractError = new Error('Song extraction failed');
    mockExtractAndSaveSongs.mockRejectedValue(extractError);

    const req = makePostRequest('/api/chat/send', {
      text: 'Check this track',
      channel: 'zao',
    });

    await POST(req);

    expect(mockLogger.error).toHaveBeenCalledWith(
      '[chat/send] song extraction failed:',
      extractError,
    );
  });

  // ========================================================================
  // Cross-posting tests
  // ========================================================================

  it('cross-posts to additional channels when crossPostChannels provided', async () => {
    const session = mockAuthenticatedSession({ signerUuid: 'test-uuid' });
    mockGetSessionData.mockResolvedValue(session);

    const mockCast1 = { hash: '0xabc123', embeds: [] };
    const mockCast2 = { hash: '0xdef456', embeds: [] };
    const mockCast3 = { hash: '0xghi789', embeds: [] };

    mockPostCast
      .mockResolvedValueOnce({ cast: mockCast1 })
      .mockResolvedValueOnce({ cast: mockCast2 })
      .mockResolvedValueOnce({ cast: mockCast3 });

    const req = makePostRequest('/api/chat/send', {
      text: 'Cross-post test',
      channel: 'zao',
      crossPostChannels: ['wavewarz', 'zabal'],
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // postCast should be called 3 times: primary + 2 cross-posts
    expect(mockPostCast).toHaveBeenCalledTimes(3);

    // Check the cross-post calls
    expect(mockPostCast).toHaveBeenNthCalledWith(
      2,
      'test-uuid',
      'Cross-post test',
      'wavewarz',
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(mockPostCast).toHaveBeenNthCalledWith(
      3,
      'test-uuid',
      'Cross-post test',
      'zabal',
      undefined,
      undefined,
      undefined,
      undefined,
    );

    // Response should include crossPosted
    const body = await res.json();
    expect(body.crossPosted).toContain('wavewarz');
    expect(body.crossPosted).toContain('zabal');
  });

  it('filters cross-post channels to only those in allowlist', async () => {
    const session = mockAuthenticatedSession({ signerUuid: 'test-uuid' });
    mockGetSessionData.mockResolvedValue(session);

    const mockCast1 = { hash: '0xabc123', embeds: [] };
    const mockCast2 = { hash: '0xdef456', embeds: [] };

    mockPostCast
      .mockResolvedValueOnce({ cast: mockCast1 })
      .mockResolvedValueOnce({ cast: mockCast2 });

    const req = makePostRequest('/api/chat/send', {
      text: 'Cross-post test',
      channel: 'zao',
      crossPostChannels: ['wavewarz', 'not-allowed', 'invalid-channel'],
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // postCast should be called 2 times: primary + 1 valid cross-post (wavewarz)
    expect(mockPostCast).toHaveBeenCalledTimes(2);

    const body = await res.json();
    expect(body.crossPosted).toEqual(['wavewarz']);
  });

  it('skips cross-posting if cross-post channels array is empty', async () => {
    const session = mockAuthenticatedSession({ signerUuid: 'test-uuid' });
    mockGetSessionData.mockResolvedValue(session);

    const mockCast = { hash: '0xabc123', embeds: [] };
    mockPostCast.mockResolvedValue({ cast: mockCast });

    const req = makePostRequest('/api/chat/send', {
      text: 'No cross-post',
      channel: 'zao',
      crossPostChannels: [],
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // postCast should be called only once for primary
    expect(mockPostCast).toHaveBeenCalledTimes(1);

    const body = await res.json();
    expect(body.crossPosted).toEqual([]);
  });

  it('writes cross-posted casts to supabase', async () => {
    const session = mockAuthenticatedSession({
      signerUuid: 'test-uuid',
      fid: 999,
      username: 'testuser',
      displayName: 'Test User',
      pfpUrl: 'https://example.com/pfp.png',
    });
    mockGetSessionData.mockResolvedValue(session);

    const mockCast1 = { hash: '0xabc123', embeds: [] };
    const mockCast2 = { hash: '0xdef456', embeds: [] };

    mockPostCast
      .mockResolvedValueOnce({ cast: mockCast1 })
      .mockResolvedValueOnce({ cast: mockCast2 });

    const req = makePostRequest('/api/chat/send', {
      text: 'Cross-post test',
      channel: 'zao',
      crossPostChannels: ['wavewarz'],
    });

    await POST(req);

    // Give Promise.allSettled time to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    // upsert should be called twice: once for primary, once for cross-post
    expect(mockSupabaseMock.chain.upsert).toHaveBeenCalledTimes(2);

    const crossPostCall = mockSupabaseMock.chain.upsert.mock.calls[1];
    expect(crossPostCall[0][0]).toMatchObject({
      hash: '0xdef456',
      channel_id: 'wavewarz',
      fid: 999,
      text: 'Cross-post test',
      parent_hash: null, // Cross-posts have no parent
    });
  });

  // ========================================================================
  // Notification tests
  // ========================================================================

  it('calls sendNotification with formatted message', async () => {
    const session = mockAuthenticatedSession({
      signerUuid: 'test-uuid',
      fid: 777,
      displayName: 'Alice',
    });
    mockGetSessionData.mockResolvedValue(session);

    mockSendNotification.mockResolvedValue(undefined);

    const mockCast = { hash: '0xabc123', embeds: [] };
    mockPostCast.mockResolvedValue({ cast: mockCast });

    const req = makePostRequest('/api/chat/send', {
      text: 'Short message',
      channel: 'zao',
    });

    await POST(req);

    expect(mockSendNotification).toHaveBeenCalledWith(
      'Alice in #zao',
      'Short message',
      'https://zaoos.com/chat',
      expect.stringContaining('msg-'),
      777,
    );
  });

  it('truncates notification preview to 80 chars', async () => {
    const session = mockAuthenticatedSession({
      signerUuid: 'test-uuid',
      fid: 777,
      displayName: 'Alice',
    });
    mockGetSessionData.mockResolvedValue(session);

    mockSendNotification.mockResolvedValue(undefined);

    const mockCast = { hash: '0xabc123', embeds: [] };
    mockPostCast.mockResolvedValue({ cast: mockCast });

    const longText = 'a'.repeat(100);
    const req = makePostRequest('/api/chat/send', {
      text: longText,
      channel: 'zao',
    });

    await POST(req);

    const callArgs = mockSendNotification.mock.calls[0];
    const preview = callArgs[1];
    expect(preview).toBe(`${'a'.repeat(80)}...`);
  });

  it('creates in-app notification for active members excluding sender', async () => {
    const session = mockAuthenticatedSession({
      signerUuid: 'test-uuid',
      fid: 777,
      displayName: 'Alice',
      pfpUrl: 'https://example.com/pfp.png',
    });
    mockGetSessionData.mockResolvedValue(session);

    const mockCast = { hash: '0xabc123', embeds: [] };
    mockPostCast.mockResolvedValue({ cast: mockCast });

    mockCreateInAppNotification.mockResolvedValue(undefined);

    // Mock the users query to return multiple members (already filtered by .neq('fid', session.fid))
    mockUsersMock = chainMock({
      data: [{ fid: 111 }, { fid: 222 }],
      error: null,
    });

    const req = makePostRequest('/api/chat/send', {
      text: 'Test message',
      channel: 'zao',
    });

    await POST(req);

    // Wait for the promise to resolve
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockCreateInAppNotification).toHaveBeenCalledWith({
      recipientFids: [111, 222],
      type: 'message',
      title: 'Alice in #zao',
      body: 'Test message',
      href: '/chat',
      actorFid: 777,
      actorDisplayName: 'Alice',
      actorPfpUrl: 'https://example.com/pfp.png',
    });
  });

  // ========================================================================
  // Error handling tests
  // ========================================================================

  it('returns 500 when postCast throws', async () => {
    const session = mockAuthenticatedSession({ signerUuid: 'test-uuid' });
    mockGetSessionData.mockResolvedValue(session);

    mockPostCast.mockRejectedValue(new Error('Neynar API error'));

    const req = makePostRequest('/api/chat/send', {
      text: 'This will fail',
      channel: 'zao',
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body).toEqual({ error: 'Failed to send message' });

    expect(mockLogger.error).toHaveBeenCalledWith('Send message error:', expect.any(Error));
  });

  it('logs DB error when upsert fails', async () => {
    const session = mockAuthenticatedSession({ signerUuid: 'test-uuid' });
    mockGetSessionData.mockResolvedValue(session);

    const mockCast = { hash: '0xabc123', embeds: [] };
    mockPostCast.mockResolvedValue({ cast: mockCast });

    // Create mock with error
    mockSupabaseMock = chainMock({ error: new Error('DB error') });

    const req = makePostRequest('/api/chat/send', {
      text: 'DB will fail',
      channel: 'zao',
    });

    await POST(req);

    expect(mockLogger.error).toHaveBeenCalledWith('[send] DB insert error:', expect.any(Error));
  });

  // ========================================================================
  // Success path response shape
  // ========================================================================

  it('returns success response with cast and crossPosted', async () => {
    const session = mockAuthenticatedSession({ signerUuid: 'test-uuid' });
    mockGetSessionData.mockResolvedValue(session);

    const mockCast = { hash: '0xabc123', embeds: [] };
    mockPostCast.mockResolvedValue({ cast: mockCast });

    const req = makePostRequest('/api/chat/send', {
      text: 'Success test',
      channel: 'zao',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.cast).toEqual(mockCast);
    expect(body.crossPosted).toEqual([]);
  });

  // ========================================================================
  // Edge cases and special scenarios
  // ========================================================================

  it('handles cast with no embeds in response', async () => {
    const session = mockAuthenticatedSession({ signerUuid: 'test-uuid' });
    mockGetSessionData.mockResolvedValue(session);

    const mockCast = { hash: '0xabc123' }; // No embeds field
    mockPostCast.mockResolvedValue({ cast: mockCast });

    const req = makePostRequest('/api/chat/send', {
      text: 'No embeds',
      channel: 'zao',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const callArgs = mockSupabaseMock.chain.upsert.mock.calls[0];
    expect(callArgs[0][0].embeds).toEqual([]);
  });

  it('handles multiple cross-posts simultaneously', async () => {
    const session = mockAuthenticatedSession({ signerUuid: 'test-uuid' });
    mockGetSessionData.mockResolvedValue(session);

    const mockCasts = [
      { hash: '0xabc123', embeds: [] },
      { hash: '0xdef456', embeds: [] },
      { hash: '0xghi789', embeds: [] },
    ];

    mockPostCast
      .mockResolvedValueOnce({ cast: mockCasts[0] })
      .mockResolvedValueOnce({ cast: mockCasts[1] })
      .mockResolvedValueOnce({ cast: mockCasts[2] });

    const req = makePostRequest('/api/chat/send', {
      text: 'Multi cross-post',
      channel: 'zao',
      crossPostChannels: ['wavewarz', 'zabal', 'cocconcertz'],
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.crossPosted.length).toBe(3);
  });

  it('handles empty embedUrls array', async () => {
    const session = mockAuthenticatedSession({ signerUuid: 'test-uuid', fid: 777 });
    mockGetSessionData.mockResolvedValue(session);

    const mockCast = { hash: '0xabc123', embeds: [] };
    mockPostCast.mockResolvedValue({ cast: mockCast });

    mockExtractAndSaveSongs.mockResolvedValue(undefined);

    const req = makePostRequest('/api/chat/send', {
      text: 'No embeds',
      embedUrls: [],
      channel: 'zao',
    });

    await POST(req);

    expect(mockExtractAndSaveSongs).toHaveBeenCalledWith('No embeds', [], 777, 'chat');
  });

  it('handles sendNotification errors gracefully', async () => {
    const session = mockAuthenticatedSession({
      signerUuid: 'test-uuid',
      fid: 777,
    });
    mockGetSessionData.mockResolvedValue(session);

    const mockCast = { hash: '0xabc123', embeds: [] };
    mockPostCast.mockResolvedValue({ cast: mockCast });

    mockSendNotification.mockRejectedValue(new Error('Notification failed'));

    const req = makePostRequest('/api/chat/send', {
      text: 'Test',
      channel: 'zao',
    });

    const res = await POST(req);
    expect(res.status).toBe(200); // Should not fail, notifications are fire-and-forget

    expect(mockLogger.error).toHaveBeenCalledWith('[notify]', expect.any(Error));
  });
});
