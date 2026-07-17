// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

vi.mock('@/lib/publish/auto-cast', () => ({
  autoCastToZao: vi.fn().mockResolvedValue(undefined),
}));

const mockSingle = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() =>
  vi.fn().mockImplementation((table: string) => {
    if (table === 'fractal_sessions') {
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single: mockSingle }),
        }),
      };
    }
    if (table === 'fractal_scores' || table === 'respect_events') {
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    }
    if (table === 'respect_members') {
      // Supports both select/in (lookup) and insert (new member)
      const chain: Record<string, unknown> = {};
      const methods = ['select', 'in', 'eq', 'update'];
      for (const m of methods) chain[m] = vi.fn().mockReturnValue(chain);
      chain.insert = vi.fn().mockResolvedValue({ error: null });
      chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
      chain.then = vi.fn((resolve: (v: unknown) => void) => resolve({ data: [], error: null }));
      return chain;
    }
    return { insert: vi.fn().mockResolvedValue({ error: null }) };
  }),
);
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { POST } from '../route';

afterEach(() => vi.clearAllMocks());

const ADMIN_SESSION = { fid: 1, isAdmin: true };
const USER_SESSION = { fid: 2, isAdmin: false };

const VALID_BODY = {
  session_date: '2026-07-15',
  name: 'COC #7 Fractal',
  scores: [{ member_name: 'ZAO Member', rank: 1, score: 55 }],
};

describe('POST /api/respect/fractal', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await POST(makePostRequest('/api/respect/fractal', VALID_BODY));
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    mockGetSessionData.mockResolvedValue(USER_SESSION);
    const res = await POST(makePostRequest('/api/respect/fractal', VALID_BODY));
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid body (missing session_date)', async () => {
    mockGetSessionData.mockResolvedValue(ADMIN_SESSION);
    const res = await POST(makePostRequest('/api/respect/fractal', { name: 'Test', scores: [] }));
    expect(res.status).toBe(400);
  });

  it('returns 500 when fractal_sessions insert fails', async () => {
    mockGetSessionData.mockResolvedValue(ADMIN_SESSION);
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB fail' } });
    const res = await POST(makePostRequest('/api/respect/fractal', VALID_BODY));
    expect(res.status).toBe(500);
  });

  it('returns success:true with session_id on valid submission', async () => {
    mockGetSessionData.mockResolvedValue(ADMIN_SESSION);
    mockSingle.mockResolvedValue({ data: { id: 'session-uuid-1' }, error: null });
    const res = await POST(makePostRequest('/api/respect/fractal', VALID_BODY));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.session_id).toBe('session-uuid-1');
    expect(body.scores_recorded).toBe(1);
  });
});
