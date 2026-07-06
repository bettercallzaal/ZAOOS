import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetSession, mockFrom, mockMulticall, mockNotify } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFrom: vi.fn(),
  mockMulticall: vi.fn(),
  mockNotify: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({ getSessionData: () => mockGetSession() }));
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));
vi.mock('@/lib/notifications', () => ({
  createInAppNotification: (...a: unknown[]) => mockNotify(...a),
}));
vi.mock('viem', async (orig) => {
  const actual = await orig<typeof import('viem')>();
  return { ...actual, createPublicClient: () => ({ multicall: mockMulticall }) };
});

import { POST } from '@/app/api/proposals/vote/route';

const PROPOSAL_ID = '550e8400-e29b-41d4-a716-446655440000';
const WALLET = '0x1234567890abcdef1234567890abcdef12345678';

/** Build a from() router: each table name maps to a chain producing its result. */
function routeTables(tables: Record<string, { single?: unknown; upsertSingle?: unknown }>) {
  mockFrom.mockImplementation((table: string) => {
    const cfg = tables[table] ?? {};
    const chain: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'upsert']) chain[m] = vi.fn().mockReturnValue(chain);
    chain.single = vi
      .fn()
      .mockResolvedValue(cfg.upsertSingle ?? cfg.single ?? { data: null, error: null });
    chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    return chain;
  });
}

const body = (b: unknown) =>
  new NextRequest('http://localhost:3000/api/proposals/vote', {
    method: 'POST',
    body: JSON.stringify(b),
    headers: { 'Content-Type': 'application/json' },
  });

const openProposal = { single: { data: { status: 'open', closes_at: null }, error: null } };
const validUser = {
  single: { data: { id: 'u1', primary_wallet: WALLET, respect_wallet: null }, error: null },
};

describe('POST /api/proposals/vote', () => {
  beforeEach(() => vi.clearAllMocks());

  it('401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await POST(body({ proposal_id: PROPOSAL_ID, vote: 'for' }));
    expect(res.status).toBe(401);
  });

  it('400 on an invalid vote value', async () => {
    mockGetSession.mockResolvedValue({ fid: 1 });
    const res = await POST(body({ proposal_id: PROPOSAL_ID, vote: 'maybe' }));
    expect(res.status).toBe(400);
  });

  it('404 when the proposal does not exist', async () => {
    mockGetSession.mockResolvedValue({ fid: 1 });
    routeTables({ proposals: { single: { data: null, error: null } }, users: validUser });
    const res = await POST(body({ proposal_id: PROPOSAL_ID, vote: 'for' }));
    expect(res.status).toBe(404);
  });

  it('400 when the proposal is not open', async () => {
    mockGetSession.mockResolvedValue({ fid: 1 });
    routeTables({
      proposals: { single: { data: { status: 'closed', closes_at: null }, error: null } },
      users: validUser,
    });
    const res = await POST(body({ proposal_id: PROPOSAL_ID, vote: 'for' }));
    expect(res.status).toBe(400);
  });

  it('503 and refuses the vote when the on-chain balance read is incomplete', async () => {
    mockGetSession.mockResolvedValue({ fid: 1 });
    routeTables({ proposals: openProposal, users: validUser });
    // OG read fails -> computeRespectWeight reports incomplete -> route must NOT record the vote
    mockMulticall.mockResolvedValue([{ status: 'failure' }, { status: 'success', result: 0n }]);
    const res = await POST(body({ proposal_id: PROPOSAL_ID, vote: 'for' }));
    expect(res.status).toBe(503);
    const upsertCalled = mockFrom.mock.calls.some((c) => c[0] === 'proposal_votes');
    expect(upsertCalled).toBe(false); // vote was NOT written with a corrupted weight
  });

  it('records the vote with the computed weight on a complete read', async () => {
    mockGetSession.mockResolvedValue({ fid: 1 });
    routeTables({
      proposals: openProposal,
      users: validUser,
      proposal_votes: {
        upsertSingle: { data: { id: 'v1', vote: 'for', respect_weight: 7 }, error: null },
      },
    });
    mockMulticall.mockResolvedValue([
      { status: 'success', result: 5n * 10n ** 18n }, // 5 OG (formatEther -> 5)
      { status: 'success', result: 2n }, // 2 ZOR
    ]);
    const res = await POST(body({ proposal_id: PROPOSAL_ID, vote: 'for' }));
    expect(res.status).toBe(200);
    const writeCall = mockFrom.mock.calls.some((c) => c[0] === 'proposal_votes');
    expect(writeCall).toBe(true);
  });
});
