import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

/**
 * Build a Supabase query-chain mock for community_profiles lookup.
 * Supports chaining (.select, .eq, .maybeSingle) and resolves on await.
 */
function profileChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  const chainableMethods = ['select', 'eq', 'maybeSingle', 'order', 'limit', 'not', 'is'];

  for (const method of chainableMethods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal thenable for await
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((resolve?: (val: unknown) => void) => {
    if (resolve) resolve(result);
    return Promise.resolve(result);
  });

  return chain;
}

describe('GET /api/directory/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await GET(makeRequest('/api/directory/test'), {
        params: Promise.resolve({ slug: 'test-slug' }),
      });
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('proceeds when authenticated with valid session', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

      const profile = {
        id: 'p1',
        slug: 'test-slug',
        name: 'Test User',
        fid: 123,
        bio: 'A test profile',
        created_at: '2024-01-01T00:00:00Z',
      };

      const profileMock = profileChain({ data: profile, error: null });
      mockFrom.mockReturnValue(profileMock);

      const res = await GET(makeRequest('/api/directory/test'), {
        params: Promise.resolve({ slug: 'test-slug' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.profile).toEqual(profile);
    });
  });

  describe('slug parameter and profile lookup', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('queries community_profiles by slug', async () => {
      const profile = {
        id: 'p1',
        slug: 'alice-dev',
        name: 'Alice Developer',
        fid: 100,
        bio: 'I build things',
      };

      const chain = profileChain({ data: profile, error: null });
      mockFrom.mockReturnValue(chain);

      await GET(makeRequest('/api/directory/alice-dev'), {
        params: Promise.resolve({ slug: 'alice-dev' }),
      });

      expect(mockFrom).toHaveBeenCalledWith('community_profiles');
      expect(chain.select).toHaveBeenCalledWith('*');
      expect(chain.eq).toHaveBeenCalledWith('slug', 'alice-dev');
      expect(chain.maybeSingle).toHaveBeenCalled();
    });

    it('returns 404 when profile not found', async () => {
      const chain = profileChain({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeRequest('/api/directory/nonexistent'), {
        params: Promise.resolve({ slug: 'nonexistent-slug' }),
      });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe('Not found');
    });

    it('returns found profile with exact slug match', async () => {
      const profile = {
        id: 'p123',
        slug: 'bob-artist',
        name: 'Bob Artist',
        fid: 200,
        bio: 'Creative person',
        category: 'artist',
      };

      const chain = profileChain({ data: profile, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeRequest('/api/directory/bob-artist'), {
        params: Promise.resolve({ slug: 'bob-artist' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.profile).toEqual(profile);
      expect(body.profile.slug).toBe('bob-artist');
    });
  });

  describe('WaveWarZ stats enrichment', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('enriches profile with WaveWarZ stats when fid exists and solana_wallet is linked', async () => {
      const profile = {
        id: 'p1',
        slug: 'musician-pro',
        name: 'Musician Pro',
        fid: 123,
        bio: 'Music artist',
      };

      const userData = {
        fid: 123,
        solana_wallet: '9B5X4z6Y7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O',
      };

      const warzStats = {
        wins: 5,
        losses: 2,
        total_volume_sol: 1.5,
      };

      const profileChainMock = profileChain({ data: profile, error: null });
      const usersChainMock = profileChain({ data: userData, error: null });
      const warzChainMock = profileChain({ data: warzStats, error: null });

      const _callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'community_profiles') return profileChainMock;
        if (table === 'users') return usersChainMock;
        if (table === 'wavewarz_artists') return warzChainMock;
        throw new Error(`Unexpected table: ${table}`);
      });

      const res = await GET(makeRequest('/api/directory/musician-pro'), {
        params: Promise.resolve({ slug: 'musician-pro' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.wavewarzStats).toEqual(warzStats);
    });

    it('returns null wavewarzStats when profile has no fid', async () => {
      const profile = {
        id: 'p2',
        slug: 'no-fid-user',
        name: 'No FID User',
        fid: null,
        bio: 'User without farcaster',
      };

      const chain = profileChain({ data: profile, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeRequest('/api/directory/no-fid-user'), {
        params: Promise.resolve({ slug: 'no-fid-user' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.profile.fid).toBeNull();
      expect(body.wavewarzStats).toBeNull();
    });

    it('returns null wavewarzStats when user has no solana_wallet linked', async () => {
      const profile = {
        id: 'p3',
        slug: 'dev-no-sol',
        name: 'Dev No Sol',
        fid: 456,
        bio: 'Developer without Solana',
      };

      const userData = {
        fid: 456,
        solana_wallet: null,
      };

      const profileChainMock = profileChain({ data: profile, error: null });
      const usersChainMock = profileChain({ data: userData, error: null });

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        callCount++;
        if (table === 'community_profiles') return profileChainMock;
        if (table === 'users') return usersChainMock;
        throw new Error(`Unexpected table call ${callCount}`);
      });

      const res = await GET(makeRequest('/api/directory/dev-no-sol'), {
        params: Promise.resolve({ slug: 'dev-no-sol' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.wavewarzStats).toBeNull();
    });

    it('returns null wavewarzStats when user exists but not in wavewarz_artists', async () => {
      const profile = {
        id: 'p4',
        slug: 'user-no-warz',
        name: 'User No Warz',
        fid: 789,
        bio: 'User not in WaveWarZ',
      };

      const userData = {
        fid: 789,
        solana_wallet: '9B5X4z6Y7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O',
      };

      const profileChainMock = profileChain({ data: profile, error: null });
      const usersChainMock = profileChain({ data: userData, error: null });
      const warzChainMock = profileChain({ data: null, error: null }); // No record

      let _callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        _callCount++;
        if (table === 'community_profiles') return profileChainMock;
        if (table === 'users') return usersChainMock;
        if (table === 'wavewarz_artists') return warzChainMock;
        throw new Error(`Unexpected table: ${table}`);
      });

      const res = await GET(makeRequest('/api/directory/user-no-warz'), {
        params: Promise.resolve({ slug: 'user-no-warz' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.wavewarzStats).toBeNull();
    });

    it('queries users table with profile fid for solana_wallet', async () => {
      const profile = {
        id: 'p5',
        slug: 'check-fid-lookup',
        name: 'Check FID Lookup',
        fid: 999,
        bio: 'Testing FID lookup',
      };

      const userData = {
        fid: 999,
        solana_wallet: '9B5X4z6Y7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O',
      };

      const warzStats = {
        wins: 10,
        losses: 3,
        total_volume_sol: 5.2,
      };

      const profileChainMock = profileChain({ data: profile, error: null });
      const usersChainMock = profileChain({ data: userData, error: null });
      const warzChainMock = profileChain({ data: warzStats, error: null });

      let _callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        _callCount++;
        if (table === 'community_profiles') return profileChainMock;
        if (table === 'users') return usersChainMock;
        if (table === 'wavewarz_artists') return warzChainMock;
        throw new Error(`Unexpected table: ${table}`);
      });

      await GET(makeRequest('/api/directory/check-fid-lookup'), {
        params: Promise.resolve({ slug: 'check-fid-lookup' }),
      });

      expect(usersChainMock.eq).toHaveBeenCalledWith('fid', 999);
    });

    it('queries wavewarz_artists with solana_wallet from users lookup', async () => {
      const profile = {
        id: 'p6',
        slug: 'artist-wallet-check',
        name: 'Artist Wallet Check',
        fid: 111,
        bio: 'Artist with WaveWarZ',
      };

      const userData = {
        fid: 111,
        solana_wallet: 'SOL_WALLET_123456789ABCDEFGHIJKLMNOPQRST',
      };

      const warzStats = {
        wins: 3,
        losses: 1,
        total_volume_sol: 0.8,
      };

      const profileChainMock = profileChain({ data: profile, error: null });
      const usersChainMock = profileChain({ data: userData, error: null });
      const warzChainMock = profileChain({ data: warzStats, error: null });

      let _callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        _callCount++;
        if (table === 'community_profiles') return profileChainMock;
        if (table === 'users') return usersChainMock;
        if (table === 'wavewarz_artists') return warzChainMock;
        throw new Error(`Unexpected table: ${table}`);
      });

      await GET(makeRequest('/api/directory/artist-wallet-check'), {
        params: Promise.resolve({ slug: 'artist-wallet-check' }),
      });

      expect(warzChainMock.eq).toHaveBeenCalledWith('solana_wallet', userData.solana_wallet);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 when community_profiles query returns error', async () => {
      const chain = profileChain({ data: null, error: new Error('DB connection failed') });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeRequest('/api/directory/error-slug'), {
        params: Promise.resolve({ slug: 'error-slug' }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch profile');
    });

    it('returns 500 when users table query throws', async () => {
      const profile = {
        id: 'p7',
        slug: 'user-lookup-error',
        name: 'User Lookup Error',
        fid: 222,
        bio: 'Error on user lookup',
      };

      const profileChainMock = profileChain({ data: profile, error: null });

      let _callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        _callCount++;
        if (table === 'community_profiles') return profileChainMock;
        if (table === 'users') {
          throw new Error('Users table connection lost');
        }
        throw new Error(`Unexpected table: ${table}`);
      });

      const res = await GET(makeRequest('/api/directory/user-lookup-error'), {
        params: Promise.resolve({ slug: 'user-lookup-error' }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch profile');
    });

    it('returns 500 when wavewarz_artists query throws', async () => {
      const profile = {
        id: 'p8',
        slug: 'warz-lookup-error',
        name: 'Warz Lookup Error',
        fid: 333,
        bio: 'Error on warz lookup',
      };

      const userData = {
        fid: 333,
        solana_wallet: 'SOLANA_WALLET_ABC123',
      };

      const profileChainMock = profileChain({ data: profile, error: null });
      const usersChainMock = profileChain({ data: userData, error: null });

      let _callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        _callCount++;
        if (table === 'community_profiles') return profileChainMock;
        if (table === 'users') return usersChainMock;
        if (table === 'wavewarz_artists') {
          throw new Error('WaveWarZ table unavailable');
        }
        throw new Error(`Unexpected table: ${table}`);
      });

      const res = await GET(makeRequest('/api/directory/warz-lookup-error'), {
        params: Promise.resolve({ slug: 'warz-lookup-error' }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch profile');
    });

    it('logs errors with context', async () => {
      const { logger } = await import('@/lib/logger');

      const chain = profileChain({ data: null, error: new Error('Test error') });
      mockFrom.mockReturnValue(chain);

      await GET(makeRequest('/api/directory/logged-error'), {
        params: Promise.resolve({ slug: 'logged-error' }),
      });

      expect(logger.error).toHaveBeenCalledWith('[directory/slug] GET error:', expect.any(Error));
    });
  });

  describe('response structure', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns profile and wavewarzStats in response', async () => {
      const profile = {
        id: 'p9',
        slug: 'response-test',
        name: 'Response Test',
        fid: 444,
        bio: 'Testing response structure',
      };

      const warzStats = {
        wins: 7,
        losses: 4,
        total_volume_sol: 2.3,
      };

      const profileChainMock = profileChain({ data: profile, error: null });
      const usersChainMock = profileChain({
        data: { fid: 444, solana_wallet: 'WALLET_XYZ' },
        error: null,
      });
      const warzChainMock = profileChain({ data: warzStats, error: null });

      let _callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        _callCount++;
        if (table === 'community_profiles') return profileChainMock;
        if (table === 'users') return usersChainMock;
        if (table === 'wavewarz_artists') return warzChainMock;
        throw new Error(`Unexpected table: ${table}`);
      });

      const res = await GET(makeRequest('/api/directory/response-test'), {
        params: Promise.resolve({ slug: 'response-test' }),
      });
      const body = await res.json();

      expect(body).toHaveProperty('profile');
      expect(body).toHaveProperty('wavewarzStats');
      expect(body.profile).toEqual(profile);
      expect(body.wavewarzStats).toEqual(warzStats);
    });

    it('returns profile with null wavewarzStats when no stats available', async () => {
      const profile = {
        id: 'p10',
        slug: 'no-stats-test',
        name: 'No Stats Test',
        fid: null,
        bio: 'No WaveWarZ stats',
      };

      const chain = profileChain({ data: profile, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeRequest('/api/directory/no-stats-test'), {
        params: Promise.resolve({ slug: 'no-stats-test' }),
      });
      const body = await res.json();

      expect(body).toHaveProperty('profile');
      expect(body).toHaveProperty('wavewarzStats');
      expect(body.profile).toEqual(profile);
      expect(body.wavewarzStats).toBeNull();
    });
  });

  describe('dynamic route parameter handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('correctly resolves slug from params promise', async () => {
      const testSlug = 'dynamic-param-test';
      const profile = {
        id: 'p11',
        slug: testSlug,
        name: 'Dynamic Param Test',
        fid: 555,
        bio: 'Testing dynamic params',
      };

      const chain = profileChain({ data: profile, error: null });
      mockFrom.mockReturnValue(chain);

      await GET(makeRequest('/api/directory/test-path'), {
        params: Promise.resolve({ slug: testSlug }),
      });

      expect(chain.eq).toHaveBeenCalledWith('slug', testSlug);
    });

    it('awaits params promise before using slug', async () => {
      const profile = {
        id: 'p12',
        slug: 'awaited-slug',
        name: 'Awaited Slug',
        fid: 666,
        bio: 'Promise was awaited',
      };

      const chain = profileChain({ data: profile, error: null });
      mockFrom.mockReturnValue(chain);

      const paramsPromise = Promise.resolve({ slug: 'awaited-slug' });

      const res = await GET(makeRequest('/api/directory/test'), {
        params: paramsPromise,
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.profile.slug).toBe('awaited-slug');
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('handles profile with all null optional fields', async () => {
      const profile = {
        id: 'p13',
        slug: 'sparse-profile',
        name: 'Sparse Profile',
        fid: null,
        bio: null,
        category: null,
      };

      const chain = profileChain({ data: profile, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeRequest('/api/directory/sparse-profile'), {
        params: Promise.resolve({ slug: 'sparse-profile' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.profile).toEqual(profile);
      expect(body.wavewarzStats).toBeNull();
    });

    it('handles slug with special characters', async () => {
      const specialSlug = 'user-2024-special-chars-_';
      const profile = {
        id: 'p14',
        slug: specialSlug,
        name: 'Special Slug',
        fid: 777,
        bio: 'Special characters in slug',
      };

      const chain = profileChain({ data: profile, error: null });
      mockFrom.mockReturnValue(chain);

      await GET(makeRequest('/api/directory/special'), {
        params: Promise.resolve({ slug: specialSlug }),
      });

      expect(chain.eq).toHaveBeenCalledWith('slug', specialSlug);
    });

    it('handles WaveWarZ stats with zero values', async () => {
      const profile = {
        id: 'p15',
        slug: 'zero-warz-stats',
        name: 'Zero Warz Stats',
        fid: 888,
        bio: 'Zero WaveWarZ stats',
      };

      const userData = {
        fid: 888,
        solana_wallet: 'ZERO_WALLET',
      };

      const warzStats = {
        wins: 0,
        losses: 0,
        total_volume_sol: 0,
      };

      const profileChainMock = profileChain({ data: profile, error: null });
      const usersChainMock = profileChain({ data: userData, error: null });
      const warzChainMock = profileChain({ data: warzStats, error: null });

      let _callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        _callCount++;
        if (table === 'community_profiles') return profileChainMock;
        if (table === 'users') return usersChainMock;
        if (table === 'wavewarz_artists') return warzChainMock;
        throw new Error(`Unexpected table: ${table}`);
      });

      const res = await GET(makeRequest('/api/directory/zero-warz-stats'), {
        params: Promise.resolve({ slug: 'zero-warz-stats' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.wavewarzStats.wins).toBe(0);
      expect(body.wavewarzStats.losses).toBe(0);
      expect(body.wavewarzStats.total_volume_sol).toBe(0);
    });
  });
});
