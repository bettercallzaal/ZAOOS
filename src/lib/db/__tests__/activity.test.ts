// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockFrom = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

import { touchActivity } from '../activity';

afterEach(() => vi.clearAllMocks());

function makeChain() {
  const thenFn = vi.fn().mockReturnValue(undefined);
  const eqFn = vi.fn().mockReturnValue({ then: thenFn });
  const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
  mockFrom.mockReturnValue({ update: updateFn });
  return { updateFn, eqFn, thenFn };
}

describe('touchActivity', () => {
  it('queries the users table', () => {
    const { updateFn } = makeChain();
    touchActivity(42);
    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({ last_active_at: expect.any(String) }),
    );
  });

  it('filters by the provided fid', () => {
    const { eqFn } = makeChain();
    touchActivity(9999);
    expect(eqFn).toHaveBeenCalledWith('fid', 9999);
  });

  it('never throws even when the DB rejects', () => {
    const eqFn = vi.fn().mockReturnValue({
      then: vi.fn().mockImplementation((_ok, onErr) => onErr(new Error('DB down'))),
    });
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockFrom.mockReturnValue({ update: updateFn });

    expect(() => touchActivity(1)).not.toThrow();
  });

  it('writes an ISO-8601 timestamp', () => {
    const { updateFn } = makeChain();
    touchActivity(1);
    const [payload] = updateFn.mock.calls[0];
    expect(() => new Date(payload.last_active_at).toISOString()).not.toThrow();
  });
});
