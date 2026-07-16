import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

const { mockGetSessionData, mockSearchFrames } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockSearchFrames: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: mockGetSessionData,
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  searchFrames: mockSearchFrames,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { GET } from '../route';

describe('GET /api/miniapp/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Auth tests (401)
  // ========================================================================

  it('returns 401 when session is not authenticated', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const res = await GET(makeGetRequest('/api/miniapp/search', { q: 'valid' }));
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  // ========================================================================
  // Query validation tests (400)
  // ========================================================================

  it('returns 400 when q parameter is missing', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const res = await GET(makeGetRequest('/api/miniapp/search'));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toEqual({ error: 'Query required' });
  });

  it('returns 400 when q parameter is empty string', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const res = await GET(makeGetRequest('/api/miniapp/search', { q: '' }));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toEqual({ error: 'Query required' });
  });

  it('returns 400 when q parameter exceeds 100 characters', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const longQuery = 'a'.repeat(101);
    const res = await GET(makeGetRequest('/api/miniapp/search', { q: longQuery }));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toEqual({ error: 'Query required' });
  });

  it('accepts q parameter at exactly 100 characters', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const query100Chars = 'a'.repeat(100);
    mockSearchFrames.mockResolvedValue({ frames: [] });

    const res = await GET(makeGetRequest('/api/miniapp/search', { q: query100Chars }));
    expect(res.status).toBe(200);
  });

  it('accepts q parameter at exactly 1 character', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    mockSearchFrames.mockResolvedValue({ frames: [] });

    const res = await GET(makeGetRequest('/api/miniapp/search', { q: 'a' }));
    expect(res.status).toBe(200);
  });

  // ========================================================================
  // Limit parameter tests
  // ========================================================================

  it('uses default limit of 20 when limit parameter is not provided', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    mockSearchFrames.mockResolvedValue({ frames: [] });

    await GET(makeGetRequest('/api/miniapp/search', { q: 'test' }));

    expect(mockSearchFrames).toHaveBeenCalledWith('test', 20);
  });

  it('uses limit parameter when provided', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    mockSearchFrames.mockResolvedValue({ frames: [] });

    await GET(makeGetRequest('/api/miniapp/search', { q: 'test', limit: '30' }));

    expect(mockSearchFrames).toHaveBeenCalledWith('test', 30);
  });

  it('caps limit at 50 when limit exceeds 50', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    mockSearchFrames.mockResolvedValue({ frames: [] });

    await GET(makeGetRequest('/api/miniapp/search', { q: 'test', limit: '100' }));

    expect(mockSearchFrames).toHaveBeenCalledWith('test', 50);
  });

  it('falls back to default limit (20) when limit is not a valid number', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    mockSearchFrames.mockResolvedValue({ frames: [] });

    await GET(makeGetRequest('/api/miniapp/search', { q: 'test', limit: 'invalid' }));

    // Regression guard: a non-numeric limit clamps to 20, never passes NaN to
    // searchFrames (String(NaN) → ?limit=NaN → Neynar 400 → 500).
    expect(mockSearchFrames).toHaveBeenCalledWith('test', 20);
  });

  it('accepts limit of 1', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    mockSearchFrames.mockResolvedValue({ frames: [] });

    await GET(makeGetRequest('/api/miniapp/search', { q: 'test', limit: '1' }));

    expect(mockSearchFrames).toHaveBeenCalledWith('test', 1);
  });

  // ========================================================================
  // Success path tests (200)
  // ========================================================================

  it('returns 200 with data from searchFrames on success', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const mockData = {
      frames: [
        { id: 'frame-1', name: 'Frame 1' },
        { id: 'frame-2', name: 'Frame 2' },
      ],
    };

    mockSearchFrames.mockResolvedValue(mockData);

    const res = await GET(makeGetRequest('/api/miniapp/search', { q: 'game' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual(mockData);
  });

  it('returns 200 with empty frames array', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    mockSearchFrames.mockResolvedValue({ frames: [] });

    const res = await GET(makeGetRequest('/api/miniapp/search', { q: 'nonexistent' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ frames: [] });
  });

  it('passes correct query to searchFrames', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    mockSearchFrames.mockResolvedValue({ frames: [] });

    const testQuery = 'special search query';
    await GET(makeGetRequest('/api/miniapp/search', { q: testQuery }));

    expect(mockSearchFrames).toHaveBeenCalledWith(testQuery, 20);
  });

  it('calls searchFrames exactly once per request', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    mockSearchFrames.mockResolvedValue({ frames: [] });

    await GET(makeGetRequest('/api/miniapp/search', { q: 'test' }));

    expect(mockSearchFrames).toHaveBeenCalledTimes(1);
  });

  // ========================================================================
  // Error handling tests (500)
  // ========================================================================

  it('returns 500 when searchFrames throws an error', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    mockSearchFrames.mockRejectedValue(new Error('Neynar API error'));

    const res = await GET(makeGetRequest('/api/miniapp/search', { q: 'test' }));
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body).toEqual({ error: 'Failed to search mini apps' });
  });

  it('returns 500 when searchFrames throws a non-Error value', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    mockSearchFrames.mockRejectedValue('Unknown error');

    const res = await GET(makeGetRequest('/api/miniapp/search', { q: 'test' }));
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body).toEqual({ error: 'Failed to search mini apps' });
  });

  it('logs error when searchFrames fails', async () => {
    const { logger } = await vi.importMock('@/lib/logger');
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const testError = new Error('Test API failure');
    mockSearchFrames.mockRejectedValue(testError);

    await GET(makeGetRequest('/api/miniapp/search', { q: 'test' }));

    expect(logger.error).toHaveBeenCalledWith('[miniapp/search] GET error:', testError);
  });

  // ========================================================================
  // Edge cases
  // ========================================================================

  it('handles query with special characters', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    mockSearchFrames.mockResolvedValue({ frames: [] });

    const specialQuery = '@#$%^&*()';
    await GET(makeGetRequest('/api/miniapp/search', { q: specialQuery }));

    expect(mockSearchFrames).toHaveBeenCalledWith(specialQuery, 20);
  });

  it('handles query with unicode characters', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    mockSearchFrames.mockResolvedValue({ frames: [] });

    const unicodeQuery = '日本語';
    await GET(makeGetRequest('/api/miniapp/search', { q: unicodeQuery }));

    expect(mockSearchFrames).toHaveBeenCalledWith(unicodeQuery, 20);
  });

  it('handles query with whitespace', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    mockSearchFrames.mockResolvedValue({ frames: [] });

    const whitespaceQuery = '   multiple   spaces   ';
    await GET(makeGetRequest('/api/miniapp/search', { q: whitespaceQuery }));

    expect(mockSearchFrames).toHaveBeenCalledWith(whitespaceQuery, 20);
  });

  it('handles limit parameter with leading zeros', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    mockSearchFrames.mockResolvedValue({ frames: [] });

    await GET(makeGetRequest('/api/miniapp/search', { q: 'test', limit: '0030' }));

    expect(mockSearchFrames).toHaveBeenCalledWith('test', 30);
  });

  it('falls back to default limit (20) for a negative limit parameter', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    mockSearchFrames.mockResolvedValue({ frames: [] });

    await GET(makeGetRequest('/api/miniapp/search', { q: 'test', limit: '-5' }));

    expect(mockSearchFrames).toHaveBeenCalledWith('test', 20);
  });

  it('returns authenticated user session data available during request', async () => {
    mockGetSessionData.mockResolvedValue({
      fid: 456,
      username: 'anotheruser',
      displayName: 'Another User',
      isAdmin: true,
    });

    mockSearchFrames.mockResolvedValue({ frames: [] });

    const res = await GET(makeGetRequest('/api/miniapp/search', { q: 'test' }));
    expect(res.status).toBe(200);

    expect(mockGetSessionData).toHaveBeenCalled();
  });
});
