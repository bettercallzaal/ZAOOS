// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockIncrementPlayCount = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/music/library', () => ({ incrementPlayCount: mockIncrementPlayCount }));

import { POST } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 1 };
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('POST /api/music/library/play', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makePostRequest('/api/music/library/play', { songId: VALID_UUID });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for a non-UUID songId', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/music/library/play', { songId: 'not-a-uuid' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns success:true when incrementPlayCount resolves', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockIncrementPlayCount.mockResolvedValue(undefined);
    const req = makePostRequest('/api/music/library/play', { songId: VALID_UUID });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockIncrementPlayCount).toHaveBeenCalledWith(VALID_UUID);
  });

  it('returns 500 when incrementPlayCount throws', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockIncrementPlayCount.mockRejectedValue(new Error('DB error'));
    const req = makePostRequest('/api/music/library/play', { songId: VALID_UUID });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
