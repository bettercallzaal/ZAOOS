import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  makeRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_WALLET,
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

// Mock fetch at global scope
global.fetch = vi.fn();

import { DELETE, POST } from '../route';

/**
 * Build a chain that supports select→eq→await for user row fetches,
 * and update→eq→await for the update operation.
 * Also supports the direct await on the chain for Lens API fetch results.
 */
function makeChain(result: { data?: unknown; error?: unknown; count?: number }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const chainable = ['select', 'update', 'eq', 'from'];
  for (const m of chainable) {
    chain[m] = vi.fn(() => chain);
  }
  chain.single = vi.fn().mockResolvedValue(result);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('POST /api/platforms/lens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(
      mockAuthenticatedSession({ fid: 123, walletAddress: VALID_WALLET }),
    );
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST(makePostRequest('/api/platforms/lens', { wallet: VALID_WALLET }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid JSON', async () => {
    const req = makeRequest('/api/platforms/lens', { method: 'POST', body: '{invalid json}' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid JSON');
  });

  it('returns 200 with no Lens profile found when user has no wallets', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ data: { accountsAvailable: { items: [] } } })),
    );

    const res = await POST(makePostRequest('/api/platforms/lens', {}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.hasProfile).toBe(false);
    expect(body.handle).toBeNull();
    expect(body.walletsChecked).toBe(1); // session.walletAddress
  });

  it('finds a Lens profile with localName', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: {
          primary_wallet: null,
          custody_address: null,
          verified_addresses: null,
        },
        error: null,
      }),
    );

    const lensResponse = {
      data: {
        accountsAvailable: {
          items: [
            {
              account: {
                address: VALID_WALLET,
                username: { localName: 'alice', value: 'alice.lens' },
                metadata: { name: 'Alice' },
              },
            },
          ],
        },
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify(lensResponse)),
    );

    const res = await POST(makePostRequest('/api/platforms/lens', {}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.hasProfile).toBe(true);
    expect(body.handle).toBe('alice');
    expect(body.accountAddress).toBe(VALID_WALLET);
  });

  it('falls back to username.value when localName is missing', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: {
          primary_wallet: null,
          custody_address: null,
          verified_addresses: null,
        },
        error: null,
      }),
    );

    const lensResponse = {
      data: {
        accountsAvailable: {
          items: [
            {
              account: {
                address: VALID_WALLET,
                username: { localName: null, value: 'alice.lens' },
                metadata: { name: null },
              },
            },
          ],
        },
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify(lensResponse)),
    );

    const res = await POST(makePostRequest('/api/platforms/lens', {}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.handle).toBe('alice.lens');
  });

  it('falls back to metadata.name when username is missing', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: {
          primary_wallet: null,
          custody_address: null,
          verified_addresses: null,
        },
        error: null,
      }),
    );

    const lensResponse = {
      data: {
        accountsAvailable: {
          items: [
            {
              account: {
                address: VALID_WALLET,
                username: { localName: null, value: null },
                metadata: { name: 'Alice Profile' },
              },
            },
          ],
        },
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify(lensResponse)),
    );

    const res = await POST(makePostRequest('/api/platforms/lens', {}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.handle).toBe('Alice Profile');
  });

  it('uses short address format when no name is available', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: {
          primary_wallet: null,
          custody_address: null,
          verified_addresses: null,
        },
        error: null,
      }),
    );

    const lensResponse = {
      data: {
        accountsAvailable: {
          items: [
            {
              account: {
                address: VALID_WALLET,
                username: { localName: null, value: null },
                metadata: { name: null },
              },
            },
          ],
        },
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify(lensResponse)),
    );

    const res = await POST(makePostRequest('/api/platforms/lens', {}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.handle).toMatch(/^@0x1234\.\.\./);
  });

  it('stores valid access and refresh tokens', async () => {
    const chain = makeChain({
      data: {
        primary_wallet: null,
        custody_address: null,
        verified_addresses: null,
      },
      error: null,
    });

    mockFrom.mockReturnValue(chain);

    const lensResponse = {
      data: {
        accountsAvailable: {
          items: [
            {
              account: {
                address: VALID_WALLET,
                username: { localName: 'alice', value: null },
                metadata: { name: null },
              },
            },
          ],
        },
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify(lensResponse)),
    );

    const res = await POST(
      makePostRequest('/api/platforms/lens', {
        wallet: VALID_WALLET,
        accessToken: `valid_token_with_good_length_${'x'.repeat(40)}`,
        refreshToken: `refresh_token_with_good_length_${'x'.repeat(40)}`,
      }),
    );

    expect(res.status).toBe(200);
    expect(chain.update).toHaveBeenCalledWith({
      lens_profile_id: 'alice',
      lens_access_token: `valid_token_with_good_length_${'x'.repeat(40)}`,
      lens_refresh_token: `refresh_token_with_good_length_${'x'.repeat(40)}`,
    });
  });

  it('rejects access tokens that are too short', async () => {
    const chain = makeChain({
      data: {
        primary_wallet: null,
        custody_address: null,
        verified_addresses: null,
      },
      error: null,
    });

    mockFrom.mockReturnValue(chain);

    const lensResponse = {
      data: {
        accountsAvailable: {
          items: [
            {
              account: {
                address: VALID_WALLET,
                username: { localName: 'alice', value: null },
                metadata: { name: null },
              },
            },
          ],
        },
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify(lensResponse)),
    );

    const res = await POST(
      makePostRequest('/api/platforms/lens', {
        wallet: VALID_WALLET,
        accessToken: 'short',
      }),
    );

    expect(res.status).toBe(200);
    // Token too short, should not be stored
    expect(chain.update).toHaveBeenCalledWith({
      lens_profile_id: 'alice',
    });
  });

  it('checks multiple wallets when user has verified_addresses', async () => {
    const chain = makeChain({
      data: {
        primary_wallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        custody_address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        verified_addresses: ['0xcccccccccccccccccccccccccccccccccccccccc'],
      },
      error: null,
    });

    mockFrom.mockReturnValue(chain);

    let callCount = 0;
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First wallet check: no profile
        return Promise.resolve(
          new Response(JSON.stringify({ data: { accountsAvailable: { items: [] } } })),
        );
      }
      // Later wallet: found profile
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              accountsAvailable: {
                items: [
                  {
                    account: {
                      address: '0xcccccccccccccccccccccccccccccccccccccccc',
                      username: { localName: 'charlie', value: null },
                      metadata: { name: null },
                    },
                  },
                ],
              },
            },
          }),
        ),
      );
    });

    const res = await POST(makePostRequest('/api/platforms/lens', {}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.walletsChecked).toBe(4); // session wallet + primary + custody + 1 verified
    expect(body.handle).toBe('charlie');
  });

  it('skips invalid addresses in verified_addresses array', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: {
          primary_wallet: null,
          custody_address: null,
          verified_addresses: ['not-an-address', '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'],
        },
        error: null,
      }),
    );

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ data: { accountsAvailable: { items: [] } } })),
    );

    const res = await POST(makePostRequest('/api/platforms/lens', {}));
    expect(res.status).toBe(200);
    const body = await res.json();
    // Only valid addresses + session wallet
    expect(body.walletsChecked).toBe(2);
  });

  it('returns 500 when supabase user query errors', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db connection failed') }));

    const res = await POST(makePostRequest('/api/platforms/lens', {}));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to check Lens profile');
  });

  it('handles Lens API errors gracefully', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: {
          primary_wallet: null,
          custody_address: null,
          verified_addresses: null,
        },
        error: null,
      }),
    );

    const lensError = {
      errors: [{ message: 'Invalid address' }],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify(lensError)),
    );

    const res = await POST(makePostRequest('/api/platforms/lens', {}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hasProfile).toBe(false);
  });
});

describe('DELETE /api/platforms/lens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await DELETE();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('clears lens profile and tokens on success', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);

    const res = await DELETE();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(chain.update).toHaveBeenCalledWith({
      lens_profile_id: null,
      lens_access_token: null,
      lens_refresh_token: null,
    });
    expect(chain.eq).toHaveBeenCalledWith('fid', 123);
  });
});
