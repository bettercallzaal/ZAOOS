import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

const { mockSanitizeSubname, mockIsValidSubname } = vi.hoisted(() => ({
  mockSanitizeSubname: vi.fn(),
  mockIsValidSubname: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/ens/subnames', () => ({
  sanitizeSubname: mockSanitizeSubname,
  isValidSubname: mockIsValidSubname,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { POST } from '../route';

describe('POST /api/ens/subname-request', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default behavior
    mockIsValidSubname.mockReturnValue(true);
    mockSanitizeSubname.mockImplementation((name: string) => name.toLowerCase());
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Authentication tests
  // ──────────────────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const req = makePostRequest('/api/ens/subname-request', {
      requestedName: 'alice',
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Input validation tests (Zod schema)
  // ──────────────────────────────────────────────────────────────────────────

  it('returns 400 when requestedName is empty string', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const req = makePostRequest('/api/ens/subname-request', {
      requestedName: '',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when requestedName exceeds 63 chars', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const longName = 'a'.repeat(64);
    const req = makePostRequest('/api/ens/subname-request', {
      requestedName: longName,
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when requestedName is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const req = makePostRequest('/api/ens/subname-request', {});
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('accepts requestedName at minimum length (1 char)', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockSanitizeSubname.mockReturnValue('a');
    mockIsValidSubname.mockReturnValue(true);

    // Mock supabase checks
    const existingCheckChain = chainMock({ data: null });
    const userLookupChain = chainMock({ data: { zao_subname: null } });
    const insertChain = chainMock({ data: null, error: null });

    mockFrom
      .mockReturnValueOnce(existingCheckChain.chain)
      .mockReturnValueOnce(userLookupChain.chain)
      .mockReturnValueOnce(insertChain.chain);

    const req = makePostRequest('/api/ens/subname-request', {
      requestedName: 'a',
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('accepts requestedName at maximum length (63 chars)', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    const maxName = 'a'.repeat(63);
    mockSanitizeSubname.mockReturnValue(maxName);
    mockIsValidSubname.mockReturnValue(true);

    // Mock supabase checks
    const existingCheckChain = chainMock({ data: null });
    const userLookupChain = chainMock({ data: { zao_subname: null } });
    const insertChain = chainMock({ data: null, error: null });

    mockFrom
      .mockReturnValueOnce(existingCheckChain.chain)
      .mockReturnValueOnce(userLookupChain.chain)
      .mockReturnValueOnce(insertChain.chain);

    const req = makePostRequest('/api/ens/subname-request', {
      requestedName: maxName,
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Subname validation tests
  // ──────────────────────────────────────────────────────────────────────────

  it('returns 400 when isValidSubname returns false', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockSanitizeSubname.mockReturnValue('invalid-name');
    mockIsValidSubname.mockReturnValue(false);

    const req = makePostRequest('/api/ens/subname-request', {
      requestedName: 'invalid---name',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid name');
    expect(body.error).toContain('lowercase letters, numbers, and hyphens');
  });

  it('calls sanitizeSubname before validation', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockSanitizeSubname.mockReturnValue('sanitized');
    mockIsValidSubname.mockReturnValue(true);

    // Mock supabase
    const existingCheckChain = chainMock({ data: null });
    const userLookupChain = chainMock({ data: { zao_subname: null } });
    const insertChain = chainMock({ data: null, error: null });

    mockFrom
      .mockReturnValueOnce(existingCheckChain.chain)
      .mockReturnValueOnce(userLookupChain.chain)
      .mockReturnValueOnce(insertChain.chain);

    const req = makePostRequest('/api/ens/subname-request', {
      requestedName: 'MixedCase123',
    });
    await POST(req);

    expect(mockSanitizeSubname).toHaveBeenCalledWith('MixedCase123');
    expect(mockIsValidSubname).toHaveBeenCalledWith('sanitized');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Duplicate request check
  // ──────────────────────────────────────────────────────────────────────────

  it('returns 409 when user has pending request', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockSanitizeSubname.mockReturnValue('newname');
    mockIsValidSubname.mockReturnValue(true);

    // Mock existing pending request
    const existingCheckChain = chainMock({
      data: { id: 'req-123' },
    });

    mockFrom.mockReturnValueOnce(existingCheckChain.chain);

    const req = makePostRequest('/api/ens/subname-request', {
      requestedName: 'newname',
    });
    const res = await POST(req);

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('You already have a pending name change request');
  });

  it('checks for pending request using correct filters', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    mockSanitizeSubname.mockReturnValue('alice');
    mockIsValidSubname.mockReturnValue(true);

    const existingCheckChain = chainMock({ data: null });
    mockFrom.mockReturnValueOnce(existingCheckChain.chain);

    const req = makePostRequest('/api/ens/subname-request', {
      requestedName: 'alice',
    });
    await POST(req);

    // Verify the query chain was built correctly
    expect(existingCheckChain.chain.select).toHaveBeenCalledWith('id');
    expect(existingCheckChain.chain.eq).toHaveBeenCalledWith('fid', 456);
    // The second eq call for status
    expect(existingCheckChain.chain.eq.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // User lookup and request creation
  // ──────────────────────────────────────────────────────────────────────────

  it('looks up current subname from users table', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockSanitizeSubname.mockReturnValue('alice');
    mockIsValidSubname.mockReturnValue(true);

    const existingCheckChain = chainMock({ data: null });
    const userLookupChain = chainMock({
      data: { zao_subname: 'oldname' },
    });
    const insertChain = chainMock({ data: null, error: null });

    mockFrom
      .mockReturnValueOnce(existingCheckChain.chain)
      .mockReturnValueOnce(userLookupChain.chain)
      .mockReturnValueOnce(insertChain.chain);

    const req = makePostRequest('/api/ens/subname-request', {
      requestedName: 'alice',
    });
    await POST(req);

    expect(userLookupChain.chain.select).toHaveBeenCalledWith('zao_subname');
  });

  it('handles when user has no current subname', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockSanitizeSubname.mockReturnValue('alice');
    mockIsValidSubname.mockReturnValue(true);

    const existingCheckChain = chainMock({ data: null });
    const userLookupChain = chainMock({ data: { zao_subname: null } });
    const insertChain = chainMock({ data: null, error: null });

    mockFrom
      .mockReturnValueOnce(existingCheckChain.chain)
      .mockReturnValueOnce(userLookupChain.chain)
      .mockReturnValueOnce(insertChain.chain);

    const req = makePostRequest('/api/ens/subname-request', {
      requestedName: 'alice',
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Successful request creation
  // ──────────────────────────────────────────────────────────────────────────

  it('creates pending request with correct fields', async () => {
    const session = mockAuthenticatedSession({ fid: 789 });
    mockGetSessionData.mockResolvedValue(session);
    mockSanitizeSubname.mockReturnValue('newname');
    mockIsValidSubname.mockReturnValue(true);

    const existingCheckChain = chainMock({ data: null });
    const userLookupChain = chainMock({
      data: { zao_subname: 'oldname' },
    });
    const insertChain = chainMock({ data: null, error: null });

    mockFrom
      .mockReturnValueOnce(existingCheckChain.chain)
      .mockReturnValueOnce(userLookupChain.chain)
      .mockReturnValueOnce(insertChain.chain);

    const req = makePostRequest('/api/ens/subname-request', {
      requestedName: 'newname',
    });
    await POST(req);

    expect(insertChain.chain.insert).toHaveBeenCalledWith({
      fid: 789,
      current_name: 'oldname',
      requested_name: 'newname',
      status: 'pending',
    });
  });

  it('returns success message with full domain name', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockSanitizeSubname.mockReturnValue('alice');
    mockIsValidSubname.mockReturnValue(true);

    const existingCheckChain = chainMock({ data: null });
    const userLookupChain = chainMock({ data: { zao_subname: null } });
    const insertChain = chainMock({ data: null, error: null });

    mockFrom
      .mockReturnValueOnce(existingCheckChain.chain)
      .mockReturnValueOnce(userLookupChain.chain)
      .mockReturnValueOnce(insertChain.chain);

    const req = makePostRequest('/api/ens/subname-request', {
      requestedName: 'alice',
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain('alice.thezao.eth');
    expect(body.message).toContain('admin will review');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Error handling
  // ──────────────────────────────────────────────────────────────────────────

  it('returns 500 when insert fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockSanitizeSubname.mockReturnValue('alice');
    mockIsValidSubname.mockReturnValue(true);

    const existingCheckChain = chainMock({ data: null });
    const userLookupChain = chainMock({ data: { zao_subname: null } });
    const insertChain = chainMock({
      data: null,
      error: { message: 'Database error' },
    });

    mockFrom
      .mockReturnValueOnce(existingCheckChain.chain)
      .mockReturnValueOnce(userLookupChain.chain)
      .mockReturnValueOnce(insertChain.chain);

    const req = makePostRequest('/api/ens/subname-request', {
      requestedName: 'alice',
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to submit request');
  });

  it('returns 500 when request body parse fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const req = new Request(new URL('/api/ens/subname-request', 'http://localhost:3000'), {
      method: 'POST',
      body: 'invalid json',
    });

    const res = await POST(req as unknown as never);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to submit request');
  });

  it('returns 500 on unexpected exception during request creation', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockSanitizeSubname.mockReturnValue('alice');
    mockIsValidSubname.mockReturnValue(true);

    const existingCheckChain = chainMock({ data: null });
    // User lookup throws
    mockFrom.mockReturnValueOnce(existingCheckChain.chain).mockImplementationOnce(() => {
      throw new Error('Network error');
    });

    const req = makePostRequest('/api/ens/subname-request', {
      requestedName: 'alice',
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to submit request');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Edge cases
  // ──────────────────────────────────────────────────────────────────────────

  it('uses sanitized name in isValidSubname check', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockSanitizeSubname.mockReturnValue('cleaned');
    mockIsValidSubname.mockReturnValue(false);

    const req = makePostRequest('/api/ens/subname-request', {
      requestedName: 'DirtY___NaMe!!!',
    });
    await POST(req);

    // Verify sanitization happened before validation
    expect(mockSanitizeSubname).toHaveBeenCalledWith('DirtY___NaMe!!!');
    expect(mockIsValidSubname).toHaveBeenCalledWith('cleaned');
  });

  it('includes original requested name in error message', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockSanitizeSubname.mockReturnValue('invalid');
    mockIsValidSubname.mockReturnValue(false);

    const req = makePostRequest('/api/ens/subname-request', {
      requestedName: 'BadName!!!',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('BadName!!!');
  });

  it('handles requests with extra fields (ignores them)', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockSanitizeSubname.mockReturnValue('alice');
    mockIsValidSubname.mockReturnValue(true);

    const existingCheckChain = chainMock({ data: null });
    const userLookupChain = chainMock({ data: { zao_subname: null } });
    const insertChain = chainMock({ data: null, error: null });

    mockFrom
      .mockReturnValueOnce(existingCheckChain.chain)
      .mockReturnValueOnce(userLookupChain.chain)
      .mockReturnValueOnce(insertChain.chain);

    const req = makePostRequest('/api/ens/subname-request', {
      requestedName: 'alice',
      extra: 'field',
      another: 123,
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
