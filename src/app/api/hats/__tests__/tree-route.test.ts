import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockFetchHatTree = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/hats/tree', () => ({
  fetchHatTree: () => mockFetchHatTree(),
}));

import { GET } from '@/app/api/hats/tree/route';

describe('GET /api/hats/tree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no session exists', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns tree data when authenticated', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'test' });
    const treeData = {
      treeId: 226,
      root: {
        id: '123',
        prettyId: '0x00...',
        label: 'ZAO',
        supply: 1,
        maxSupply: 1,
        isActive: true,
        children: [],
        level: 0,
        wearers: [],
      },
      totalHats: 1,
      timestamp: Date.now(),
    };
    mockFetchHatTree.mockResolvedValue(treeData);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.treeId).toBe(226);
    expect(body.root.label).toBe('ZAO');
    expect(body.totalHats).toBe(1);
  });

  it('returns 500 on tree fetch error', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'test' });
    mockFetchHatTree.mockRejectedValue(new Error('RPC error'));

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to load hat tree');
  });
});
