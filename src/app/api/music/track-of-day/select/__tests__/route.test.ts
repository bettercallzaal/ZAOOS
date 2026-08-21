// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

vi.mock('@/lib/publish/auto-cast', () => ({ autoCastToZao: vi.fn().mockResolvedValue(undefined) }));

const mockHasPermission = vi.hoisted(() => vi.fn().mockResolvedValue(false));
vi.mock('@/lib/hats/gating', () => ({ hasPermission: mockHasPermission }));

const mockMaybySingle = vi.hoisted(() => vi.fn());
const mockMaybyTopNomination = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());

// Chain tracker — 'check' for first call (already-selected), 'top' for second, 'upd' for update
let callCount = 0;
const mockFrom = vi.hoisted(() =>
  vi.fn().mockImplementation(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(function (this: unknown) {
      callCount += 1;
      if (callCount === 1) return mockMaybySingle();
      return mockMaybyTopNomination();
    }),
    update: mockUpdate,
  })),
);

vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { POST } from '../route';

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
  callCount = 0;
});

const ADMIN_SESSION = { fid: 1, isAdmin: true };
const WALLET = '0x1234567890123456789012345678901234567890';
const HAT_WEARER_SESSION = { fid: 2, isAdmin: false, walletAddress: WALLET };
const PLAIN_SESSION = { fid: 3, isAdmin: false, walletAddress: WALLET };
const BEFORE_CUTOFF = new Date('2026-07-17T10:00:00.000Z'); // 6pm EST cutoff is 23:00 UTC

describe('POST /api/music/track-of-day/select', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it('returns 409 when a track is already selected today', async () => {
    mockGetSessionData.mockResolvedValue(ADMIN_SESSION);
    mockMaybySingle.mockResolvedValue({ data: { id: 'existing' }, error: null });
    const res = await POST();
    expect(res.status).toBe(409);
  });

  it('returns 404 when no nominations exist today', async () => {
    mockGetSessionData.mockResolvedValue(ADMIN_SESSION);
    mockMaybySingle.mockResolvedValue({ data: null, error: null });
    mockMaybyTopNomination.mockResolvedValue({ data: null, error: null });
    const res = await POST();
    expect(res.status).toBe(404);
  });

  it('returns success with selected track data', async () => {
    mockGetSessionData.mockResolvedValue(ADMIN_SESSION);
    mockMaybySingle.mockResolvedValue({ data: null, error: null });
    const mockNomination = { id: 'nom-1', title: 'ZAO Anthem', artist: 'ZAO' };
    mockMaybyTopNomination.mockResolvedValue({ data: mockNomination, error: null });
    const mockSingle = vi.fn().mockResolvedValue({
      data: { ...mockNomination, selected_date: '2026-07-17' },
      error: null,
    });
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: mockSingle,
    });
    const res = await POST();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.selected.title).toBe('ZAO Anthem');
  });

  it('returns 403 before cutoff for a non-admin wallet with no feature_tracks hat', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(BEFORE_CUTOFF);
    mockGetSessionData.mockResolvedValue(PLAIN_SESSION);
    mockHasPermission.mockResolvedValue(false);
    mockMaybySingle.mockResolvedValue({ data: null, error: null });
    const res = await POST();
    expect(res.status).toBe(403);
    expect(mockHasPermission).toHaveBeenCalledWith(WALLET, 'feature_tracks');
  });

  it('allows a non-admin wallet wearing the feature_tracks hat to select before cutoff', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(BEFORE_CUTOFF);
    mockGetSessionData.mockResolvedValue(HAT_WEARER_SESSION);
    mockHasPermission.mockResolvedValue(true);
    mockMaybySingle.mockResolvedValue({ data: null, error: null });
    const mockNomination = { id: 'nom-2', title: 'Hat Pick', artist: 'ZAO' };
    mockMaybyTopNomination.mockResolvedValue({ data: mockNomination, error: null });
    const mockSingle = vi.fn().mockResolvedValue({
      data: { ...mockNomination, selected_date: '2026-07-17' },
      error: null,
    });
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: mockSingle,
    });
    const res = await POST();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.selected.title).toBe('Hat Pick');
  });
});
