// @vitest-environment node
import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// SIGNING_KEYS is evaluated at module load — must set env before import
vi.hoisted(() => {
  process.env.ALCHEMY_WEBHOOK_KEY_ZOR = 'test-alchemy-key';
});

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockMaybeSingle = vi.hoisted(() => vi.fn());
const mockIlike = vi.hoisted(() => vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }));
const mockSelect = vi.hoisted(() => vi.fn().mockReturnValue({ ilike: mockIlike }));
// upsert(...).select('id') — the chain the route uses to learn whether the row
// was actually inserted (first delivery) or ignored as a duplicate (replay).
const mockUpsertSelect = vi.hoisted(() => vi.fn());
const mockUpsert = vi.hoisted(() => vi.fn().mockReturnValue({ select: mockUpsertSelect }));
const mockUpdateEq = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }));
const mockUpdate = vi.hoisted(() => vi.fn().mockReturnValue({ eq: mockUpdateEq }));
const mockFrom = vi.hoisted(() =>
  vi.fn().mockImplementation((table: string) => {
    if (table === 'respect_transfers') return { upsert: mockUpsert };
    return { select: mockSelect, update: mockUpdate };
  }),
);
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { POST } from '../route';

beforeEach(() => {
  // Defaults: the transfer row inserts cleanly, and no member/user matches.
  mockUpsertSelect.mockResolvedValue({ data: [{ id: 'transfer-1' }], error: null });
  mockMaybeSingle.mockResolvedValue({ data: null });
});

afterEach(() => vi.clearAllMocks());

const TEST_KEY = 'test-alchemy-key';

function signBody(body: string): string {
  return crypto.createHmac('sha256', TEST_KEY).update(body, 'utf8').digest('hex');
}

function makeAlchemyRequest(body: string, sig?: string) {
  return new NextRequest(new URL('/api/webhooks/alchemy', 'http://localhost:3000'), {
    method: 'POST',
    body,
    headers: { 'x-alchemy-signature': sig ?? signBody(body) },
  });
}

const EMPTY_PAYLOAD = JSON.stringify({ event: { activity: [] } });
const ZOR_CONTRACT = '0x9885cceef7e8371bf8d6f2413723d25917e7445c';
const ZOR_ACTIVITY_PAYLOAD = JSON.stringify({
  createdAt: '2026-01-01T00:00:00Z',
  event: {
    activity: [
      {
        contractAddress: ZOR_CONTRACT,
        toAddress: '0xrecipient',
        fromAddress: '0x0000000000000000000000000000000000000000',
        log: { transactionHash: '0xtxhash', blockNumber: '0x1' },
        erc1155Metadata: [{ value: '5' }],
      },
    ],
  },
});

/** respect_members lookup hits first, then the users lookup. */
function respectMemberFound() {
  mockMaybeSingle
    .mockResolvedValueOnce({ data: { id: 'member-1', onchain_og: 0, onchain_zor: 10 } })
    .mockResolvedValueOnce({ data: null });
}

describe('POST /api/webhooks/alchemy', () => {
  it('returns 401 when HMAC signature does not match', async () => {
    const req = makeAlchemyRequest(EMPTY_PAYLOAD, 'wrong-signature-deadbeef');
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns ok:true for valid signature with empty activities', async () => {
    const req = makeAlchemyRequest(EMPTY_PAYLOAD);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns ok:true and upserts ZOR ERC-1155 mint activity', async () => {
    const req = makeAlchemyRequest(ZOR_ACTIVITY_PAYLOAD);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ token_type: 'zor_erc1155', tx_hash: '0xtxhash' }),
      expect.objectContaining({ ignoreDuplicates: true }),
    );
  });

  it('returns ok:true with error note when body is malformed JSON', async () => {
    const invalidBody = 'not-json-at-all';
    const req = makeAlchemyRequest(invalidBody);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.error).toBeDefined();
  });

  // Alchemy re-delivers anything it did not get a 2xx for, so the same signed
  // payload can legitimately arrive twice. The balance must move exactly once.
  describe('idempotency on re-delivery', () => {
    it('credits the mint on the first delivery of a transfer', async () => {
      respectMemberFound();
      await POST(makeAlchemyRequest(ZOR_ACTIVITY_PAYLOAD));
      expect(mockUpdate).toHaveBeenCalledWith({ onchain_zor: 15 });
    });

    it('does NOT credit again when the same transfer is re-delivered', async () => {
      // Duplicate: ON CONFLICT DO NOTHING inserted nothing, so select returns [].
      mockUpsertSelect.mockResolvedValue({ data: [], error: null });
      respectMemberFound();
      await POST(makeAlchemyRequest(ZOR_ACTIVITY_PAYLOAD));
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('does NOT credit when the transfer row could not be recorded', async () => {
      // No ledger row means the next delivery would look like the first one, so
      // crediting here would double-count on the retry.
      mockUpsertSelect.mockResolvedValue({ data: null, error: { message: 'db down' } });
      respectMemberFound();
      await POST(makeAlchemyRequest(ZOR_ACTIVITY_PAYLOAD));
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
