// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockGetSupabaseAdmin = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({ getSupabaseAdmin: mockGetSupabaseAdmin }));

import { getEventBySlug, listPublishedEvents } from '../events';

afterEach(() => vi.clearAllMocks());

const MOCK_EVENT = {
  id: 'evt-1',
  slug: 'zao-open-2026',
  title: 'ZAO Open 2026',
  description: 'Annual ZAO event',
  lock_address: '0xdeadbeef',
  unlock_event_url: 'https://app.unlock-protocol.com/event/123',
  chain_id: 10,
  starts_at: '2026-08-01T18:00:00Z',
  ends_at: '2026-08-01T22:00:00Z',
  location: 'Base Layer',
  is_published: true,
};

// ── getEventBySlug ──────────────────────────────────────────────────────────

describe('getEventBySlug', () => {
  it('returns the event when found', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: MOCK_EVENT });
    const eqFn = vi.fn().mockReturnValue({ maybeSingle });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    const fromFn = vi.fn().mockReturnValue({ select: selectFn });
    mockGetSupabaseAdmin.mockReturnValue({ from: fromFn });

    const result = await getEventBySlug('zao-open-2026');
    expect(result).toEqual(MOCK_EVENT);
    expect(eqFn).toHaveBeenCalledWith('slug', 'zao-open-2026');
  });

  it('returns null when no matching event', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null });
    mockGetSupabaseAdmin.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
      }),
    });

    const result = await getEventBySlug('nonexistent');
    expect(result).toBeNull();
  });
});

// ── listPublishedEvents ─────────────────────────────────────────────────────

describe('listPublishedEvents', () => {
  it('returns the array of published events', async () => {
    const orderFn = vi.fn().mockResolvedValue({ data: [MOCK_EVENT] });
    const eqFn = vi.fn().mockReturnValue({ order: orderFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    const fromFn = vi.fn().mockReturnValue({ select: selectFn });
    mockGetSupabaseAdmin.mockReturnValue({ from: fromFn });

    const result = await listPublishedEvents();
    expect(result).toEqual([MOCK_EVENT]);
    expect(eqFn).toHaveBeenCalledWith('is_published', true);
    expect(orderFn).toHaveBeenCalledWith('starts_at', expect.objectContaining({ ascending: true }));
  });

  it('returns [] when data is null', async () => {
    const orderFn = vi.fn().mockResolvedValue({ data: null });
    mockGetSupabaseAdmin.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ order: orderFn }),
        }),
      }),
    });

    const result = await listPublishedEvents();
    expect(result).toEqual([]);
  });

  it('returns [] when data is an empty array', async () => {
    const orderFn = vi.fn().mockResolvedValue({ data: [] });
    mockGetSupabaseAdmin.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ order: orderFn }),
        }),
      }),
    });

    const result = await listPublishedEvents();
    expect(result).toEqual([]);
  });
});
