// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest, makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/notifications', () => ({ createInAppNotification: vi.fn().mockResolvedValue(undefined) }));

const mockOrder = vi.hoisted(() => vi.fn());
const mockSingle = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { GET, POST } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 10, displayName: 'ZAO', pfpUrl: 'https://pfp.url', signerUuid: 'sig' };
const PROPOSAL_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

describe('GET /api/proposals/comment', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makeGetRequest('/api/proposals/comment', { proposal_id: PROPOSAL_UUID });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when proposal_id is missing', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makeGetRequest('/api/proposals/comment');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns comments for a proposal', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const mockComments = [{ id: 'c1', body: 'Great proposal!', author: { display_name: 'ZAO' } }];
    mockOrder.mockResolvedValue({ data: mockComments, error: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: mockOrder,
    });
    const req = makeGetRequest('/api/proposals/comment', { proposal_id: PROPOSAL_UUID });
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.comments).toHaveLength(1);
  });
});

describe('POST /api/proposals/comment', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makePostRequest('/api/proposals/comment', {
      proposal_id: PROPOSAL_UUID,
      body: 'Great proposal!',
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid payload (bad UUID)', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/proposals/comment', { proposal_id: 'not-a-uuid', body: 'Hi' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 when user not in DB', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockSingle.mockResolvedValueOnce({ data: null, error: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    });
    const req = makePostRequest('/api/proposals/comment', { proposal_id: PROPOSAL_UUID, body: 'Great!' });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns comment on success', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const mockComment = { id: 'c2', body: 'Love it!', author: { display_name: 'ZAO' } };
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // User lookup
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'user-uuid' }, error: null }),
        };
      }
      if (callCount === 2) {
        // Insert comment
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockComment, error: null }),
          }),
        };
      }
      // Notify proposal author (fire-and-forget)
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });
    const req = makePostRequest('/api/proposals/comment', { proposal_id: PROPOSAL_UUID, body: 'Love it!' });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.comment.body).toBe('Love it!');
  });
});
