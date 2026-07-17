// @vitest-environment node
import crypto from 'crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// WATCHED_CHANNELS is module-level — community.config mock must be in place before import
vi.mock('@/../community.config', () => ({
  communityConfig: { farcaster: { channels: ['zao', 'music'] } },
}));

const mockEnv = vi.hoisted(() => ({
  NEYNAR_WEBHOOK_SECRET: 'test-neynar-secret' as string | undefined,
}));
vi.mock('@/lib/env', () => ({ ENV: mockEnv }));

const mockUpsert = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }));
const mockInsert = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }));
const mockLimit = vi.hoisted(() => vi.fn().mockResolvedValue({ data: [] }));
const mockEq = vi.hoisted(() => vi.fn().mockReturnValue({ limit: mockLimit }));
const mockSelect = vi.hoisted(() =>
  vi.fn().mockReturnValue({ eq: mockEq, onConflict: vi.fn().mockReturnThis() }),
);
const mockFrom = vi.hoisted(() =>
  vi.fn().mockImplementation((table: string) => {
    if (table === 'channel_casts') return { upsert: mockUpsert };
    if (table === 'moderation_log' || table === 'hidden_messages') return { insert: mockInsert };
    if (table === 'song_submissions') return { select: mockSelect, insert: mockInsert };
    return { upsert: mockUpsert };
  }),
);
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

const mockModerateContent = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ flagged: false, categories: [], scores: {}, action: 'allow' }),
);
vi.mock('@/lib/moderation/moderate', () => ({ moderateContent: mockModerateContent }));

const mockIsMusicUrl = vi.hoisted(() => vi.fn().mockReturnValue(null));
vi.mock('@/lib/music/isMusicUrl', () => ({ isMusicUrl: mockIsMusicUrl }));

import { POST } from '../route';

afterEach(() => {
  vi.clearAllMocks();
  mockEnv.NEYNAR_WEBHOOK_SECRET = 'test-neynar-secret';
});

const TEST_SECRET = 'test-neynar-secret';

function signBody(body: string, secret = TEST_SECRET): string {
  return crypto.createHmac('sha512', secret).update(body).digest('hex');
}

function makeNeynarRequest(body: object, sig?: string) {
  const bodyStr = JSON.stringify(body);
  return new NextRequest(new URL('/api/webhooks/neynar', 'http://localhost:3000'), {
    method: 'POST',
    body: bodyStr,
    headers: { 'X-Neynar-Signature': sig ?? signBody(bodyStr) },
  });
}

const CAST_IN_CHANNEL: Record<string, unknown> = {
  hash: '0xhash1',
  channel: { id: 'zao' },
  author: { fid: 42, username: 'zabal', display_name: 'ZAO', pfp_url: 'https://pfp' },
  text: 'Hello ZAO',
  timestamp: '2026-07-01T00:00:00Z',
  embeds: [],
  reactions: { likes_count: 0, recasts_count: 0, likes: [], recasts: [] },
  replies: { count: 0 },
};

describe('POST /api/webhooks/neynar', () => {
  it('returns 503 when NEYNAR_WEBHOOK_SECRET is not configured', async () => {
    mockEnv.NEYNAR_WEBHOOK_SECRET = undefined;
    const req = makeNeynarRequest({ type: 'cast.created', data: CAST_IN_CHANNEL }, 'any-sig');
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it('returns 401 when signature does not match', async () => {
    const req = makeNeynarRequest({ type: 'cast.created', data: CAST_IN_CHANNEL }, 'deadbeef');
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns ok:true for non cast.created event types', async () => {
    const payload = { type: 'cast.deleted', data: {} };
    const req = makeNeynarRequest(payload);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  it('returns ok:true for a cast in a non-watched channel', async () => {
    const payload = {
      type: 'cast.created',
      data: { ...CAST_IN_CHANNEL, channel: { id: 'some-other-channel' } },
    };
    const req = makeNeynarRequest(payload);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('upserts cast and returns ok:true for a cast in a watched channel', async () => {
    const payload = { type: 'cast.created', data: CAST_IN_CHANNEL };
    const req = makeNeynarRequest(payload);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ hash: '0xhash1', channel_id: 'zao' }),
      expect.any(Object),
    );
  });
});
