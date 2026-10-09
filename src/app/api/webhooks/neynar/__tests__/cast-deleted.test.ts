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

const mockFrom = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));
vi.mock('@/lib/moderation/moderate', () => ({ moderateContent: vi.fn() }));
vi.mock('@/lib/music/isMusicUrl', () => ({ isMusicUrl: vi.fn() }));

// The real flag check and parser run; only the database step is stubbed.
const mockTombstone = vi.hoisted(() => vi.fn());
vi.mock('@/lib/farcaster/cast-tombstone', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/farcaster/cast-tombstone')>()),
  tombstoneDeletedCast: mockTombstone,
}));

import { POST } from '../route';

const HASH = `0x${'cd'.repeat(20)}`;

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
  delete process.env.NEYNAR_CAST_DELETED_TOMBSTONE;
});

describe('POST /api/webhooks/neynar - cast.deleted', () => {
  it('flag off: ignored exactly as before, nothing touched', async () => {
    const res = await POST(request({ type: 'cast.deleted', data: { hash: HASH } }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mockTombstone).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('flag on: tombstones the deleted cast', async () => {
    process.env.NEYNAR_CAST_DELETED_TOMBSTONE = '1';
    mockTombstone.mockResolvedValueOnce({ status: 'tombstoned', hash: HASH });
    const res = await POST(request({ type: 'cast.deleted', data: { hash: HASH } }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, tombstone: 'tombstoned' });
    expect(mockTombstone).toHaveBeenCalledWith(HASH);
  });

  it('flag on: a cast we never held is a 200, so Neynar does not retry it', async () => {
    process.env.NEYNAR_CAST_DELETED_TOMBSTONE = '1';
    mockTombstone.mockResolvedValueOnce({ status: 'not-held', hash: HASH });
    const res = await POST(request({ type: 'cast.deleted', data: { hash: HASH } }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, tombstone: 'not-held' });
  });

  it('flag on: a failed write is a 500, so Neynar delivers it again', async () => {
    process.env.NEYNAR_CAST_DELETED_TOMBSTONE = '1';
    mockTombstone.mockResolvedValueOnce({ status: 'error', hash: HASH, error: 'boom' });
    const res = await POST(request({ type: 'cast.deleted', data: { hash: HASH } }));
    expect(res.status).toBe(500);
  });

  it('flag on: a malformed hash is ignored, not written', async () => {
    process.env.NEYNAR_CAST_DELETED_TOMBSTONE = '1';
    const res = await POST(request({ type: 'cast.deleted', data: { hash: 'not-a-hash' } }));
    expect(res.status).toBe(200);
    expect(mockTombstone).not.toHaveBeenCalled();
  });

  it('flag on: an unsigned cast.deleted is still rejected by the signature check', async () => {
    process.env.NEYNAR_CAST_DELETED_TOMBSTONE = '1';
    const raw = JSON.stringify({ type: 'cast.deleted', data: { hash: HASH } });
    const req = new NextRequest(new URL('/api/webhooks/neynar', 'http://localhost:3000'), {
      method: 'POST',
      body: raw,
      headers: { 'X-Neynar-Signature': 'ab'.repeat(64) },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(mockTombstone).not.toHaveBeenCalled();
  });
});
