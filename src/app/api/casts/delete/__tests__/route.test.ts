import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockDeleteCast } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockDeleteCast: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: mockGetSessionData,
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  deleteCast: mockDeleteCast,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

describe('POST /api/casts/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is null', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const req = makePostRequest('/api/casts/delete', {
      castHash: '0x1234567890abcdef',
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe('Signer required');
    expect(mockDeleteCast).not.toHaveBeenCalled();
  });

  it('returns 401 when session signerUuid is null', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: null }));

    const req = makePostRequest('/api/casts/delete', {
      castHash: '0x1234567890abcdef',
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe('Signer required');
    expect(mockDeleteCast).not.toHaveBeenCalled();
  });

  it('returns 401 when session signerUuid is undefined', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const req = makePostRequest('/api/casts/delete', {
      castHash: '0x1234567890abcdef',
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe('Signer required');
  });

  it('returns 400 when castHash is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const req = makePostRequest('/api/casts/delete', {});

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
    expect(Array.isArray(body.details)).toBe(true);
  });

  it('returns 400 when castHash does not start with 0x', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const req = makePostRequest('/api/casts/delete', {
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
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const req = makePostRequest('/api/casts/delete', {
      castHash: '',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('accepts castHash of just 0x (edge case but valid per Zod startsWith)', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    mockDeleteCast.mockResolvedValue({ success: true });

    const req = makePostRequest('/api/casts/delete', {
      castHash: '0x',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockDeleteCast).toHaveBeenCalledWith('test-uuid', '0x');
  });

  it('returns 200 with success on successful delete', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    mockDeleteCast.mockResolvedValue({ hash: '0x1234567890abcdef' });

    const req = makePostRequest('/api/casts/delete', {
      castHash: '0x1234567890abcdef',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockDeleteCast).toHaveBeenCalledWith('test-uuid', '0x1234567890abcdef');
  });

  it('calls deleteCast with signerUuid and castHash', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'abc-123' }));

    mockDeleteCast.mockResolvedValue({});

    const castHash = '0xdeadbeefcafebabe';
    const req = makePostRequest('/api/casts/delete', { castHash });

    await POST(req);

    expect(mockDeleteCast).toHaveBeenCalledWith('abc-123', castHash);
  });

  it('returns 500 when deleteCast throws', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));
    mockDeleteCast.mockRejectedValue(new Error('Neynar API error'));

    const req = makePostRequest('/api/casts/delete', {
      castHash: '0x1234567890abcdef',
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe('Failed to delete cast');
  });

  it('logs error when deleteCast throws', async () => {
    const loggerMock = vi.mocked(await import('@/lib/logger')).logger;
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const testError = new Error('Neynar timeout');
    mockDeleteCast.mockRejectedValue(testError);

    const req = makePostRequest('/api/casts/delete', {
      castHash: '0x1234567890abcdef',
    });

    await POST(req);

    expect(loggerMock.error).toHaveBeenCalledWith('Delete cast error:', testError);
  });

  it('accepts castHash with long hex value', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    mockDeleteCast.mockResolvedValue({});

    const castHash = '0xdeadbeefcafebabecafebabecafebabecafebabecafebabecafebabecafebabe';
    const req = makePostRequest('/api/casts/delete', { castHash });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockDeleteCast).toHaveBeenCalledWith('test-uuid', castHash);
  });

  it('rejects castHash with leading whitespace', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const req = makePostRequest('/api/casts/delete', {
      castHash: ' 0x1234567890abcdef',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(mockDeleteCast).not.toHaveBeenCalled();
  });

  it('rejects castHash that is not a string', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    const req = makePostRequest('/api/casts/delete', {
      castHash: 12345,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('ignores extra properties in request body', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    mockDeleteCast.mockResolvedValue({});

    const req = makePostRequest('/api/casts/delete', {
      castHash: '0x1234567890abcdef',
      extraField: 'should be ignored',
      anotherField: 123,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockDeleteCast).toHaveBeenCalledWith('test-uuid', '0x1234567890abcdef');
  });

  it('authenticates with a valid signerUuid in session', async () => {
    const session = mockAuthenticatedSession({ signerUuid: 'valid-signer-uuid' });
    mockGetSessionData.mockResolvedValue(session);

    mockDeleteCast.mockResolvedValue({});

    const req = makePostRequest('/api/casts/delete', {
      castHash: '0x1234567890abcdef',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockDeleteCast).toHaveBeenCalledWith('valid-signer-uuid', '0x1234567890abcdef');
  });

  it('returns NextResponse.json for all response types', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'test-uuid' }));

    mockDeleteCast.mockResolvedValue({});

    const req = makePostRequest('/api/casts/delete', {
      castHash: '0x1234567890abcdef',
    });

    const res = await POST(req);

    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('passes correct parameters to deleteCast in exact order', async () => {
    const signerUuid = 'uuid-12345';
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid }));

    mockDeleteCast.mockResolvedValue({});

    const castHash = '0xabcdef';
    const req = makePostRequest('/api/casts/delete', { castHash });

    await POST(req);

    const calls = mockDeleteCast.mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0]).toEqual([signerUuid, castHash]);
  });
});
