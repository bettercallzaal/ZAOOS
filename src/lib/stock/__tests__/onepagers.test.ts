// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockGetSupabaseAdmin = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({ getSupabaseAdmin: mockGetSupabaseAdmin }));

import {
  createOnePager,
  getOnePager,
  listActivity,
  listOnePagers,
  slugify,
  updateOnePager,
} from '../onepagers';

afterEach(() => vi.clearAllMocks());

const BASE_ONEPAGER = {
  id: 'op-1',
  slug: 'zao-pitch',
  title: 'ZAO Pitch',
  audience: 'Investors',
  purpose: 'Raise funding',
  status: 'draft' as const,
  visibility: 'internal' as const,
  body: 'ZAO is the best DAO.',
  meeting_date: null,
  meeting_location: null,
  authors: null,
  reviewers: null,
  version: 1,
  last_edited_by: null,
  created_at: '2026-07-01T00:00:00Z',
  updated_at: '2026-07-01T00:00:00Z',
};

function makeFromForOnepagers(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue(result),
    }),
  };
}

function makeFromForOnePagerGet(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

// ---------------------------------------------------------------------------
// slugify (pure utility)
// ---------------------------------------------------------------------------
describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('strips special characters', () => {
    expect(slugify('ZAO: The DAO!')).toBe('zao-the-dao');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  -ZAO- ')).toBe('zao');
  });

  it('respects maxLen', () => {
    const result = slugify('a very long title that exceeds the limit', 10);
    expect(result.length).toBeLessThanOrEqual(10);
  });
});

// ---------------------------------------------------------------------------
// listOnePagers
// ---------------------------------------------------------------------------
describe('listOnePagers', () => {
  it('returns list of onepagers', async () => {
    mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(makeFromForOnepagers({ data: [BASE_ONEPAGER], error: null })) });
    const result = await listOnePagers();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('zao-pitch');
  });

  it('throws on DB error', async () => {
    mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(makeFromForOnepagers({ data: null, error: new Error('DB fail') })) });
    await expect(listOnePagers()).rejects.toThrow('DB fail');
  });
});

// ---------------------------------------------------------------------------
// getOnePager
// ---------------------------------------------------------------------------
describe('getOnePager', () => {
  it('returns null for invalid slug without hitting the DB', async () => {
    const result = await getOnePager('../etc/passwd');
    expect(result).toBeNull();
    expect(mockGetSupabaseAdmin).not.toHaveBeenCalled();
  });

  it('returns OnePager when found', async () => {
    mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(makeFromForOnePagerGet({ data: BASE_ONEPAGER, error: null })) });
    const result = await getOnePager('zao-pitch');
    expect(result).toMatchObject({ slug: 'zao-pitch' });
  });

  it('returns null when not found', async () => {
    mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(makeFromForOnePagerGet({ data: null, error: null })) });
    const result = await getOnePager('missing');
    expect(result).toBeNull();
  });

  it('throws on DB error', async () => {
    mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(makeFromForOnePagerGet({ data: null, error: new Error('query failed') })) });
    await expect(getOnePager('zao-pitch')).rejects.toThrow('query failed');
  });
});

// ---------------------------------------------------------------------------
// createOnePager
// ---------------------------------------------------------------------------
describe('createOnePager', () => {
  it('inserts the onepager and logs activity', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'stock_onepagers') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: BASE_ONEPAGER, error: null }),
            }),
          }),
        };
      }
      // stock_onepager_activity — logActivity insert
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'act-1', onepager_id: 'op-1', type: 'created' },
              error: null,
            }),
          }),
        }),
      };
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: mockFrom });
    const result = await createOnePager({ slug: 'zao-pitch', title: 'ZAO Pitch' });
    expect(result).toMatchObject({ id: 'op-1', slug: 'zao-pitch' });
    expect(mockFrom).toHaveBeenCalledWith('stock_onepager_activity');
  });

  it('throws on DB error', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: new Error('insert failed') }),
        }),
      }),
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: mockFrom });
    await expect(createOnePager({ slug: 'zao-pitch', title: 'ZAO Pitch' })).rejects.toThrow(
      'insert failed',
    );
  });
});

// ---------------------------------------------------------------------------
// updateOnePager
// ---------------------------------------------------------------------------
describe('updateOnePager', () => {
  it('returns null when slug does not exist', async () => {
    // getOnePager returns null
    mockGetSupabaseAdmin.mockReturnValue({
      from: vi.fn().mockReturnValue(makeFromForOnePagerGet({ data: null, error: null })),
    });
    const result = await updateOnePager('../etc', { title: 'x' });
    expect(result).toBeNull();
  });

  it('returns current when no fields to update', async () => {
    mockGetSupabaseAdmin.mockReturnValue({
      from: vi.fn().mockReturnValue(makeFromForOnePagerGet({ data: BASE_ONEPAGER, error: null })),
    });
    const result = await updateOnePager('zao-pitch', {});
    expect(result).toMatchObject({ slug: 'zao-pitch' });
  });

  it('patches the onepager and logs status_change', async () => {
    let getCall = 0;
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'stock_onepagers') {
        getCall++;
        if (getCall === 1) {
          // getOnePager select
          return makeFromForOnePagerGet({ data: BASE_ONEPAGER, error: null });
        }
        // update select single
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...BASE_ONEPAGER, status: 'review' },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      // logActivity
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'act-2' }, error: null }),
          }),
        }),
      };
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: mockFrom });
    const result = await updateOnePager('zao-pitch', { status: 'review' });
    expect(result?.status).toBe('review');
    expect(mockFrom).toHaveBeenCalledWith('stock_onepager_activity');
  });
});

// ---------------------------------------------------------------------------
// listActivity
// ---------------------------------------------------------------------------
describe('listActivity', () => {
  it('returns empty array when slug not found', async () => {
    mockGetSupabaseAdmin.mockReturnValue({
      from: vi.fn().mockReturnValue(makeFromForOnePagerGet({ data: null, error: null })),
    });
    const result = await listActivity('missing');
    expect(result).toEqual([]);
  });

  it('maps member_name from joined stock_team_members', async () => {
    const activityRow = {
      id: 'act-1',
      onepager_id: 'op-1',
      member_id: 'mem-1',
      type: 'edited',
      content: 'Body updated',
      metadata: {},
      created_at: '2026-07-01T00:00:00Z',
      stock_team_members: { name: 'Zaal' },
    };
    let call = 0;
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      call++;
      if (call === 1) {
        // getOnePager
        return makeFromForOnePagerGet({ data: BASE_ONEPAGER, error: null });
      }
      // listActivity select
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [activityRow], error: null }),
            }),
          }),
        }),
      };
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: mockFrom });
    const result = await listActivity('zao-pitch');
    expect(result[0].member_name).toBe('Zaal');
    expect(result[0].type).toBe('edited');
  });
});
