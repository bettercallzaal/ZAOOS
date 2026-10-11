// @vitest-environment node
import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
vi.mock('@/../community.config', () => ({
  communityConfig: { farcaster: { channels: ['zao'] } },
}));
vi.mock('@/lib/env', () => ({ ENV: { NEYNAR_WEBHOOK_SECRET: 'test-neynar-secret' } }));
vi.mock('@/lib/moderation/moderate', () => ({
  moderateContent: vi.fn().mockResolvedValue({
    flagged: false,
    categories: [],
    scores: {},
    action: 'none',
  }),
}));
vi.mock('@/lib/music/isMusicUrl', () => ({ isMusicUrl: vi.fn() }));

const mockCastUpsert = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() =>
  vi.fn().mockImplementation((table: string) => {
    if (table === 'channel_casts') return { upsert: mockCastUpsert };
    return { insert: vi.fn().mockResolvedValue({ error: null }) };
  }),
);
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

// `after` needs a live request scope; here it is recorded and run by hand.
const mockAfter = vi.hoisted(() => vi.fn());
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: mockAfter,
}));

// The real flag check runs; only the hub and database work is stubbed.
const mockRecord = vi.hoisted(() => vi.fn());
vi.mock('@/lib/farcaster/signer-ingest', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/farcaster/signer-ingest')>()),
  recordCastSigner: mockRecord,
}));

import { POST } from '../route';

const HASH = `0x${'cd'.repeat(20)}`;
const created = (channel = 'zao') => ({
  type: 'cast.created',
  data: {
    hash: HASH,
    text: 'gm',
    timestamp: '2026-10-11T12:00:00Z',
    author: { fid: 3, username: 'dwr' },
    channel: { id: channel },
  },
});

function request(body: object) {
  const raw = JSON.stringify(body);
  const sig = crypto.createHmac('sha512', 'test-neynar-secret').update(raw).digest('hex');
  return new NextRequest(new URL('/api/webhooks/neynar', 'http://localhost:3000'), {
    method: 'POST',
    body: raw,
    headers: { 'X-Neynar-Signature': sig },
  });
}

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.FARCASTER_SIGNER_PROVENANCE_INGEST;
});

describe('POST /api/webhooks/neynar - signer provenance at ingestion', () => {
  it('flag off: the cast is stored as before and no signer work is scheduled', async () => {
    mockCastUpsert.mockResolvedValueOnce({ error: null });
    const res = await POST(request(created()));
    expect(res.status).toBe(200);
    expect(mockCastUpsert).toHaveBeenCalledTimes(1);
    expect(mockAfter).not.toHaveBeenCalled();
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it('flag on: the signer is recorded after the response, for the stored cast', async () => {
    process.env.FARCASTER_SIGNER_PROVENANCE_INGEST = '1';
    mockCastUpsert.mockResolvedValueOnce({ error: null });
    const res = await POST(request(created()));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    // Scheduled, not awaited: the response does not wait on a hub.
    expect(mockAfter).toHaveBeenCalledTimes(1);
    expect(mockRecord).not.toHaveBeenCalled();
    await mockAfter.mock.calls[0][0]();
    expect(mockRecord).toHaveBeenCalledWith(3, HASH);
  });

  it('flag on: a cast outside the watched channels is not recorded', async () => {
    process.env.FARCASTER_SIGNER_PROVENANCE_INGEST = '1';
    const res = await POST(request(created('other')));
    expect(res.status).toBe(200);
    expect(mockCastUpsert).not.toHaveBeenCalled();
    expect(mockAfter).not.toHaveBeenCalled();
  });

  it('flag on: when storing the cast throws, nothing is recorded for it', async () => {
    process.env.FARCASTER_SIGNER_PROVENANCE_INGEST = '1';
    mockCastUpsert.mockRejectedValueOnce(new Error('db down'));
    const res = await POST(request(created()));
    expect(res.status).toBe(500);
    expect(mockAfter).not.toHaveBeenCalled();
  });

  it('flag on: other event types schedule nothing', async () => {
    process.env.FARCASTER_SIGNER_PROVENANCE_INGEST = '1';
    const res = await POST(request({ type: 'reaction.created', data: {} }));
    expect(res.status).toBe(200);
    expect(mockAfter).not.toHaveBeenCalled();
  });
});
