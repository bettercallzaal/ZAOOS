import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockClearSession = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({
  clearSession: () => mockClearSession(),
}));

import { POST } from '@/app/api/auth/logout/route';

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success when session cleared', async () => {
    mockClearSession.mockResolvedValue(undefined);
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 500 when clearSession throws', async () => {
    mockClearSession.mockRejectedValue(new Error('session error'));
    const res = await POST();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to logout');
  });
});
