// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
vi.mock('@/lib/notifications', () => ({ createInAppNotification: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/publish/broadcast', () => ({ broadcastToChannels: vi.fn().mockResolvedValue(undefined) }));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

const mockSingle = vi.hoisted(() => vi.fn());
const mockEq = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { POST } from '../route';

afterEach(() => vi.clearAllMocks());

const ADMIN_SESSION = { fid: 1, isAdmin: true, displayName: 'Admin', pfpUrl: '' };
const SUBMISSION_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const VALID_BODY = { submission_id: SUBMISSION_UUID, action: 'approve' };
const MOCK_SUBMISSION = {
  id: SUBMISSION_UUID,
  status: 'pending',
  submitted_by_fid: 10,
  submitted_by_display: 'ZAO',
  title: 'ZAO Anthem',
  artist: 'ZAO',
};

describe('POST /api/music/submissions/review', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makePostRequest('/api/music/submissions/review', VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 10, isAdmin: false });
    const req = makePostRequest('/api/music/submissions/review', VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid payload (missing action)', async () => {
    mockGetSessionData.mockResolvedValue(ADMIN_SESSION);
    const req = makePostRequest('/api/music/submissions/review', { submission_id: SUBMISSION_UUID });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 when submission not found', async () => {
    mockGetSessionData.mockResolvedValue(ADMIN_SESSION);
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    });
    const req = makePostRequest('/api/music/submissions/review', VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns 409 when submission is already reviewed', async () => {
    mockGetSessionData.mockResolvedValue(ADMIN_SESSION);
    mockSingle.mockResolvedValue({ data: { ...MOCK_SUBMISSION, status: 'approved' }, error: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    });
    const req = makePostRequest('/api/music/submissions/review', VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('returns success:true with status:approved on approve', async () => {
    mockGetSessionData.mockResolvedValue(ADMIN_SESSION);
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: MOCK_SUBMISSION, error: null }),
        };
      }
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    });
    const req = makePostRequest('/api/music/submissions/review', VALID_BODY);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.status).toBe('approved');
  });
});
