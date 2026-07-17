// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockGetSessionData = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

// Supabase admin — mock the Proxy so the route can call .from().select()...maybeSingle()
const mockMaybeSingle = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: mockMaybeSingle,
    }),
  },
}));

import { GET } from '../route';

afterEach(() => vi.clearAllMocks());

describe('GET /api/notifications/status', () => {
  it('returns enabled:false when there is no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.enabled).toBe(false);
  });

  it('returns enabled:false when the user has no token record', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const res = await GET();
    const body = await res.json();
    expect(body.enabled).toBe(false);
  });

  it('returns enabled:true when the token is enabled', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });
    mockMaybeSingle.mockResolvedValue({ data: { enabled: true }, error: null });
    const res = await GET();
    const body = await res.json();
    expect(body.enabled).toBe(true);
  });

  it('returns enabled:false when the token is disabled', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });
    mockMaybeSingle.mockResolvedValue({ data: { enabled: false }, error: null });
    const res = await GET();
    const body = await res.json();
    expect(body.enabled).toBe(false);
  });
});
