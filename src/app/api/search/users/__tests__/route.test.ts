// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockSearchUsers = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/farcaster/neynar', () => ({ searchUsers: mockSearchUsers }));

import { GET } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 1, username: 'zabal' };
const MOCK_NEYNAR_USERS = [
  { fid: 10, username: 'alice', display_name: 'Alice', pfp_url: 'https://example.com/a.jpg' },
];

describe('GET /api/search/users', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makeGetRequest('/api/search/users', { q: 'alice' });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns empty users when q is absent', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makeGetRequest('/api/search/users');
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.users).toEqual([]);
  });

  it('returns mapped users on successful search', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockSearchUsers.mockResolvedValue({ result: { users: MOCK_NEYNAR_USERS } });
    const req = makeGetRequest('/api/search/users', { q: 'alice' });
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.users).toHaveLength(1);
    expect(body.users[0].username).toBe('alice');
  });

  it('returns empty users when searchUsers throws', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockSearchUsers.mockRejectedValue(new Error('Neynar search failed'));
    const req = makeGetRequest('/api/search/users', { q: 'fail' });
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.users).toEqual([]);
  });
});
