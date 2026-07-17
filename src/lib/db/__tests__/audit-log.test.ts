// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockInsert = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: {
    from: mockFrom,
  },
}));

import { getClientIp, logAuditEvent } from '../audit-log';

// ---------------------------------------------------------------------------
// getClientIp — proxy-aware IP extraction
// ---------------------------------------------------------------------------

function makeRequest(headers: Record<string, string>): Request {
  return new Request('https://example.com', { headers });
}

describe('getClientIp', () => {
  it('returns the first IP from x-forwarded-for when present', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.1, 10.0.0.1, 10.0.0.2' });
    expect(getClientIp(req)).toBe('203.0.113.1');
  });

  it('trims whitespace from x-forwarded-for values', () => {
    const req = makeRequest({ 'x-forwarded-for': '  203.0.113.42 , 10.0.0.1' });
    expect(getClientIp(req)).toBe('203.0.113.42');
  });

  it('returns the x-real-ip when x-forwarded-for is absent', () => {
    const req = makeRequest({ 'x-real-ip': '198.51.100.7' });
    expect(getClientIp(req)).toBe('198.51.100.7');
  });

  it('prefers x-forwarded-for over x-real-ip when both are present', () => {
    const req = makeRequest({
      'x-forwarded-for': '203.0.113.1',
      'x-real-ip': '198.51.100.7',
    });
    expect(getClientIp(req)).toBe('203.0.113.1');
  });

  it('returns undefined when neither header is present', () => {
    const req = makeRequest({});
    expect(getClientIp(req)).toBeUndefined();
  });

  it('handles a single IP in x-forwarded-for (no comma)', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.99' });
    expect(getClientIp(req)).toBe('203.0.113.99');
  });
});

// ---------------------------------------------------------------------------
// logAuditEvent — fire-and-forget Supabase insert
// ---------------------------------------------------------------------------

describe('logAuditEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockResolvedValue({ error: null });
  });

  it('inserts with snake_case column names from the entry', async () => {
    await logAuditEvent({
      actorFid: 12345,
      action: 'delete_proposal',
      targetType: 'proposal',
      targetId: 'prop-123',
      details: { reason: 'spam' },
      ipAddress: '203.0.113.1',
    });
    expect(mockFrom).toHaveBeenCalledWith('security_audit_log');
    expect(mockInsert).toHaveBeenCalledWith({
      actor_fid: 12345,
      action: 'delete_proposal',
      target_type: 'proposal',
      target_id: 'prop-123',
      details: { reason: 'spam' },
      ip_address: '203.0.113.1',
    });
  });

  it('defaults target_id and ip_address to null when not provided', async () => {
    await logAuditEvent({ actorFid: 1, action: 'view', targetType: 'page' });
    const call = mockInsert.mock.calls[0][0];
    expect(call.target_id).toBeNull();
    expect(call.ip_address).toBeNull();
  });

  it('defaults details to {} when not provided', async () => {
    await logAuditEvent({ actorFid: 1, action: 'view', targetType: 'page' });
    const call = mockInsert.mock.calls[0][0];
    expect(call.details).toEqual({});
  });

  it('does not throw when Supabase insert rejects (fire-and-forget)', async () => {
    mockInsert.mockRejectedValue(new Error('DB connection lost'));
    await expect(
      logAuditEvent({ actorFid: 1, action: 'test', targetType: 'test' }),
    ).resolves.toBeUndefined();
  });
});
