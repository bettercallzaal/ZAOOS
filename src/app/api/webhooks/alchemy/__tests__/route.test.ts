// @vitest-environment node
import crypto from 'crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// SIGNING_KEYS is evaluated at module load — must set env before import
vi.hoisted(() => {
  process.env.ALCHEMY_WEBHOOK_KEY_ZOR = 'test-alchemy-key';
});

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockMaybeSingle = vi.hoisted(() => vi.fn().mockResolvedValue({ data: null }));
const mockIlike = vi.hoisted(() => vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }));
const mockSelect = vi.hoisted(() => vi.fn().mockReturnValue({ ilike: mockIlike }));
const mockUpsert = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }));
const mockFrom = vi.hoisted(() =>
  vi.fn().mockImplementation((table: string) => {
    if (table === 'respect_transfers') return { upsert: mockUpsert };
    return { select: mockSelect };
  }),
);
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { POST } from '../route';

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
      expect.any(Object),
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
});
