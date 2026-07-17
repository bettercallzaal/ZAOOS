// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

const mockSendPushNotification = vi.hoisted(() => vi.fn());
vi.mock('@/lib/push/vapid', () => ({ sendPushNotification: mockSendPushNotification }));

const mockSelect = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() =>
  vi.fn().mockImplementation((table: string) => ({
    select: mockSelect,
    delete: mockDelete,
  })),
);
vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: vi.fn(() => ({ from: mockFrom })),
}));

import { POST } from '../route';

afterEach(() => vi.clearAllMocks());

const ADMIN_SESSION = { fid: 1, isAdmin: true };
const VALID_BODY = { fid: 10, title: 'New Drop', body: 'ZAO has a new track!' };

describe('POST /api/notifications/push/send', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makePostRequest('/api/notifications/push/send', VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1, isAdmin: false });
    const req = makePostRequest('/api/notifications/push/send', VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid payload (missing body field)', async () => {
    mockGetSessionData.mockResolvedValue(ADMIN_SESSION);
    const req = makePostRequest('/api/notifications/push/send', { fid: 10, title: 'Hi' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns sent:0 when user has no subscriptions', async () => {
    mockGetSessionData.mockResolvedValue(ADMIN_SESSION);
    mockSelect.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    const req = makePostRequest('/api/notifications/push/send', VALID_BODY);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.sent).toBe(0);
  });

  it('sends to all subscriptions and returns correct count', async () => {
    mockGetSessionData.mockResolvedValue(ADMIN_SESSION);
    const subs = [
      { endpoint: 'https://push.endpoint/1', p256dh: 'key1', auth: 'auth1' },
      { endpoint: 'https://push.endpoint/2', p256dh: 'key2', auth: 'auth2' },
    ];
    mockSelect.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: subs, error: null }),
    });
    mockSendPushNotification.mockResolvedValue(true);
    const req = makePostRequest('/api/notifications/push/send', VALID_BODY);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.sent).toBe(2);
    expect(body.total).toBe(2);
  });
});
