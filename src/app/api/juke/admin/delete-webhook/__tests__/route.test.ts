// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

const mockEnv = vi.hoisted(() => ({ JUKE_API_KEY: 'test-juke-key' as string | undefined }));
vi.mock('@/lib/env', () => ({ ENV: mockEnv }));

const mockGetJukeWebhookDetail = vi.hoisted(() => vi.fn());
const mockDeleteJukeWebhook = vi.hoisted(() => vi.fn());
vi.mock('@/lib/spaces/juke-api-reads', () => ({
  getJukeWebhookDetail: mockGetJukeWebhookDetail,
  deleteJukeWebhook: mockDeleteJukeWebhook,
}));

import { GET, POST } from '../route';

afterEach(() => {
  vi.clearAllMocks();
  mockEnv.JUKE_API_KEY = 'test-juke-key';
});

const VALID_WEBHOOK_ID = 'abc123-webhook';
const ADMIN_SESSION = { fid: 1, isAdmin: true };

describe('POST /api/juke/admin/delete-webhook', () => {
  it('returns 401 when user is not admin', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1, isAdmin: false });
    const req = makePostRequest('/api/juke/admin/delete-webhook', { webhookId: VALID_WEBHOOK_ID });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 503 when JUKE_API_KEY is not configured', async () => {
    mockGetSessionData.mockResolvedValue(ADMIN_SESSION);
    mockEnv.JUKE_API_KEY = undefined;
    const req = makePostRequest('/api/juke/admin/delete-webhook', { webhookId: VALID_WEBHOOK_ID });
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it('returns 400 for invalid webhookId (special chars)', async () => {
    mockGetSessionData.mockResolvedValue(ADMIN_SESSION);
    const req = makePostRequest('/api/juke/admin/delete-webhook', { webhookId: 'bad id!' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 502 when Juke rejects the delete', async () => {
    mockGetSessionData.mockResolvedValue(ADMIN_SESSION);
    mockGetJukeWebhookDetail.mockResolvedValue({ ok: false, status: 404 });
    mockDeleteJukeWebhook.mockResolvedValue({ ok: false, status: 404, error: 'Not Found' });
    const req = makePostRequest('/api/juke/admin/delete-webhook', { webhookId: VALID_WEBHOOK_ID });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns ok:true with deleted webhookId on success', async () => {
    mockGetSessionData.mockResolvedValue(ADMIN_SESSION);
    mockGetJukeWebhookDetail.mockResolvedValue({
      ok: true,
      data: { url: 'https://zaoos.com/api/juke/webhook', events: ['room.finished'], last_status: 200, consecutive_failures: 0 },
    });
    mockDeleteJukeWebhook.mockResolvedValue({ ok: true, status: 204, rateLimit: null });
    const req = makePostRequest('/api/juke/admin/delete-webhook', { webhookId: VALID_WEBHOOK_ID });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.deleted).toBe(VALID_WEBHOOK_ID);
  });
});

describe('GET /api/juke/admin/delete-webhook', () => {
  it('returns 405 for GET requests', async () => {
    const res = await GET();
    expect(res.status).toBe(405);
  });
});
