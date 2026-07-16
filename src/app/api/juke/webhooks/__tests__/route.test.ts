import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRequest } from '@/test-utils/api-helpers';

const {
  mockVerifyJukeWebhook,
  mockParseWebhookEvent,
  mockRecordWebhookEvent,
  mockApplyWebhookEvent,
  mockMarkWebhookProcessed,
  mockEnv,
  mockLogger,
} = vi.hoisted(() => ({
  mockVerifyJukeWebhook: vi.fn(),
  mockParseWebhookEvent: vi.fn(),
  mockRecordWebhookEvent: vi.fn(),
  mockApplyWebhookEvent: vi.fn(),
  mockMarkWebhookProcessed: vi.fn(),
  mockEnv: { JUKE_WEBHOOK_SECRET: 'test-secret-key' },
  mockLogger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/spaces/jukeWebhookVerify', () => ({
  verifyJukeWebhook: mockVerifyJukeWebhook,
}));

vi.mock('@/lib/spaces/jukeWebhookHandlers', () => ({
  parseWebhookEvent: mockParseWebhookEvent,
  applyWebhookEvent: mockApplyWebhookEvent,
}));

vi.mock('@/lib/spaces/jukeSpacesDb', () => ({
  recordWebhookEvent: mockRecordWebhookEvent,
  markWebhookProcessed: mockMarkWebhookProcessed,
}));

vi.mock('@/lib/env', () => ({
  ENV: mockEnv,
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

import { GET, POST } from '../route';

describe('POST /api/juke/webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // Signature verification failure tests
  // =========================================================================

  it('returns 401 when JUKE_WEBHOOK_SECRET is unset', async () => {
    // Temporarily unset the secret
    const originalSecret = mockEnv.JUKE_WEBHOOK_SECRET;
    mockEnv.JUKE_WEBHOOK_SECRET = undefined;

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: '{}',
      headers: { 'x-juke-signature': 't=1234567890,v1=abc123' },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Webhook not configured');

    // Restore the original secret
    mockEnv.JUKE_WEBHOOK_SECRET = originalSecret;
  });

  it('returns 401 on invalid signature header', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: false,
      reason: 'Missing or malformed X-Juke-Signature header',
    });

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: '{}',
      headers: { 'x-juke-signature': 'invalid' },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Missing or malformed X-Juke-Signature header');
  });

  it('returns 401 on signature timestamp outside replay window', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: false,
      reason: 'Signature timestamp outside replay window',
    });

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: '{}',
      headers: { 'x-juke-signature': 't=1000000000,v1=abc123' },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Signature timestamp outside replay window');
  });

  it('returns 401 on signature mismatch', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: false,
      reason: 'Signature mismatch',
      debug: {
        secretLen: 32,
        secretFp: 'abc123def456',
        bodyLen: 10,
        headerRaw: 't=1234567890,v1=badhash',
        expectedRawPrefix: 'expectedh',
        receivedV1Prefix: 'badhashfr',
        variantsTried: ['raw:32b', 'no-whsec:26b'],
      },
    });

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: '{}',
      headers: { 'x-juke-signature': 't=1234567890,v1=badhash' },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Signature mismatch');
  });

  // =========================================================================
  // JSON parsing failure tests
  // =========================================================================

  it('returns 400 on invalid JSON body', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: true,
      ts: Math.floor(Date.now() / 1000),
      signatureHash: 'hash123abc',
    });

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: 'not valid json',
      headers: { 'x-juke-signature': 't=1234567890,v1=abc123' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Invalid JSON body');
  });

  // =========================================================================
  // recordWebhookEvent error handling
  // =========================================================================

  it('returns 500 when recordWebhookEvent throws', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: true,
      ts: Math.floor(Date.now() / 1000),
      signatureHash: 'hash123abc',
    });

    const payload = { event_type: 'room.started', space_id: 'space-123' };
    mockParseWebhookEvent.mockReturnValue({
      eventType: 'room.started',
      spaceId: 'space-123',
      eventId: 'event-456',
    });

    mockRecordWebhookEvent.mockRejectedValue(new Error('Database connection failed'));

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'x-juke-signature': 't=1234567890,v1=abc123' },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Could not record event');
  });

  // =========================================================================
  // Idempotency (duplicate/already-processed)
  // =========================================================================

  it('returns 200 with duplicate:true on replay (recordWebhookEvent returns false)', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: true,
      ts: Math.floor(Date.now() / 1000),
      signatureHash: 'hash123abc',
    });

    const payload = { event_type: 'room.started', space_id: 'space-123' };
    mockParseWebhookEvent.mockReturnValue({
      eventType: 'room.started',
      spaceId: 'space-123',
      eventId: 'event-456',
    });

    // Record returns false = already processed
    mockRecordWebhookEvent.mockResolvedValue(false);

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'x-juke-signature': 't=1234567890,v1=abc123' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.duplicate).toBe(true);

    // Verify we did NOT call applyWebhookEvent
    expect(mockApplyWebhookEvent).not.toHaveBeenCalled();
    expect(mockMarkWebhookProcessed).not.toHaveBeenCalled();
  });

  // =========================================================================
  // Successful happy path
  // =========================================================================

  it('successfully processes a valid webhook event', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: true,
      ts: Math.floor(Date.now() / 1000),
      signatureHash: 'hash123abc',
    });

    const payload = { event_type: 'room.started', space_id: 'space-123' };
    mockParseWebhookEvent.mockReturnValue({
      eventType: 'room.started',
      spaceId: 'space-123',
      eventId: 'event-456',
    });

    mockRecordWebhookEvent.mockResolvedValue(true);
    mockApplyWebhookEvent.mockResolvedValue(undefined);
    mockMarkWebhookProcessed.mockResolvedValue(undefined);

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'x-juke-signature': 't=1234567890,v1=abc123' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.duplicate).toBeUndefined();
    expect(body.handler_error).toBeUndefined();

    // Verify the full flow
    expect(mockParseWebhookEvent).toHaveBeenCalledWith(payload);
    expect(mockRecordWebhookEvent).toHaveBeenCalledWith({
      eventType: 'room.started',
      jukeEventId: 'event-456',
      signatureHash: 'hash123abc',
      spaceId: 'space-123',
      body: payload,
    });
    expect(mockApplyWebhookEvent).toHaveBeenCalledWith('room.started', 'space-123', payload);
    expect(mockMarkWebhookProcessed).toHaveBeenCalledWith('hash123abc');
  });

  // =========================================================================
  // applyWebhookEvent error handling
  // =========================================================================

  it('returns 200 with handler_error when applyWebhookEvent throws', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: true,
      ts: Math.floor(Date.now() / 1000),
      signatureHash: 'hash123abc',
    });

    const payload = {
      event_type: 'participant.joined',
      space_id: 'space-123',
    };
    mockParseWebhookEvent.mockReturnValue({
      eventType: 'participant.joined',
      spaceId: 'space-123',
      eventId: 'event-789',
    });

    mockRecordWebhookEvent.mockResolvedValue(true);
    mockApplyWebhookEvent.mockRejectedValue(new Error('Failed to add participant'));
    mockMarkWebhookProcessed.mockResolvedValue(undefined);

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'x-juke-signature': 't=1234567890,v1=abc123' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.handler_error).toBe('Failed to add participant');

    // Verify markWebhookProcessed was called with error message
    expect(mockMarkWebhookProcessed).toHaveBeenCalledWith(
      'hash123abc',
      'Failed to add participant',
    );
  });

  it('tolerates markWebhookProcessed.catch when applyWebhookEvent throws', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: true,
      ts: Math.floor(Date.now() / 1000),
      signatureHash: 'hash123abc',
    });

    const payload = { event_type: 'room.finished', space_id: 'space-123' };
    mockParseWebhookEvent.mockReturnValue({
      eventType: 'room.finished',
      spaceId: 'space-123',
      eventId: 'event-999',
    });

    mockRecordWebhookEvent.mockResolvedValue(true);
    mockApplyWebhookEvent.mockRejectedValue(new Error('Handler failed'));
    // markWebhookProcessed itself throws
    mockMarkWebhookProcessed.mockRejectedValue(new Error('Mark failed silently'));

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'x-juke-signature': 't=1234567890,v1=abc123' },
    });

    const res = await POST(req);
    // Route still returns 200 even if markWebhookProcessed fails (silently caught)
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.handler_error).toBe('Handler failed');
  });

  it('returns handler_error for non-Error throws from applyWebhookEvent', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: true,
      ts: Math.floor(Date.now() / 1000),
      signatureHash: 'hash123abc',
    });

    const payload = { event_type: 'recording.ready', space_id: 'space-123' };
    mockParseWebhookEvent.mockReturnValue({
      eventType: 'recording.ready',
      spaceId: 'space-123',
      eventId: null,
    });

    mockRecordWebhookEvent.mockResolvedValue(true);
    // Throw a non-Error value
    mockApplyWebhookEvent.mockRejectedValue('string error');
    mockMarkWebhookProcessed.mockResolvedValue(undefined);

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'x-juke-signature': 't=1234567890,v1=abc123' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.handler_error).toBe('handler failed');
  });

  // =========================================================================
  // Signature verification variants
  // =========================================================================

  it('logs when signature is verified via non-raw variant', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: true,
      ts: Math.floor(Date.now() / 1000),
      signatureHash: 'hash123abc',
      matchedVariant: 'no-whsec',
    });

    const payload = { event_type: 'room.started', space_id: 'space-123' };
    mockParseWebhookEvent.mockReturnValue({
      eventType: 'room.started',
      spaceId: 'space-123',
      eventId: 'event-456',
    });

    mockRecordWebhookEvent.mockResolvedValue(true);
    mockApplyWebhookEvent.mockResolvedValue(undefined);
    mockMarkWebhookProcessed.mockResolvedValue(undefined);

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'x-juke-signature': 't=1234567890,v1=abc123' },
    });

    await POST(req);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[juke/webhooks] signature verified via non-raw variant:',
      'no-whsec',
    );
  });

  // =========================================================================
  // recordWebhookEvent call validation
  // =========================================================================

  it('calls recordWebhookEvent with correct payload structure', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: true,
      ts: Math.floor(Date.now() / 1000),
      signatureHash: 'signature-hash-xyz',
    });

    const payload = {
      event_type: 'participant.left',
      space_id: 'space-abc',
      event_id: 'evt-789',
      data: { fid: 456 },
    };
    mockParseWebhookEvent.mockReturnValue({
      eventType: 'participant.left',
      spaceId: 'space-abc',
      eventId: 'evt-789',
    });

    mockRecordWebhookEvent.mockResolvedValue(true);
    mockApplyWebhookEvent.mockResolvedValue(undefined);
    mockMarkWebhookProcessed.mockResolvedValue(undefined);

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'x-juke-signature': 't=1234567890,v1=abc123' },
    });

    await POST(req);

    expect(mockRecordWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'participant.left',
        jukeEventId: 'evt-789',
        signatureHash: 'signature-hash-xyz',
        spaceId: 'space-abc',
        body: payload,
      }),
    );
  });

  // =========================================================================
  // Event types coverage
  // =========================================================================

  it('handles room.started event', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: true,
      ts: Math.floor(Date.now() / 1000),
      signatureHash: 'hash1',
    });
    mockParseWebhookEvent.mockReturnValue({
      eventType: 'room.started',
      spaceId: 'space-1',
      eventId: 'evt-1',
    });
    mockRecordWebhookEvent.mockResolvedValue(true);
    mockApplyWebhookEvent.mockResolvedValue(undefined);
    mockMarkWebhookProcessed.mockResolvedValue(undefined);

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: JSON.stringify({ event_type: 'room.started' }),
      headers: { 'x-juke-signature': 't=1234567890,v1=abc123' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockApplyWebhookEvent).toHaveBeenCalledWith(
      'room.started',
      'space-1',
      expect.any(Object),
    );
  });

  it('handles room.finished event', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: true,
      ts: Math.floor(Date.now() / 1000),
      signatureHash: 'hash2',
    });
    mockParseWebhookEvent.mockReturnValue({
      eventType: 'room.finished',
      spaceId: 'space-2',
      eventId: 'evt-2',
    });
    mockRecordWebhookEvent.mockResolvedValue(true);
    mockApplyWebhookEvent.mockResolvedValue(undefined);
    mockMarkWebhookProcessed.mockResolvedValue(undefined);

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: JSON.stringify({ event_type: 'room.finished' }),
      headers: { 'x-juke-signature': 't=1234567890,v1=abc123' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockApplyWebhookEvent).toHaveBeenCalledWith(
      'room.finished',
      'space-2',
      expect.any(Object),
    );
  });

  it('handles participant.joined event', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: true,
      ts: Math.floor(Date.now() / 1000),
      signatureHash: 'hash3',
    });
    mockParseWebhookEvent.mockReturnValue({
      eventType: 'participant.joined',
      spaceId: 'space-3',
      eventId: 'evt-3',
    });
    mockRecordWebhookEvent.mockResolvedValue(true);
    mockApplyWebhookEvent.mockResolvedValue(undefined);
    mockMarkWebhookProcessed.mockResolvedValue(undefined);

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: JSON.stringify({ event_type: 'participant.joined' }),
      headers: { 'x-juke-signature': 't=1234567890,v1=abc123' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockApplyWebhookEvent).toHaveBeenCalledWith(
      'participant.joined',
      'space-3',
      expect.any(Object),
    );
  });

  it('handles participant.left event', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: true,
      ts: Math.floor(Date.now() / 1000),
      signatureHash: 'hash4',
    });
    mockParseWebhookEvent.mockReturnValue({
      eventType: 'participant.left',
      spaceId: 'space-4',
      eventId: 'evt-4',
    });
    mockRecordWebhookEvent.mockResolvedValue(true);
    mockApplyWebhookEvent.mockResolvedValue(undefined);
    mockMarkWebhookProcessed.mockResolvedValue(undefined);

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: JSON.stringify({ event_type: 'participant.left' }),
      headers: { 'x-juke-signature': 't=1234567890,v1=abc123' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockApplyWebhookEvent).toHaveBeenCalledWith(
      'participant.left',
      'space-4',
      expect.any(Object),
    );
  });

  it('handles recording.ready event', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: true,
      ts: Math.floor(Date.now() / 1000),
      signatureHash: 'hash5',
    });
    mockParseWebhookEvent.mockReturnValue({
      eventType: 'recording.ready',
      spaceId: 'space-5',
      eventId: 'evt-5',
    });
    mockRecordWebhookEvent.mockResolvedValue(true);
    mockApplyWebhookEvent.mockResolvedValue(undefined);
    mockMarkWebhookProcessed.mockResolvedValue(undefined);

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: JSON.stringify({ event_type: 'recording.ready' }),
      headers: { 'x-juke-signature': 't=1234567890,v1=abc123' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockApplyWebhookEvent).toHaveBeenCalledWith(
      'recording.ready',
      'space-5',
      expect.any(Object),
    );
  });

  // =========================================================================
  // Response shape validation
  // =========================================================================

  it('returns response with ok:true and no extra fields on success', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: true,
      ts: Math.floor(Date.now() / 1000),
      signatureHash: 'hash123abc',
    });

    const payload = { event_type: 'room.started', space_id: 'space-123' };
    mockParseWebhookEvent.mockReturnValue({
      eventType: 'room.started',
      spaceId: 'space-123',
      eventId: 'event-456',
    });

    mockRecordWebhookEvent.mockResolvedValue(true);
    mockApplyWebhookEvent.mockResolvedValue(undefined);
    mockMarkWebhookProcessed.mockResolvedValue(undefined);

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'x-juke-signature': 't=1234567890,v1=abc123' },
    });

    const res = await POST(req);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it('returns error response with ok:false and reason', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: false,
      reason: 'Test error reason',
    });

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: '{}',
      headers: { 'x-juke-signature': 't=1234567890,v1=bad' },
    });

    const res = await POST(req);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Test error reason');
  });

  // =========================================================================
  // GET method (should reject)
  // =========================================================================

  it('GET returns 405 Method Not Allowed', async () => {
    const _req = makeRequest('/api/juke/webhooks', { method: 'GET' });
    const res = GET();
    expect(res.status).toBe(405);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('POST only');
  });

  // =========================================================================
  // Edge cases
  // =========================================================================

  it('handles null spaceId from parseWebhookEvent gracefully', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: true,
      ts: Math.floor(Date.now() / 1000),
      signatureHash: 'hash123abc',
    });

    const payload = { event_type: 'unknown.event' };
    mockParseWebhookEvent.mockReturnValue({
      eventType: 'unknown.event',
      spaceId: null,
      eventId: null,
    });

    mockRecordWebhookEvent.mockResolvedValue(true);
    mockApplyWebhookEvent.mockResolvedValue(undefined);
    mockMarkWebhookProcessed.mockResolvedValue(undefined);

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'x-juke-signature': 't=1234567890,v1=abc123' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    // Verify recordWebhookEvent was called with spaceId: null
    expect(mockRecordWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        spaceId: null,
      }),
    );
  });

  it('preserves raw body JSON when calling recordWebhookEvent', async () => {
    mockVerifyJukeWebhook.mockReturnValue({
      ok: true,
      ts: Math.floor(Date.now() / 1000),
      signatureHash: 'hash123abc',
    });

    const payload = {
      event_type: 'room.started',
      space_id: 'space-123',
      extra_field: 'some data',
      nested: { foo: 'bar' },
    };
    mockParseWebhookEvent.mockReturnValue({
      eventType: 'room.started',
      spaceId: 'space-123',
      eventId: 'event-456',
    });

    mockRecordWebhookEvent.mockResolvedValue(true);
    mockApplyWebhookEvent.mockResolvedValue(undefined);
    mockMarkWebhookProcessed.mockResolvedValue(undefined);

    const req = makeRequest('/api/juke/webhooks', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'x-juke-signature': 't=1234567890,v1=abc123' },
    });

    await POST(req);

    // Verify the entire payload is stored in body
    expect(mockRecordWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        body: payload,
      }),
    );
  });
});
