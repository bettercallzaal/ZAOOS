// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

const mockDecryptPostingKey = vi.hoisted(() => vi.fn().mockReturnValue('decrypted-key'));
const mockPublishToHive = vi.hoisted(() => vi.fn());
const mockNormalizeForHive = vi.hoisted(() => vi.fn().mockReturnValue({ body: 'normalized' }));
vi.mock('@/lib/publish/hive', () => ({
  decryptPostingKey: mockDecryptPostingKey,
  publishToHive: mockPublishToHive,
}));
vi.mock('@/lib/publish/normalize', () => ({ normalizeForHive: mockNormalizeForHive }));

let fromCallCount = 0;
const mockSingle = vi.hoisted(() => vi.fn());
const mockInsert = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() =>
  vi.fn().mockImplementation(() => {
    fromCallCount++;
    if (fromCallCount === 1) {
      // First call: fetch user credentials
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: mockSingle,
      };
    }
    // Second call: insert publish_log
    return { insert: mockInsert };
  }),
);
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { POST } from '../route';

afterEach(() => {
  vi.clearAllMocks();
  fromCallCount = 0;
});

const MOCK_SESSION = { fid: 10 };
const VALID_BODY = { castHash: '0xabc', text: 'ZAO is live on Hive' };
const HIVE_USER = { hive_username: 'zabal', hive_posting_key_encrypted: 'enc-key' };

describe('POST /api/publish/hive', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makePostRequest('/api/publish/hive', VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing required fields', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/publish/hive', { castHash: '0xabc' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 when user not found in DB', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockSingle.mockResolvedValue({ data: null, error: null });
    const req = makePostRequest('/api/publish/hive', VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns 400 when Hive is not connected', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockSingle.mockResolvedValue({
      data: { hive_username: null, hive_posting_key_encrypted: null },
      error: null,
    });
    const req = makePostRequest('/api/publish/hive', VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns success:true with platformUrl on publish success', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockSingle.mockResolvedValue({ data: HIVE_USER, error: null });
    mockPublishToHive.mockResolvedValue({ url: 'https://hive.blog/@zabal/post', permlink: 'post' });
    mockInsert.mockResolvedValue({ error: null });
    const req = makePostRequest('/api/publish/hive', VALID_BODY);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.platformUrl).toContain('hive.blog');
  });
});
