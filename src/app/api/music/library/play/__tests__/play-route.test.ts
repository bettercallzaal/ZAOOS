import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  makePostRequest,
  mockAuthenticatedSession,
  VALID_UUID,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockIncrementPlayCount } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockIncrementPlayCount: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/music/library', () => ({
  incrementPlayCount: (...args: unknown[]) => mockIncrementPlayCount(...args),
}));

import { POST } from '../route';

describe('POST /api/music/library/play', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no session exists', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const req = makePostRequest('/api/music/library/play', { songId: VALID_UUID });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 when body is invalid JSON', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    // Passing a non-object body that won't parse as valid schema
    const req = makePostRequest('/api/music/library/play', 'not-json-object');
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Invalid input' });
  });

  it('returns 400 when songId is not a UUID', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const req = makePostRequest('/api/music/library/play', { songId: 'not-a-uuid' });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Invalid input' });
  });

  it('calls incrementPlayCount and returns success for valid UUID', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockIncrementPlayCount.mockResolvedValue(undefined);

    const req = makePostRequest('/api/music/library/play', { songId: VALID_UUID });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(mockIncrementPlayCount).toHaveBeenCalledWith(VALID_UUID);
    expect(mockIncrementPlayCount).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when incrementPlayCount throws', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockIncrementPlayCount.mockRejectedValue(new Error('DB error'));

    const req = makePostRequest('/api/music/library/play', { songId: VALID_UUID });
    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Failed' });
  });
});
