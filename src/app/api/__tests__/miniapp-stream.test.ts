import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Shared mock state ────────────────────────────────────────────────────────
const { mockGetSessionData } = vi.hoisted(() => ({ mockGetSessionData: vi.fn() }));
const { mockSaveSession } = vi.hoisted(() => ({ mockSaveSession: vi.fn() }));
const { mockCheckAllowlist } = vi.hoisted(() => ({ mockCheckAllowlist: vi.fn() }));
const { mockGetUserByFid } = vi.hoisted(() => ({ mockGetUserByFid: vi.fn() }));
const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));
const { mockVerify } = vi.hoisted(() => ({ mockVerify: vi.fn() }));

// ── Module mocks ────────────────────────────────────────────────────────────
vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
  saveSession: mockSaveSession,
}));
vi.mock('@/lib/gates/allowlist', () => ({ checkAllowlist: mockCheckAllowlist }));
vi.mock('@/lib/farcaster/neynar', () => ({ getUserByFid: mockGetUserByFid }));
vi.mock('@/lib/env', () => ({ ENV: { NEXT_PUBLIC_SIWF_DOMAIN: 'zaoos.com' } }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));
vi.mock('@/lib/db/audit-log', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));
vi.mock('@farcaster/quick-auth', () => ({
  createClient: vi.fn(() => ({ verify: mockVerify })),
}));
vi.mock('@stream-io/node-sdk', () => ({
  StreamClient: vi.fn().mockImplementation(() => ({
    generateUserToken: vi.fn().mockReturnValue('mock-stream-token'),
  })),
}));

// Mock @farcaster/miniapp-node for webhook route
const { mockParseWebhookEvent } = vi.hoisted(() => ({ mockParseWebhookEvent: vi.fn() }));
vi.mock('@farcaster/miniapp-node', () => ({
  parseWebhookEvent: mockParseWebhookEvent,
  verifyAppKeyWithNeynar: vi.fn(),
}));

// ── Route imports ────────────────────────────────────────────────────────────
import { GET as miniAppAuthGET } from '@/app/api/miniapp/auth/route';
import { POST as miniAppWebhookPOST } from '@/app/api/miniapp/webhook/route';
import { POST as streamTokenPOST } from '@/app/api/stream/token/route';
import { GET as quickStatsGET } from '@/app/api/admin/quick-stats/route';

// ── Helpers ─────────────────────────────────────────────────────────────────
function req(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}
function makeSupabaseChain(overrides: Record<string, unknown> = {}) {
  return {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(), lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockResolvedValue({ error: null }),
    ...overrides,
  };
}

// ── Miniapp Auth (guard-level tests) ────────────────────────────────────────
describe('GET /api/miniapp/auth', () => {
  beforeEach(() => { vi.clearAllMocks(); mockGetSessionData.mockResolvedValue(null); });

  it('401 without Authorization header', async () => {
    const res = await miniAppAuthGET(req('/api/miniapp/auth'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });
  it('401 with non-Bearer scheme', async () => {
    const res = await miniAppAuthGET(req('/api/miniapp/auth', { headers: { Authorization: 'Basic abc' } }));
    expect(res.status).toBe(401);
  });
  it('401 when JWT verification throws', async () => {
    mockVerify.mockRejectedValue(new Error('bad signature'));
    const res = await miniAppAuthGET(req('/api/miniapp/auth', { headers: { Authorization: 'Bearer invalid' } }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Invalid token');
  });
});

// ── Miniapp Webhook ─────────────────────────────────────────────────────────
describe('POST /api/miniapp/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue(makeSupabaseChain({
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: '1' } }),
    }));
  });
  it('500 when parseWebhookEvent throws (bad payload)', async () => {
    mockParseWebhookEvent.mockRejectedValue(new Error('Invalid webhook'));
    const res = await miniAppWebhookPOST(req('/api/miniapp/webhook', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(500);
  });
  it('500 when parseWebhookEvent throws (invalid event)', async () => {
    mockParseWebhookEvent.mockRejectedValue(new Error('Unknown event type'));
    const res = await miniAppWebhookPOST(req('/api/miniapp/webhook', { method: 'POST', body: JSON.stringify({ event: 'bad', fid: 1 }) }));
    expect(res.status).toBe(500);
  });
  it('200 silently when FID not in allowlist', async () => {
    mockParseWebhookEvent.mockResolvedValue({ fid: 99999, event: { event: 'miniapp_added' } });
    mockFrom.mockReturnValue(makeSupabaseChain({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }));
    const res = await miniAppWebhookPOST(req('/api/miniapp/webhook', { method: 'POST', body: JSON.stringify({ event: 'miniapp_added', fid: 99999 }) }));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });
  it('upserts notification token on miniapp_added', async () => {
    mockParseWebhookEvent.mockResolvedValue({
      fid: 1,
      event: { event: 'miniapp_added', notificationDetails: { token: 'tok', url: 'https://x' } },
    });
    let called = false;
    mockFrom.mockReturnValue(makeSupabaseChain({
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: '1' } }),
      upsert: vi.fn().mockImplementation(() => { called = true; return Promise.resolve({ error: null }); }),
    }));
    const res = await miniAppWebhookPOST(req('/api/miniapp/webhook', { method: 'POST', body: JSON.stringify({ event: 'miniapp_added', fid: 1 }) }));
    expect(res.status).toBe(200);
    expect(called).toBe(true);
  });
});

// ── Stream Token ─────────────────────────────────────────────────────────────
describe('POST /api/stream/token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(null);
    process.env.NEXT_PUBLIC_STREAM_API_KEY = 'k';
    process.env.STREAM_API_SECRET = 's';
  });
  it('401 when not authenticated', async () => {
    const res = await streamTokenPOST(req('/api/stream/token', { method: 'POST', body: JSON.stringify({ userId: '1' }) }));
    expect(res.status).toBe(401);
  });
  it('400 when userId missing', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1, username: 't' });
    const res = await streamTokenPOST(req('/api/stream/token', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('userId is required');
  });
  it('403 when requesting token for different user', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1, username: 'zaal' });
    const res = await streamTokenPOST(req('/api/stream/token', { method: 'POST', body: JSON.stringify({ userId: '99' }) }));
    expect(res.status).toBe(403);
  });
  it('200 with token when session FID matches userId', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1, username: 'zaal' });
    const res = await streamTokenPOST(req('/api/stream/token', { method: 'POST', body: JSON.stringify({ userId: '1' }) }));
    expect(res.status).toBe(200);
    expect((await res.json()).token).toBe('mock-stream-token');
  });
});

// ── Admin Quick-Stats ───────────────────────────────────────────────────────
describe('GET /api/admin/quick-stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(null);
    const empty = () => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), not: vi.fn().mockReturnThis(), lt: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), gt: vi.fn().mockReturnThis(), count: 0 });
    mockFrom.mockImplementation(() => empty());
  });
  it('403 when not authenticated', async () => {
    const res = await quickStatsGET();
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Admin required');
  });
  it('403 when not admin', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1, isAdmin: false });
    const res = await quickStatsGET();
    expect(res.status).toBe(403);
  });
  it('200 with stats when admin', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1, isAdmin: true });
    const res = await quickStatsGET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('totalMembers');
    expect(body).toHaveProperty('activeMembers');
    expect(body).toHaveProperty('totalSessions');
    expect(body).toHaveProperty('dormantUsers');
  });
});
