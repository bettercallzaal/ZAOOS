import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));
vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

/** FIFO chain: create does (1) select/maybeSingle (slug dup), (2) insert/select/single. */
function queuedChain(results: Array<{ data?: unknown; error?: unknown }>) {
  const q = [...results];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['from', 'select', 'insert', 'eq']) chain[m] = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(() => Promise.resolve(q.shift()));
  chain.single = vi.fn(() => Promise.resolve(q.shift()));
  return chain;
}

const valid = {
  slug: 'zao-fractal-aug',
  title: 'ZAO Fractal - August',
  starts_at: '2026-08-04T22:00:00Z',
  is_published: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSessionData.mockResolvedValue({ fid: 19640, isAdmin: true });
});

describe('POST /api/events/create', () => {
  it('403s when not admin', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, isAdmin: false });
    const res = await POST(makePostRequest('/api/events/create', valid));
    expect(res.status).toBe(403);
  });

  it('403s when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await POST(makePostRequest('/api/events/create', valid));
    expect(res.status).toBe(403);
  });

  it('400s on invalid input (bad slug)', async () => {
    const res = await POST(makePostRequest('/api/events/create', { ...valid, slug: 'Bad Slug!' }));
    expect(res.status).toBe(400);
  });

  it('400s when title is missing', async () => {
    const res = await POST(makePostRequest('/api/events/create', { slug: 'x', is_published: false }));
    expect(res.status).toBe(400);
  });

  it('409s on a duplicate slug', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: { id: 'existing-uuid' } }]));
    const res = await POST(makePostRequest('/api/events/create', valid));
    expect(res.status).toBe(409);
  });

  it('201s and returns the created event', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: null }, // no dup
        { data: { id: 'new-uuid', slug: valid.slug, title: valid.title, is_published: true } },
      ]),
    );
    const res = await POST(makePostRequest('/api/events/create', valid));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.event.slug).toBe(valid.slug);
  });

  it('500s when the insert fails', async () => {
    mockFrom.mockReturnValue(
      queuedChain([{ data: null }, { error: { message: 'db down' } }]),
    );
    const res = await POST(makePostRequest('/api/events/create', valid));
    expect(res.status).toBe(500);
  });

  it('rejects a bad lock_address', async () => {
    const res = await POST(makePostRequest('/api/events/create', { ...valid, lock_address: 'nope' }));
    expect(res.status).toBe(400);
  });
});
