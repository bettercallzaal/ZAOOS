import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Zaal ruling (vault 2e556756, 20 Nov 2026): a proposal that reaches its
// Respect threshold becomes ONE ZOE Telegram draft. Nothing is published to
// Farcaster, Bluesky, X, Threads, Telegram or Discord. Red control: against the
// old route (origin/main 8c5a0f1eb) mockPostCast and mockPostToBluesky are
// called and mockDraft is not, so this file fails.

const { mockGetSession, mockFrom, mockMulticall, mockDraft, mockPostCast, mockPostToBluesky, updates } =
  vi.hoisted(() => {
    // Set before the route imports @/lib/env, which reads env at import time.
    process.env.ZAO_OFFICIAL_SIGNER_UUID = 'signer-uuid';
    process.env.ZAO_OFFICIAL_NEYNAR_API_KEY = 'api-key';
    process.env.ZAO_OFFICIAL_FID = '997289';
    return {
    mockGetSession: vi.fn(),
    mockFrom: vi.fn(),
    mockMulticall: vi.fn(),
    mockDraft: vi.fn(),
    mockPostCast: vi.fn(),
    mockPostToBluesky: vi.fn(),
    updates: [] as Array<{ table: string; data: unknown }>,
    };
  });

vi.mock('@/lib/auth/session', () => ({ getSessionData: () => mockGetSession() }));
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));
vi.mock('@/lib/notifications', () => ({ createInAppNotification: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/publish/official-draft', () => ({ draftOfficialCast: mockDraft }));
vi.mock('@/lib/farcaster/neynar', () => ({ postCast: mockPostCast }));
// The old route read the official signer through @/lib/env, which demands the
// whole app config. Give it just the signer, as production has it.
vi.mock('@/lib/env', () => ({
  ENV: {
    ZAO_OFFICIAL_SIGNER_UUID: 'signer-uuid',
    ZAO_OFFICIAL_NEYNAR_API_KEY: 'api-key',
    ZAO_OFFICIAL_FID: '997289',
  },
}));
vi.mock('@/lib/bluesky/client', () => ({ postToBluesky: mockPostToBluesky }));
vi.mock('viem', async (orig) => {
  const actual = await orig<typeof import('viem')>();
  return { ...actual, createPublicClient: () => ({ multicall: mockMulticall }) };
});

import { POST } from '@/app/api/proposals/vote/route';

const PROPOSAL_ID = '550e8400-e29b-41d4-a716-446655440000';
const WALLET = '0x1234567890abcdef1234567890abcdef12345678';

const proposalRow = {
  id: PROPOSAL_ID,
  status: 'open',
  closes_at: null,
  category: 'social',
  respect_threshold: 1,
  publish_text: 'ZM from the ZAO',
  published_cast_hash: null,
  publish_image_url: null,
  title: 't',
  description: 'd',
  author: { username: 'zaal', display_name: 'Zaal' },
};

function routeTables() {
  mockFrom.mockImplementation((table: string) => {
    const chain: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'upsert', 'insert']) chain[m] = vi.fn().mockReturnValue(chain);
    chain.update = vi.fn((data: unknown) => {
      updates.push({ table, data });
      return chain;
    });
    let single: unknown = { data: null, error: null };
    if (table === 'proposals') single = { data: proposalRow, error: null };
    if (table === 'users')
      single = { data: { id: 'u1', primary_wallet: WALLET, respect_wallet: null }, error: null };
    if (table === 'proposal_votes')
      single = { data: { id: 'v1', vote: 'for', respect_weight: 7 }, error: null };
    chain.single = vi.fn().mockResolvedValue(single);
    chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    // Awaiting the chain itself (e.g. the votes sum, the status update)
    const listResult =
      table === 'proposal_votes'
        ? { data: [{ vote: 'for', respect_weight: 7 }], error: null }
        : { data: null, error: null };
    chain.then = (resolve: (v: unknown) => unknown) => resolve(listResult);
    return chain;
  });
}

const body = (b: unknown) =>
  new NextRequest('http://localhost:3000/api/proposals/vote', {
    method: 'POST',
    body: JSON.stringify(b),
    headers: { 'Content-Type': 'application/json' },
  });

describe('proposal threshold -> ZOE draft, not a post', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updates.length = 0;
    process.env.ZAO_OFFICIAL_SIGNER_UUID = 'signer-uuid';
    process.env.ZAO_OFFICIAL_NEYNAR_API_KEY = 'api-key';
    mockGetSession.mockResolvedValue({ fid: 1, username: 'voter' });
    mockMulticall.mockResolvedValue([
      { status: 'success', result: 5n * 10n ** 18n },
      { status: 'success', result: 2n },
    ]);
    mockPostCast.mockResolvedValue({ cast: { hash: '0xposted' } });
    mockPostToBluesky.mockResolvedValue('at://posted');
    mockDraft.mockResolvedValue({ delivered: true });
    routeTables();
  });

  it('drafts once for Zaal and publishes nowhere', async () => {
    const res = await POST(body({ proposal_id: PROPOSAL_ID, vote: 'for' }));
    expect(res.status).toBe(200);
    expect(mockPostCast).not.toHaveBeenCalled();
    expect(mockPostToBluesky).not.toHaveBeenCalled();
    expect(mockDraft).toHaveBeenCalledTimes(1);
    const draft = mockDraft.mock.calls[0][0];
    expect(draft.text).toContain('ZM from the ZAO');
    expect(draft.source).toContain('proposal-approved');
    const json = await res.json();
    expect(json.published).toBe(false);
  });

  it('marks the proposal approved, not published', async () => {
    await POST(body({ proposal_id: PROPOSAL_ID, vote: 'for' }));
    const proposalUpdates = updates.filter((u) => u.table === 'proposals');
    expect(proposalUpdates).toEqual([{ table: 'proposals', data: { status: 'approved' } }]);
  });
});
