import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { mockGetSessionData, mockSearchUsers } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockSearchUsers: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  searchUsers: (...args: unknown[]) => mockSearchUsers(...args),
}));

// ---------------------------------------------------------------------------
// Import handler under test
// ---------------------------------------------------------------------------

import { GET } from '../route';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/search/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when there is no session', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const res = await GET(makeGetRequest('/api/search/users', { q: 'test' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(mockSearchUsers).not.toHaveBeenCalled();
  });

  it('returns empty users array when query is missing', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const res = await GET(makeGetRequest('/api/search/users'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ users: [] });
    expect(mockSearchUsers).not.toHaveBeenCalled();
  });

  it('returns empty users array when query is blank', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const res = await GET(makeGetRequest('/api/search/users', { q: '   ' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ users: [] });
    expect(mockSearchUsers).not.toHaveBeenCalled();
  });

  it('returns mapped users for a valid query', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });
    mockSearchUsers.mockResolvedValue({
      result: {
        users: [
          {
            fid: 1,
            username: 'alice',
            display_name: 'Alice',
            pfp_url: 'https://example.com/alice.png',
            extra_field: 'should be stripped',
          },
          {
            fid: 2,
            username: 'bob',
            display_name: 'Bob',
            pfp_url: 'https://example.com/bob.png',
            custody_address: '0x123',
          },
        ],
      },
    });

    const res = await GET(makeGetRequest('/api/search/users', { q: 'al' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.users).toEqual([
      { fid: 1, username: 'alice', display_name: 'Alice', pfp_url: 'https://example.com/alice.png' },
      { fid: 2, username: 'bob', display_name: 'Bob', pfp_url: 'https://example.com/bob.png' },
    ]);
    expect(mockSearchUsers).toHaveBeenCalledWith('al', 6);
  });

  it('returns empty users array when searchUsers throws', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });
    mockSearchUsers.mockRejectedValue(new Error('Neynar API failure'));

    const res = await GET(makeGetRequest('/api/search/users', { q: 'test' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ users: [] });
  });

  it('returns empty users array when result.users is undefined', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });
    mockSearchUsers.mockResolvedValue({ result: {} });

    const res = await GET(makeGetRequest('/api/search/users', { q: 'test' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ users: [] });
  });
});
