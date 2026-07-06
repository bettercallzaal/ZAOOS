import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chainMock, makeRequest } from '@/test-utils/api-helpers';

// CRM write-path security regressions (doc audit C-H1 / C-H2 / C-M2).

const { SECRET, mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  SECRET: 'a'.repeat(64), // a valid >=32-char bot secret
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));
vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));
vi.mock('@/lib/env', () => ({ ENV: { CRM_BOT_SECRET: SECRET } }));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { POST } from '../route';

function botRequest(body: unknown, token = SECRET) {
  return makeRequest('/api/crm/interactions', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSessionData.mockResolvedValue(null);
});

describe('POST /api/crm/interactions — auth (C-H2)', () => {
  it('rejects a wrong bearer token with 401 (no fall-through)', async () => {
    const res = await POST(botRequest({ contact: { name: 'X' }, interaction: {} }, 'wrong-token'));
    expect(res.status).toBe(401);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated request (no bearer, no admin) with 401', async () => {
    const req = makeRequest('/api/crm/interactions', {
      method: 'POST',
      body: JSON.stringify({ contact: { name: 'X' }, interaction: {} }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/crm/interactions — bot cannot publish (C-H1)', () => {
  it('strips is_public and forces visibility=private for a bot caller', async () => {
    const contactChain = chainMock({
      data: { id: 'c1', slug: 'zaal', is_public: false },
      error: null,
    });
    const interactionChain = chainMock({ data: { id: 'i1' }, error: null });
    mockFrom.mockReturnValueOnce(contactChain.chain).mockReturnValueOnce(interactionChain.chain);

    const res = await POST(
      botRequest({
        // farcaster_handle => stable key => upsert path
        contact: { name: 'Zaal', farcaster_handle: 'zaal', is_public: true },
        interaction: { type: 'meeting', visibility: 'public', public_summary: 'leak' },
      }),
    );

    expect(res.status).toBe(201);
    // The contact upsert payload must NOT carry is_public (bot can't publish).
    const upsertArg = contactChain.chain.upsert.mock.calls[0][0] as Record<string, unknown>;
    expect('is_public' in upsertArg).toBe(false);
    // The interaction must be forced private regardless of the requested value.
    const insertArg = interactionChain.chain.insert.mock.calls[0][0] as Record<string, unknown>;
    expect(insertArg.visibility).toBe('private');
    expect(insertArg.created_by).toBe('zoe');
  });
});

describe('POST /api/crm/interactions — admin can publish (C-H1 inverse)', () => {
  it('keeps is_public=true and visibility=public for an admin session', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, isAdmin: true });
    const contactChain = chainMock({
      data: { id: 'c1', slug: 'zaal', is_public: true },
      error: null,
    });
    const interactionChain = chainMock({ data: { id: 'i1' }, error: null });
    mockFrom.mockReturnValueOnce(contactChain.chain).mockReturnValueOnce(interactionChain.chain);

    const req = makeRequest('/api/crm/interactions', {
      method: 'POST',
      body: JSON.stringify({
        contact: { name: 'Zaal', farcaster_handle: 'zaal', is_public: true },
        interaction: { type: 'meeting', visibility: 'public' },
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const upsertArg = contactChain.chain.upsert.mock.calls[0][0] as Record<string, unknown>;
    expect(upsertArg.is_public).toBe(true);
    const insertArg = interactionChain.chain.insert.mock.calls[0][0] as Record<string, unknown>;
    expect(insertArg.visibility).toBe('public');
    expect(insertArg.created_by).toBe('admin:123');
  });
});

describe('POST /api/crm/interactions — slug collision (C-M2)', () => {
  it('name-only contact INSERTs with a uniquified slug instead of overwriting', async () => {
    // 1st from(): uniqueNameSlug lookup finds "john-smith" already taken.
    const lookupChain = chainMock({ data: [{ slug: 'john-smith' }], error: null });
    // 2nd from(): the contact insert.
    const contactChain = chainMock({
      data: { id: 'c2', slug: 'john-smith-2', is_public: false },
      error: null,
    });
    // 3rd from(): the interaction insert.
    const interactionChain = chainMock({ data: { id: 'i2' }, error: null });
    mockFrom
      .mockReturnValueOnce(lookupChain.chain)
      .mockReturnValueOnce(contactChain.chain)
      .mockReturnValueOnce(interactionChain.chain);

    const res = await POST(
      botRequest({
        contact: { name: 'John Smith' }, // no handle => name-only
        interaction: { type: 'note' },
      }),
    );

    expect(res.status).toBe(201);
    // Must INSERT (never upsert) and pick a free slug, not overwrite john-smith.
    expect(contactChain.chain.upsert).not.toHaveBeenCalled();
    const insertArg = contactChain.chain.insert.mock.calls[0][0] as Record<string, unknown>;
    expect(insertArg.slug).toBe('john-smith-2');
  });

  it('contact WITH a handle still upserts (stable key, idempotent)', async () => {
    const contactChain = chainMock({
      data: { id: 'c1', slug: 'zaal', is_public: false },
      error: null,
    });
    const interactionChain = chainMock({ data: { id: 'i1' }, error: null });
    mockFrom.mockReturnValueOnce(contactChain.chain).mockReturnValueOnce(interactionChain.chain);

    const res = await POST(
      botRequest({
        contact: { name: 'Zaal', farcaster_handle: 'zaal' },
        interaction: { type: 'note' },
      }),
    );

    expect(res.status).toBe(201);
    expect(contactChain.chain.upsert).toHaveBeenCalledTimes(1);
    expect(contactChain.chain.insert).not.toHaveBeenCalled();
  });
});
