import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  chainMock,
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

function makePostRequest(body: unknown) {
  return new Request('http://localhost/api/users/xmtp-address', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/users/xmtp-address', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const { POST } = await import('../route');
    const res = await POST(makePostRequest({ xmtpAddress: '0x1234567890abcdef1234567890abcdef12345678' }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 when body is invalid JSON', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/users/xmtp-address', {
      method: 'POST',
      body: 'not json',
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid address');
  });

  it('returns 400 when address format is invalid', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const { POST } = await import('../route');
    const res = await POST(makePostRequest({ xmtpAddress: 'not-an-address' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid address');
  });

  it('saves lowercase address and returns ok', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 42 }));
    const mock = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(mock.chain);

    const { POST } = await import('../route');
    const res = await POST(
      makePostRequest({ xmtpAddress: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12' }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(mock.chain.update).toHaveBeenCalledWith({
      xmtp_address: '0xabcdef1234567890abcdef1234567890abcdef12',
    });
    expect(mock.chain.eq).toHaveBeenCalledWith('fid', 42);
  });

  it('returns 500 when supabase returns an error', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    const mock = chainMock({ data: null, error: { message: 'db error' } });
    mockFrom.mockReturnValue(mock.chain);

    const { POST } = await import('../route');
    const res = await POST(
      makePostRequest({ xmtpAddress: '0x1234567890abcdef1234567890abcdef12345678' }),
    );
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to save');
  });
});
