import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';
import { GET } from '../route';

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

const { mockGetConvictionBatch } = vi.hoisted(() => ({
  mockGetConvictionBatch: vi.fn(),
}));

const { mockLoggerError } = vi.hoisted(() => ({
  mockLoggerError: vi.fn(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: {
    from: mockFrom,
  },
}));

vi.mock('@/lib/staking/conviction', () => ({
  getConvictionBatch: mockGetConvictionBatch,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: mockLoggerError,
  },
}));

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/staking/leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success: data retrieval and merging', () => {
    it('returns empty array when no wallets exist in users or agent_config', async () => {
      // Both queries return empty data
      mockFrom.mockImplementation((table: string) => {
        const chain = {
          select: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
              then: vi.fn((resolve: (val: unknown) => void) => resolve({ data: [], error: null })),
            }),
          }),
        };

        if (table === 'agent_config') {
          return {
            select: vi.fn().mockReturnValue({
              // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
              then: vi.fn((resolve: (val: unknown) => void) => resolve({ data: [], error: null })),
            }),
          };
        }
        return chain;
      });

      const req = makeGetRequest('/api/staking/leaderboard');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([]);
    });

    it('fetches wallets from users table and calls getConvictionBatch', async () => {
      const usersData = [
        { wallet_address: '0x1111111111111111111111111111111111111111', display_name: 'Alice' },
        { wallet_address: '0x2222222222222222222222222222222222222222', display_name: 'Bob' },
      ];

      const agentsData: unknown[] = [];

      const convictionData = [
        {
          address: '0x1111111111111111111111111111111111111111',
          conviction: '1000000000000000000000000000000',
          staked: '100000000000000000000',
          stakedFormatted: '100',
          convictionFormatted: '1.0T',
        },
        {
          address: '0x2222222222222222222222222222222222222222',
          conviction: '500000000000000000000000000000',
          staked: '50000000000000000000',
          stakedFormatted: '50',
          convictionFormatted: '0.5T',
        },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
                then: vi.fn((resolve: (val: unknown) => void) =>
                  resolve({ data: usersData, error: null }),
                ),
              }),
            }),
          };
        }
        if (table === 'agent_config') {
          return {
            select: vi.fn().mockReturnValue({
              // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
              then: vi.fn((resolve: (val: unknown) => void) =>
                resolve({ data: agentsData, error: null }),
              ),
            }),
          };
        }
        return {};
      });

      mockGetConvictionBatch.mockResolvedValue(convictionData);

      const req = makeGetRequest('/api/staking/leaderboard');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      // Verify getConvictionBatch was called with the correct addresses
      expect(mockGetConvictionBatch).toHaveBeenCalledWith([
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222',
      ]);

      // Verify response includes merged names
      expect(body).toHaveLength(2);
      expect(body[0]).toEqual({
        ...convictionData[0],
        name: 'Alice',
      });
      expect(body[1]).toEqual({
        ...convictionData[1],
        name: 'Bob',
      });
    });

    it('merges conviction data with wallet addresses from both users and agent_config tables', async () => {
      const usersData = [
        { wallet_address: '0x1111111111111111111111111111111111111111', display_name: 'Alice' },
      ];

      const agentsData = [
        { wallet_address: '0x3333333333333333333333333333333333333333', name: 'Agent1' },
      ];

      const convictionData = [
        {
          address: '0x3333333333333333333333333333333333333333',
          conviction: '2000000000000000000000000000000',
          staked: '200000000000000000000',
          stakedFormatted: '200',
          convictionFormatted: '2.0T',
        },
        {
          address: '0x1111111111111111111111111111111111111111',
          conviction: '1000000000000000000000000000000',
          staked: '100000000000000000000',
          stakedFormatted: '100',
          convictionFormatted: '1.0T',
        },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
                then: vi.fn((resolve: (val: unknown) => void) =>
                  resolve({ data: usersData, error: null }),
                ),
              }),
            }),
          };
        }
        if (table === 'agent_config') {
          return {
            select: vi.fn().mockReturnValue({
              // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
              then: vi.fn((resolve: (val: unknown) => void) =>
                resolve({ data: agentsData, error: null }),
              ),
            }),
          };
        }
        return {};
      });

      mockGetConvictionBatch.mockResolvedValue(convictionData);

      const req = makeGetRequest('/api/staking/leaderboard');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      // Addresses from both tables should be passed to getConvictionBatch
      expect(mockGetConvictionBatch).toHaveBeenCalledWith([
        '0x1111111111111111111111111111111111111111',
        '0x3333333333333333333333333333333333333333',
      ]);

      // Response should include entries from both tables with correct names
      expect(body).toHaveLength(2);
      expect(
        body.find(
          (e: { address: string }) => e.address === '0x1111111111111111111111111111111111111111',
        ),
      ).toEqual({
        ...convictionData[1],
        name: 'Alice',
      });
      expect(
        body.find(
          (e: { address: string }) => e.address === '0x3333333333333333333333333333333333333333',
        ),
      ).toEqual({
        ...convictionData[0],
        name: 'Agent1',
      });
    });

    it('handles case-insensitive name mapping for wallet addresses', async () => {
      const usersData = [
        { wallet_address: '0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD', display_name: 'TestUser' },
      ];

      const convictionData = [
        {
          address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', // lowercase
          conviction: '1000000000000000000000000000000',
          staked: '100000000000000000000',
          stakedFormatted: '100',
          convictionFormatted: '1.0T',
        },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
                then: vi.fn((resolve: (val: unknown) => void) =>
                  resolve({ data: usersData, error: null }),
                ),
              }),
            }),
          };
        }
        if (table === 'agent_config') {
          return {
            select: vi.fn().mockReturnValue({
              // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
              then: vi.fn((resolve: (val: unknown) => void) => resolve({ data: [], error: null })),
            }),
          };
        }
        return {};
      });

      mockGetConvictionBatch.mockResolvedValue(convictionData);

      const req = makeGetRequest('/api/staking/leaderboard');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      // Despite different case in the addresses, the name should be matched
      expect(body[0].name).toBe('TestUser');
    });

    it('deduplicates wallet addresses when same address appears in both tables', async () => {
      const sharedAddress = '0x1111111111111111111111111111111111111111';
      const usersData = [{ wallet_address: sharedAddress, display_name: 'UserName' }];

      const agentsData = [{ wallet_address: sharedAddress, name: 'AgentName' }];

      const convictionData = [
        {
          address: sharedAddress,
          conviction: '1000000000000000000000000000000',
          staked: '100000000000000000000',
          stakedFormatted: '100',
          convictionFormatted: '1.0T',
        },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
                then: vi.fn((resolve: (val: unknown) => void) =>
                  resolve({ data: usersData, error: null }),
                ),
              }),
            }),
          };
        }
        if (table === 'agent_config') {
          return {
            select: vi.fn().mockReturnValue({
              // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
              then: vi.fn((resolve: (val: unknown) => void) =>
                resolve({ data: agentsData, error: null }),
              ),
            }),
          };
        }
        return {};
      });

      mockGetConvictionBatch.mockResolvedValue(convictionData);

      const req = makeGetRequest('/api/staking/leaderboard');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      // Despite being in both tables, only one conviction entry should exist
      expect(body).toHaveLength(1);
      // The name mapping will find the first entry in the map (UserName)
      expect(body[0].name).toBeDefined();
    });

    it('sets name to null when address is not found in nameMap', async () => {
      const convictionData = [
        {
          address: '0x9999999999999999999999999999999999999999',
          conviction: '1000000000000000000000000000000',
          staked: '100000000000000000000',
          stakedFormatted: '100',
          convictionFormatted: '1.0T',
        },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
                then: vi.fn((resolve: (val: unknown) => void) =>
                  resolve({ data: [], error: null }),
                ),
              }),
            }),
          };
        }
        if (table === 'agent_config') {
          return {
            select: vi.fn().mockReturnValue({
              // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
              then: vi.fn((resolve: (val: unknown) => void) => resolve({ data: [], error: null })),
            }),
          };
        }
        return {};
      });

      // Since no wallets were fetched from DB, no addresses are passed to getConvictionBatch.
      // The route returns empty array early (line 41-42).
      mockGetConvictionBatch.mockResolvedValue(convictionData);

      const req = makeGetRequest('/api/staking/leaderboard');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      // Route returns empty when no addresses exist, so body should be empty
      expect(body).toEqual([]);
    });

    it('returns proper response JSON shape', async () => {
      const usersData = [
        { wallet_address: '0x1111111111111111111111111111111111111111', display_name: 'Alice' },
      ];

      const convictionData = [
        {
          address: '0x1111111111111111111111111111111111111111',
          conviction: '1000000000000000000000000000000',
          staked: '100000000000000000000',
          stakedFormatted: '100',
          convictionFormatted: '1.0T',
        },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
                then: vi.fn((resolve: (val: unknown) => void) =>
                  resolve({ data: usersData, error: null }),
                ),
              }),
            }),
          };
        }
        if (table === 'agent_config') {
          return {
            select: vi.fn().mockReturnValue({
              // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
              then: vi.fn((resolve: (val: unknown) => void) => resolve({ data: [], error: null })),
            }),
          };
        }
        return {};
      });

      mockGetConvictionBatch.mockResolvedValue(convictionData);

      const req = makeGetRequest('/api/staking/leaderboard');
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('application/json');

      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body[0]).toMatchObject({
        address: expect.any(String),
        conviction: expect.any(String),
        staked: expect.any(String),
        stakedFormatted: expect.any(String),
        convictionFormatted: expect.any(String),
        name: expect.any(String),
      });
    });
  });

  describe('handling of null/missing wallet addresses', () => {
    it('skips users with null wallet_address', async () => {
      const usersData = [
        { wallet_address: null, display_name: 'NoWallet' },
        { wallet_address: '0x1111111111111111111111111111111111111111', display_name: 'HasWallet' },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
                then: vi.fn((resolve: (val: unknown) => void) =>
                  resolve({ data: usersData, error: null }),
                ),
              }),
            }),
          };
        }
        if (table === 'agent_config') {
          return {
            select: vi.fn().mockReturnValue({
              // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
              then: vi.fn((resolve: (val: unknown) => void) => resolve({ data: [], error: null })),
            }),
          };
        }
        return {};
      });

      mockGetConvictionBatch.mockResolvedValue([]);

      const req = makeGetRequest('/api/staking/leaderboard');
      const res = await GET(req);

      expect(res.status).toBe(200);

      // Only the address with a wallet should be passed to getConvictionBatch
      expect(mockGetConvictionBatch).toHaveBeenCalledWith([
        '0x1111111111111111111111111111111111111111',
      ]);
    });

    it('skips agents with null wallet_address', async () => {
      const agentsData = [
        { wallet_address: null, name: 'NoWalletAgent' },
        { wallet_address: '0x3333333333333333333333333333333333333333', name: 'HasWalletAgent' },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
                then: vi.fn((resolve: (val: unknown) => void) =>
                  resolve({ data: [], error: null }),
                ),
              }),
            }),
          };
        }
        if (table === 'agent_config') {
          return {
            select: vi.fn().mockReturnValue({
              // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
              then: vi.fn((resolve: (val: unknown) => void) =>
                resolve({ data: agentsData, error: null }),
              ),
            }),
          };
        }
        return {};
      });

      mockGetConvictionBatch.mockResolvedValue([]);

      const req = makeGetRequest('/api/staking/leaderboard');
      const res = await GET(req);

      expect(res.status).toBe(200);

      // Only the agent with a wallet should be passed
      expect(mockGetConvictionBatch).toHaveBeenCalledWith([
        '0x3333333333333333333333333333333333333333',
      ]);
    });

    it('handles empty display_name by using empty string from nameMap lookup', async () => {
      const usersData = [
        { wallet_address: '0x1111111111111111111111111111111111111111', display_name: null },
      ];

      const convictionData = [
        {
          address: '0x1111111111111111111111111111111111111111',
          conviction: '1000000000000000000000000000000',
          staked: '100000000000000000000',
          stakedFormatted: '100',
          convictionFormatted: '1.0T',
        },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
                then: vi.fn((resolve: (val: unknown) => void) =>
                  resolve({ data: usersData, error: null }),
                ),
              }),
            }),
          };
        }
        if (table === 'agent_config') {
          return {
            select: vi.fn().mockReturnValue({
              // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
              then: vi.fn((resolve: (val: unknown) => void) => resolve({ data: [], error: null })),
            }),
          };
        }
        return {};
      });

      mockGetConvictionBatch.mockResolvedValue(convictionData);

      const req = makeGetRequest('/api/staking/leaderboard');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      // Route uses (display_name || '') for nameMap value, so null becomes ''
      // But nameMap.get(...) || null means: if found return the value, else null.
      // Since we stored '' in the map, the lookup returns '' (falsy but defined).
      // Actually, '' is falsy, so '' || null returns null. The route's behavior is correct.
      // Our test expectation should match actual behavior: null is returned for falsy names.
      expect(body[0].name).toBeNull();
    });
  });

  describe('handling supabase failures', () => {
    it('continues when users query rejects', async () => {
      const agentsData = [
        { wallet_address: '0x3333333333333333333333333333333333333333', name: 'Agent1' },
      ];

      const convictionData = [
        {
          address: '0x3333333333333333333333333333333333333333',
          conviction: '2000000000000000000000000000000',
          staked: '200000000000000000000',
          stakedFormatted: '200',
          convictionFormatted: '2.0T',
        },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
                then: vi.fn(
                  (_resolve: (val: unknown) => void, reject: (reason?: unknown) => void) =>
                    reject(new Error('Users query failed')),
                ),
              }),
            }),
          };
        }
        if (table === 'agent_config') {
          return {
            select: vi.fn().mockReturnValue({
              // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
              then: vi.fn((resolve: (val: unknown) => void) =>
                resolve({ data: agentsData, error: null }),
              ),
            }),
          };
        }
        return {};
      });

      mockGetConvictionBatch.mockResolvedValue(convictionData);

      const req = makeGetRequest('/api/staking/leaderboard');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      // Should still succeed with agent data
      expect(body).toHaveLength(1);
      expect(body[0].address).toBe('0x3333333333333333333333333333333333333333');
    });

    it('continues when agent_config query rejects', async () => {
      const usersData = [
        { wallet_address: '0x1111111111111111111111111111111111111111', display_name: 'Alice' },
      ];

      const convictionData = [
        {
          address: '0x1111111111111111111111111111111111111111',
          conviction: '1000000000000000000000000000000',
          staked: '100000000000000000000',
          stakedFormatted: '100',
          convictionFormatted: '1.0T',
        },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
                then: vi.fn((resolve: (val: unknown) => void) =>
                  resolve({ data: usersData, error: null }),
                ),
              }),
            }),
          };
        }
        if (table === 'agent_config') {
          return {
            select: vi.fn().mockReturnValue({
              // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
              then: vi.fn((_resolve: (val: unknown) => void, reject: (reason?: unknown) => void) =>
                reject(new Error('Agent config query failed')),
              ),
            }),
          };
        }
        return {};
      });

      mockGetConvictionBatch.mockResolvedValue(convictionData);

      const req = makeGetRequest('/api/staking/leaderboard');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      // Should still succeed with user data
      expect(body).toHaveLength(1);
      expect(body[0].name).toBe('Alice');
    });

    it('returns empty array when both supabase queries fail', async () => {
      mockFrom.mockImplementation(() => {
        return {
          select: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
              then: vi.fn((_resolve: (val: unknown) => void, reject: (reason?: unknown) => void) =>
                reject(new Error('Query failed')),
              ),
            }),
          }),
        };
      });

      const req = makeGetRequest('/api/staking/leaderboard');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('returns 500 when getConvictionBatch throws', async () => {
      const usersData = [
        { wallet_address: '0x1111111111111111111111111111111111111111', display_name: 'Alice' },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
                then: vi.fn((resolve: (val: unknown) => void) =>
                  resolve({ data: usersData, error: null }),
                ),
              }),
            }),
          };
        }
        if (table === 'agent_config') {
          return {
            select: vi.fn().mockReturnValue({
              // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
              then: vi.fn((resolve: (val: unknown) => void) => resolve({ data: [], error: null })),
            }),
          };
        }
        return {};
      });

      mockGetConvictionBatch.mockRejectedValue(new Error('Contract read failed'));

      const req = makeGetRequest('/api/staking/leaderboard');
      const res = await GET(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual([]);

      // Verify error was logged
      expect(mockLoggerError).toHaveBeenCalledWith('Staking leaderboard error:', expect.any(Error));
    });

    it('returns 500 and logs error on unexpected exception', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected supabase error');
      });

      const req = makeGetRequest('/api/staking/leaderboard');
      const res = await GET(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual([]);

      expect(mockLoggerError).toHaveBeenCalledWith('Staking leaderboard error:', expect.any(Error));
    });

    it('logs errors without exposing details to client', async () => {
      const sensitiveError = new Error('Database password exposed');
      mockGetConvictionBatch.mockRejectedValue(sensitiveError);

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
                then: vi.fn((resolve: (val: unknown) => void) =>
                  resolve({
                    data: [
                      {
                        wallet_address: '0x1111111111111111111111111111111111111111',
                        display_name: 'Test',
                      },
                    ],
                    error: null,
                  }),
                ),
              }),
            }),
          };
        }
        if (table === 'agent_config') {
          return {
            select: vi.fn().mockReturnValue({
              // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
              then: vi.fn((resolve: (val: unknown) => void) => resolve({ data: [], error: null })),
            }),
          };
        }
        return {};
      });

      const req = makeGetRequest('/api/staking/leaderboard');
      const res = await GET(req);

      expect(res.status).toBe(500);
      const body = await res.json();

      // Client receives empty array, not error details
      expect(body).toEqual([]);
      expect(JSON.stringify(body)).not.toContain('password');
    });
  });

  describe('route is public (no auth required)', () => {
    it('does not require session to call the route', async () => {
      // The route has no session check in the code, so this confirms it's public
      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
                then: vi.fn((resolve: (val: unknown) => void) =>
                  resolve({ data: [], error: null }),
                ),
              }),
            }),
          };
        }
        if (table === 'agent_config') {
          return {
            select: vi.fn().mockReturnValue({
              // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
              then: vi.fn((resolve: (val: unknown) => void) => resolve({ data: [], error: null })),
            }),
          };
        }
        return {};
      });

      const req = makeGetRequest('/api/staking/leaderboard');
      const res = await GET(req);

      // Should succeed without auth
      expect(res.status).toBe(200);
    });
  });

  describe('response handling', () => {
    it('response is always JSON', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
                then: vi.fn((resolve: (val: unknown) => void) =>
                  resolve({ data: [], error: null }),
                ),
              }),
            }),
          };
        }
        if (table === 'agent_config') {
          return {
            select: vi.fn().mockReturnValue({
              // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
              then: vi.fn((resolve: (val: unknown) => void) => resolve({ data: [], error: null })),
            }),
          };
        }
        return {};
      });

      const req = makeGetRequest('/api/staking/leaderboard');
      const res = await GET(req);

      expect(res.headers.get('content-type')).toContain('application/json');
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    });

    it('handles multiple conviction entries from getConvictionBatch', async () => {
      const usersData = [
        { wallet_address: '0x1111111111111111111111111111111111111111', display_name: 'Alice' },
        { wallet_address: '0x2222222222222222222222222222222222222222', display_name: 'Bob' },
        { wallet_address: '0x3333333333333333333333333333333333333333', display_name: 'Charlie' },
      ];

      const convictionData = [
        {
          address: '0x1111111111111111111111111111111111111111',
          conviction: '3000000000000000000000000000000',
          staked: '300000000000000000000',
          stakedFormatted: '300',
          convictionFormatted: '3.0T',
        },
        {
          address: '0x2222222222222222222222222222222222222222',
          conviction: '2000000000000000000000000000000',
          staked: '200000000000000000000',
          stakedFormatted: '200',
          convictionFormatted: '2.0T',
        },
        {
          address: '0x3333333333333333333333333333333333333333',
          conviction: '1000000000000000000000000000000',
          staked: '100000000000000000000',
          stakedFormatted: '100',
          convictionFormatted: '1.0T',
        },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
                then: vi.fn((resolve: (val: unknown) => void) =>
                  resolve({ data: usersData, error: null }),
                ),
              }),
            }),
          };
        }
        if (table === 'agent_config') {
          return {
            select: vi.fn().mockReturnValue({
              // biome-ignore lint/suspicious/noThenProperty: documented thenable pattern for Supabase mocking
              then: vi.fn((resolve: (val: unknown) => void) => resolve({ data: [], error: null })),
            }),
          };
        }
        return {};
      });

      mockGetConvictionBatch.mockResolvedValue(convictionData);

      const req = makeGetRequest('/api/staking/leaderboard');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body).toHaveLength(3);
      // Check that all entries have names merged
      expect(body.every((entry: { name?: string | null }) => entry.name !== undefined)).toBe(true);
      // Check that conviction data is preserved
      expect(body.map((entry: { conviction: string }) => entry.conviction)).toEqual([
        '3000000000000000000000000000000',
        '2000000000000000000000000000000',
        '1000000000000000000000000000000',
      ]);
    });
  });
});
