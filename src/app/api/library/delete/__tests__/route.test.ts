import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_UUID,
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

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { DELETE } from '../route';

/** A delete chain: .delete().eq() is awaited and resolves to `result`. */
function deleteChain(result: { error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.delete = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

function deleteReq(body: unknown) {
  return makeRequest('/api/library/delete', { method: 'DELETE', body: JSON.stringify(body) });
}

describe('DELETE /api/library/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockFrom.mockReturnValue(deleteChain({ error: null }));
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await DELETE(deleteReq({ entry_id: VALID_UUID }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 403 for a non-admin session', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const res = await DELETE(deleteReq({ entry_id: VALID_UUID }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Admin access required');
  });

  it('returns 400 when entry_id is missing', async () => {
    const res = await DELETE(deleteReq({}));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid input');
  });

  it('returns 400 when entry_id is not a UUID', async () => {
    const res = await DELETE(deleteReq({ entry_id: 'not-a-uuid' }));
    expect(res.status).toBe(400);
  });

  it('deletes the entry for an admin and returns success', async () => {
    const chain = deleteChain({ error: null });
    mockFrom.mockReturnValue(chain);
    const res = await DELETE(deleteReq({ entry_id: VALID_UUID }));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('research_entries');
    expect(chain.eq).toHaveBeenCalledWith('id', VALID_UUID);
  });

  it('returns 500 when the delete errors', async () => {
    mockFrom.mockReturnValue(deleteChain({ error: new Error('db down') }));
    const res = await DELETE(deleteReq({ entry_id: VALID_UUID }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to delete entry');
  });
});
