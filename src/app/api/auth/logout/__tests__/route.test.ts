// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockClearSession = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({
  clearSession: mockClearSession,
}));

import { POST } from '../route';

afterEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/logout', () => {
  it('returns success:true when clearSession resolves', async () => {
    mockClearSession.mockResolvedValue(undefined);

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 500 when clearSession throws', async () => {
    mockClearSession.mockRejectedValue(new Error('Session store error'));

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBeDefined();
  });
});
