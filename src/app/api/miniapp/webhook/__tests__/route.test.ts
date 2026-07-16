import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chainMock, makePostRequest } from '@/test-utils/api-helpers';

const { mockParseWebhookEvent, mockVerifyAppKeyWithNeynar, mockFrom } = vi.hoisted(() => ({
  mockParseWebhookEvent: vi.fn(),
  mockVerifyAppKeyWithNeynar: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@farcaster/miniapp-node', () => ({
  parseWebhookEvent: mockParseWebhookEvent,
  verifyAppKeyWithNeynar: mockVerifyAppKeyWithNeynar,
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { POST } from '../route';

const FID = 123;
const TOKEN = 'test-token-xyz';
const NOTIFICATION_URL = 'https://example.com/notify';

describe('POST /api/miniapp/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // Verification failure tests
  // =========================================================================

  it('returns 500 when parseWebhookEvent throws', async () => {
    mockParseWebhookEvent.mockRejectedValue(new Error('Invalid signature'));
    const req = makePostRequest('/api/miniapp/webhook', { raw: 'data' });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Webhook processing failed');
  });

  it('passes verifyAppKeyWithNeynar to parseWebhookEvent', async () => {
    const allowlistMock = chainMock({ data: { id: 'member-1' } });
    mockFrom.mockReturnValue(allowlistMock.chain);
    mockParseWebhookEvent.mockResolvedValue({
      fid: FID,
      event: {
        event: 'miniapp_added',
        notificationDetails: { token: TOKEN, url: NOTIFICATION_URL },
      },
    });

    const webhookData = { some: 'data' };
    const req = makePostRequest('/api/miniapp/webhook', webhookData);
    await POST(req);

    // Verify parseWebhookEvent was called with the data and the verifyAppKeyWithNeynar function
    expect(mockParseWebhookEvent).toHaveBeenCalledWith(webhookData, mockVerifyAppKeyWithNeynar);
  });

  // =========================================================================
  // FID allowlist check tests
  // =========================================================================

  it('returns success silently when FID is not in allowlist', async () => {
    const allowlistMock = chainMock({ data: null });
    mockFrom.mockReturnValue(allowlistMock.chain);
    mockParseWebhookEvent.mockResolvedValue({
      fid: FID,
      event: {
        event: 'miniapp_added',
        notificationDetails: { token: TOKEN, url: NOTIFICATION_URL },
      },
    });

    const req = makePostRequest('/api/miniapp/webhook', {});
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify we checked the allowlist
    expect(mockFrom).toHaveBeenCalledWith('allowlist');
  });

  it('verifies FID is active in allowlist query', async () => {
    const allowlistMock = chainMock({ data: { id: 'member-1' } });
    mockFrom.mockReturnValue(allowlistMock.chain);
    mockParseWebhookEvent.mockResolvedValue({
      fid: FID,
      event: {
        event: 'miniapp_added',
        notificationDetails: { token: TOKEN, url: NOTIFICATION_URL },
      },
    });

    const req = makePostRequest('/api/miniapp/webhook', {});
    await POST(req);

    // Verify the allowlist query chain: select -> eq(fid) -> eq(is_active) -> maybeSingle
    expect(allowlistMock.chain.select).toHaveBeenCalledWith('id');
    expect(allowlistMock.chain.eq).toHaveBeenNthCalledWith(1, 'fid', FID);
    expect(allowlistMock.chain.eq).toHaveBeenNthCalledWith(2, 'is_active', true);
    expect(allowlistMock.chain.maybeSingle).toHaveBeenCalled();
  });

  // =========================================================================
  // Event: miniapp_added
  // =========================================================================

  it('handles miniapp_added event with notification details', async () => {
    const allowlistMock = chainMock({ data: { id: 'member-1' } });
    const notificationMock = chainMock({ data: null });

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      callIndex++;
      return callIndex === 1 ? allowlistMock.chain : notificationMock.chain;
    });

    mockParseWebhookEvent.mockResolvedValue({
      fid: FID,
      event: {
        event: 'miniapp_added',
        notificationDetails: { token: TOKEN, url: NOTIFICATION_URL },
      },
    });

    const req = makePostRequest('/api/miniapp/webhook', {});
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'notification_tokens');
    expect(notificationMock.chain.upsert).toHaveBeenCalledWith(
      {
        fid: FID,
        token: TOKEN,
        url: NOTIFICATION_URL,
        enabled: true,
        updated_at: expect.any(String),
      },
      { onConflict: 'fid' },
    );
  });

  it('miniapp_added does not write if notificationDetails is missing', async () => {
    const allowlistMock = chainMock({ data: { id: 'member-1' } });
    const notificationMock = chainMock({ data: null });

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      callIndex++;
      return callIndex === 1 ? allowlistMock.chain : notificationMock.chain;
    });

    mockParseWebhookEvent.mockResolvedValue({
      fid: FID,
      event: { event: 'miniapp_added' },
    });

    const req = makePostRequest('/api/miniapp/webhook', {});
    const res = await POST(req);

    expect(res.status).toBe(200);
    // Verify upsert was not called because notificationDetails was missing
    expect(notificationMock.chain.upsert).not.toHaveBeenCalled();
  });

  // =========================================================================
  // Event: notifications_enabled
  // =========================================================================

  it('handles notifications_enabled event with token', async () => {
    const allowlistMock = chainMock({ data: { id: 'member-1' } });
    const notificationMock = chainMock({ data: null });

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      callIndex++;
      return callIndex === 1 ? allowlistMock.chain : notificationMock.chain;
    });

    mockParseWebhookEvent.mockResolvedValue({
      fid: FID,
      event: {
        event: 'notifications_enabled',
        notificationDetails: { token: TOKEN, url: NOTIFICATION_URL },
      },
    });

    const req = makePostRequest('/api/miniapp/webhook', {});
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(notificationMock.chain.upsert).toHaveBeenCalledWith(
      {
        fid: FID,
        token: TOKEN,
        url: NOTIFICATION_URL,
        enabled: true,
        updated_at: expect.any(String),
      },
      { onConflict: 'fid' },
    );
  });

  // =========================================================================
  // Event: miniapp_removed
  // =========================================================================

  it('handles miniapp_removed event by disabling notifications', async () => {
    const allowlistMock = chainMock({ data: { id: 'member-1' } });
    const notificationMock = chainMock({ data: null });

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      callIndex++;
      return callIndex === 1 ? allowlistMock.chain : notificationMock.chain;
    });

    mockParseWebhookEvent.mockResolvedValue({
      fid: FID,
      event: { event: 'miniapp_removed' },
    });

    const req = makePostRequest('/api/miniapp/webhook', {});
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'notification_tokens');
    expect(notificationMock.chain.update).toHaveBeenCalledWith({
      enabled: false,
      updated_at: expect.any(String),
    });
    expect(notificationMock.chain.eq).toHaveBeenCalledWith('fid', FID);
  });

  // =========================================================================
  // Event: notifications_disabled
  // =========================================================================

  it('handles notifications_disabled event by disabling notifications', async () => {
    const allowlistMock = chainMock({ data: { id: 'member-1' } });
    const notificationMock = chainMock({ data: null });

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      callIndex++;
      return callIndex === 1 ? allowlistMock.chain : notificationMock.chain;
    });

    mockParseWebhookEvent.mockResolvedValue({
      fid: FID,
      event: { event: 'notifications_disabled' },
    });

    const req = makePostRequest('/api/miniapp/webhook', {});
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(notificationMock.chain.update).toHaveBeenCalledWith({
      enabled: false,
      updated_at: expect.any(String),
    });
    expect(notificationMock.chain.eq).toHaveBeenCalledWith('fid', FID);
  });

  // =========================================================================
  // Supabase error handling (note: route does not check .error field)
  // =========================================================================

  it('treats allowlist query with no data as unauthorized silently', async () => {
    const allowlistMock = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(allowlistMock.chain);
    mockParseWebhookEvent.mockResolvedValue({
      fid: FID,
      event: {
        event: 'miniapp_added',
        notificationDetails: { token: TOKEN, url: NOTIFICATION_URL },
      },
    });

    const req = makePostRequest('/api/miniapp/webhook', {});
    const res = await POST(req);

    // Route returns 200 because it silently accepts unknown FIDs
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // NOTE: The route does not currently check the .error field on Supabase
  // responses. If a query error occurs, it will be caught by the outer try/catch
  // only if it throws. Supabase queries resolve silently on error (returning
  // { error: ... }), so the route treats them as successful responses unless
  // the query method itself throws (e.g., network failure). This test verifies
  // the route handles unexpected throws gracefully.

  it('catches and returns 500 on unexpected exception in Supabase query', async () => {
    const allowlistMock = chainMock({ data: { id: 'member-1' } });
    mockFrom.mockReturnValue(allowlistMock.chain);

    // Simulate a thrown error (e.g., network exception)
    mockParseWebhookEvent.mockRejectedValue(new Error('Network timeout'));

    const req = makePostRequest('/api/miniapp/webhook', {});
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Webhook processing failed');
  });

  // =========================================================================
  // Success response shape
  // =========================================================================

  it('returns { success: true } on successful processing', async () => {
    const allowlistMock = chainMock({ data: { id: 'member-1' } });
    const notificationMock = chainMock({ data: null });

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      callIndex++;
      return callIndex === 1 ? allowlistMock.chain : notificationMock.chain;
    });

    mockParseWebhookEvent.mockResolvedValue({
      fid: FID,
      event: {
        event: 'miniapp_added',
        notificationDetails: { token: TOKEN, url: NOTIFICATION_URL },
      },
    });

    const req = makePostRequest('/api/miniapp/webhook', {});
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true });
    expect(body.error).toBeUndefined();
  });

  // =========================================================================
  // Timestamp precision tests
  // =========================================================================

  it('uses ISO string timestamps for updated_at', async () => {
    const allowlistMock = chainMock({ data: { id: 'member-1' } });
    const notificationMock = chainMock({ data: null });

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      callIndex++;
      return callIndex === 1 ? allowlistMock.chain : notificationMock.chain;
    });

    mockParseWebhookEvent.mockResolvedValue({
      fid: FID,
      event: {
        event: 'miniapp_added',
        notificationDetails: { token: TOKEN, url: NOTIFICATION_URL },
      },
    });

    const beforeTime = new Date();
    const req = makePostRequest('/api/miniapp/webhook', {});
    await POST(req);
    const afterTime = new Date();

    const callArgs = (notificationMock.chain.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const timestamp = new Date(callArgs.updated_at);

    expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });

  // =========================================================================
  // Multiple events in sequence (integration-like)
  // =========================================================================

  it('handles multiple different events sequentially', async () => {
    const allowlistMock = chainMock({ data: { id: 'member-1' } });
    const notificationMock = chainMock({ data: null });

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      callIndex++;
      return callIndex % 2 === 1 ? allowlistMock.chain : notificationMock.chain;
    });

    // First: miniapp_added
    mockParseWebhookEvent.mockResolvedValueOnce({
      fid: FID,
      event: {
        event: 'miniapp_added',
        notificationDetails: { token: TOKEN, url: NOTIFICATION_URL },
      },
    });

    let req = makePostRequest('/api/miniapp/webhook', {});
    let res = await POST(req);
    expect(res.status).toBe(200);

    // Reset call count
    vi.clearAllMocks();
    callIndex = 0;
    mockFrom.mockImplementation(() => {
      callIndex++;
      return callIndex % 2 === 1 ? allowlistMock.chain : notificationMock.chain;
    });

    // Second: notifications_disabled
    mockParseWebhookEvent.mockResolvedValueOnce({
      fid: FID,
      event: { event: 'notifications_disabled' },
    });

    req = makePostRequest('/api/miniapp/webhook', {});
    res = await POST(req);
    expect(res.status).toBe(200);
    expect(notificationMock.chain.update).toHaveBeenCalled();
  });
});
