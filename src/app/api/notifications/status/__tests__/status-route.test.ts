import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  chainMock,
  mockAuthenticatedSession,
} from '@/test-utils/api-helpers';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({
  getSessionData: mockGetSessionData,
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

// ---------------------------------------------------------------------------
// Import route under test (after mocks are wired)
// ---------------------------------------------------------------------------

import { GET } from '../route';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/notifications/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { enabled: false } when there is no session', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(body).toEqual({ enabled: false });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns { enabled: true } when user has an enabled token', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const { chain } = chainMock({ data: { enabled: true } });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    const body = await res.json();

    expect(body).toEqual({ enabled: true });
    expect(mockFrom).toHaveBeenCalledWith('notification_tokens');
    expect(chain.select).toHaveBeenCalledWith('enabled');
    expect(chain.eq).toHaveBeenCalledWith('fid', 123);
    expect(chain.maybeSingle).toHaveBeenCalled();
  });

  it('returns { enabled: false } when no token row exists', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const { chain } = chainMock({ data: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    const body = await res.json();

    expect(body).toEqual({ enabled: false });
  });

  it('returns { enabled: false } when an error is thrown', async () => {
    mockGetSessionData.mockRejectedValue(new Error('session exploded'));

    const res = await GET();
    const body = await res.json();

    expect(body).toEqual({ enabled: false });
  });
});
