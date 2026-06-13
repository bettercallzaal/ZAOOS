import { describe, it, expect, beforeEach, vi } from 'vitest';
import { makeRequest, chainMock } from '@/test-utils/api-helpers';

// Admin contacts write-path validation (doc 841 security-authz HIGH:
// "Missing Input Validation (Zod) in Admin Contacts POST/PATCH").

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
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { POST, PATCH } from '../route';

function adminReq(method: 'POST' | 'PATCH', body: unknown) {
  return makeRequest('/api/admin/contacts', {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSessionData.mockResolvedValue({ fid: 1, isAdmin: true });
});

describe('POST /api/admin/contacts — auth', () => {
  it('rejects unauthenticated with 401', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await POST(adminReq('POST', { name: 'X' }));
    expect(res.status).toBe(401);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('rejects non-admin with 403', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 2, isAdmin: false });
    const res = await POST(adminReq('POST', { name: 'X' }));
    expect(res.status).toBe(403);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('POST /api/admin/contacts — validation', () => {
  it('rejects missing name with 400 and never touches the DB', async () => {
    const res = await POST(adminReq('POST', { handle: 'nobody' }));
    expect(res.status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('rejects an unknown/unexpected field with 400 (strict schema)', async () => {
    const res = await POST(adminReq('POST', { name: 'Zaal', is_admin: true, role: 'superuser' }));
    expect(res.status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('rejects a wrong-typed field (score as string) with 400', async () => {
    const res = await POST(adminReq('POST', { name: 'Zaal', score: 'lots' }));
    expect(res.status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('inserts a valid contact and returns it', async () => {
    const insertChain = chainMock({ data: { id: 'c1', name: 'Zaal' }, error: null });
    mockFrom.mockReturnValueOnce(insertChain.chain);

    const res = await POST(adminReq('POST', { name: '  Zaal  ', category: 'partner', score: 42 }));
    expect(res.status).toBe(200);
    const insertArg = insertChain.chain.insert.mock.calls[0][0] as Record<string, unknown>;
    expect(insertArg.name).toBe('Zaal'); // trimmed
    expect(insertArg.score).toBe(42);
    expect('is_admin' in insertArg).toBe(false);
  });
});

describe('PATCH /api/admin/contacts — validation', () => {
  it('rejects missing id with 400', async () => {
    const res = await PATCH(adminReq('PATCH', { name: 'New' }));
    expect(res.status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('rejects an unknown field with 400 (strict schema)', async () => {
    const res = await PATCH(adminReq('PATCH', { id: 'c1', is_admin: true }));
    expect(res.status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('rejects an id-only patch (no fields to update) with 400', async () => {
    const res = await PATCH(adminReq('PATCH', { id: 'c1' }));
    expect(res.status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('updates with a valid field set', async () => {
    const updateChain = chainMock({ data: { id: 'c1', notes: 'hi' }, error: null });
    mockFrom.mockReturnValueOnce(updateChain.chain);

    const res = await PATCH(adminReq('PATCH', { id: 'c1', notes: 'hi' }));
    expect(res.status).toBe(200);
    const updateArg = updateChain.chain.update.mock.calls[0][0] as Record<string, unknown>;
    expect(updateArg.notes).toBe('hi');
    expect(updateArg.updated_at).toBeDefined();
  });
});
