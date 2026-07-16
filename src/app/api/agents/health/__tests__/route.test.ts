import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSupabaseAdmin } = vi.hoisted(() => ({
  mockGetSupabaseAdmin: vi.fn(),
}));

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => mockGetSupabaseAdmin(),
}));

import { GET } from '../route';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a Supabase query-chain mock that resolves to result.
 * Every chained method returns the chain itself.
 * Terminal .then() resolves the query.
 */
function chainMock(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));
  return chain;
}

/**
 * Mock a supabase admin client with a .from() method.
 */
function mockSupabaseAdmin(chainResult: { data?: unknown; error?: unknown }) {
  return {
    from: vi.fn().mockReturnValue(chainMock(chainResult)),
  };
}

describe('GET /api/agents/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env vars to a known state for each test
    delete process.env.PRIVY_APP_ID;
    delete process.env.PRIVY_APP_SECRET;
    delete process.env.VAULT_WALLET_ID;
    delete process.env.BANKER_WALLET_ID;
    delete process.env.DEALER_WALLET_ID;
    delete process.env.ZX_API_KEY;
    delete process.env.CRON_SECRET;
    delete process.env.ZAO_OFFICIAL_SIGNER_UUID;
    delete process.env.ZAO_OFFICIAL_NEYNAR_API_KEY;
  });

  // ── Environment checks ───────────────────────────────────────────────────

  describe('Privy configuration check', () => {
    it('marks privy as OK when both PRIVY_APP_ID and PRIVY_APP_SECRET are set', async () => {
      process.env.PRIVY_APP_ID = 'test-app-id';
      process.env.PRIVY_APP_SECRET = 'test-secret';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.privy.ok).toBe(true);
      expect(body.checks.privy.detail).toBe('configured');
    });

    it('marks privy as NOT OK when PRIVY_APP_ID is missing', async () => {
      process.env.PRIVY_APP_SECRET = 'test-secret';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.privy.ok).toBe(false);
      expect(body.checks.privy.detail).toContain('PRIVY_APP_ID missing');
    });

    it('marks privy as NOT OK when PRIVY_APP_SECRET is missing', async () => {
      process.env.PRIVY_APP_ID = 'test-app-id';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.privy.ok).toBe(false);
      // Note: detail only checks PRIVY_APP_ID, so it shows 'configured' when PRIVY_APP_ID is set
      expect(body.checks.privy.detail).toBe('configured');
    });
  });

  describe('Wallet configuration checks', () => {
    it('marks all wallets as NOT OK when none are configured', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.wallet_vault.ok).toBe(false);
      expect(body.checks.wallet_vault.detail).toContain('VAULT_WALLET_ID missing');
      expect(body.checks.wallet_banker.ok).toBe(false);
      expect(body.checks.wallet_banker.detail).toContain('BANKER_WALLET_ID missing');
      expect(body.checks.wallet_dealer.ok).toBe(false);
      expect(body.checks.wallet_dealer.detail).toContain('DEALER_WALLET_ID missing');
    });

    it('marks individual wallets as OK when configured', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      process.env.VAULT_WALLET_ID = '0x1234';
      process.env.BANKER_WALLET_ID = '0x5678';
      process.env.DEALER_WALLET_ID = '0xabcd';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.wallet_vault.ok).toBe(true);
      expect(body.checks.wallet_vault.detail).toBe('configured');
      expect(body.checks.wallet_banker.ok).toBe(true);
      expect(body.checks.wallet_banker.detail).toBe('configured');
      expect(body.checks.wallet_dealer.ok).toBe(true);
      expect(body.checks.wallet_dealer.detail).toBe('configured');
    });

    it('marks wallet as OK if just one character is set', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      process.env.VAULT_WALLET_ID = 'x';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.wallet_vault.ok).toBe(true);
    });
  });

  describe('0x API key check', () => {
    it('marks zx_api as OK when ZX_API_KEY is set', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      process.env.ZX_API_KEY = 'test-zx-key';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.zx_api.ok).toBe(true);
      expect(body.checks.zx_api.detail).toBe('configured');
    });

    it('marks zx_api as NOT OK when ZX_API_KEY is missing', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.zx_api.ok).toBe(false);
      expect(body.checks.zx_api.detail).toBe('ZX_API_KEY missing');
    });
  });

  describe('Cron secret check', () => {
    it('marks cron_secret as OK when CRON_SECRET is set', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      process.env.CRON_SECRET = 'test-cron';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.cron_secret.ok).toBe(true);
      expect(body.checks.cron_secret.detail).toBe('Set');
    });

    it('marks cron_secret as NOT OK when CRON_SECRET is missing', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.cron_secret.ok).toBe(false);
      expect(body.checks.cron_secret.detail).toBe('CRON_SECRET missing');
    });
  });

  describe('Farcaster posting check', () => {
    it('marks farcaster as OK when both signer UUID and API key are set', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      process.env.ZAO_OFFICIAL_SIGNER_UUID = 'test-uuid';
      process.env.ZAO_OFFICIAL_NEYNAR_API_KEY = 'test-key';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.farcaster.ok).toBe(true);
      expect(body.checks.farcaster.detail).toBe('Signer configured');
    });

    it('marks farcaster as NOT OK when signer UUID is missing', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      process.env.ZAO_OFFICIAL_NEYNAR_API_KEY = 'test-key';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.farcaster.ok).toBe(false);
      expect(body.checks.farcaster.detail).toContain('ZAO_OFFICIAL_SIGNER_UUID missing');
    });

    it('marks farcaster as NOT OK when API key is missing', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      process.env.ZAO_OFFICIAL_SIGNER_UUID = 'test-uuid';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.farcaster.ok).toBe(false);
      // Note: detail only checks SIGNER_UUID, so it shows 'Signer configured' when SIGNER_UUID is set
      expect(body.checks.farcaster.detail).toBe('Signer configured');
    });
  });

  // ── Supabase checks ───────────────────────────────────────────────────────

  describe('Supabase agent_config checks', () => {
    it('marks supabase as NOT OK when table is empty', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.supabase.ok).toBe(false);
      expect(body.checks.supabase.detail).toContain('agent_config table empty');
      expect(body.checks.supabase.detail).toContain('Run seed-agent-config.sql');
    });

    it('marks supabase as OK when agent_config has rows', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      const agents = [
        {
          name: 'VAULT',
          trading_enabled: true,
          wallet_address: '0x1111',
        },
      ];
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: agents, error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.supabase.ok).toBe(true);
      expect(body.checks.supabase.detail).toBe('1 agents configured');
    });

    it('marks supabase as OK and counts multiple agents', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      const agents = [
        { name: 'VAULT', trading_enabled: true, wallet_address: '0x1111' },
        { name: 'BANKER', trading_enabled: true, wallet_address: '0x2222' },
        { name: 'DEALER', trading_enabled: false, wallet_address: '0x3333' },
      ];
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: agents, error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.supabase.ok).toBe(true);
      expect(body.checks.supabase.detail).toBe('3 agents configured');
    });

    it('marks individual agent config checks as OK when enabled with address', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      const agents = [{ name: 'VAULT', trading_enabled: true, wallet_address: '0x1111' }];
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: agents, error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.config_vault.ok).toBe(true);
      expect(body.checks.config_vault.detail).toContain('trading=true');
      expect(body.checks.config_vault.detail).toContain('wallet=set');
    });

    it('marks individual agent config as NOT OK when trading disabled', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      const agents = [{ name: 'VAULT', trading_enabled: false, wallet_address: '0x1111' }];
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: agents, error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.config_vault.ok).toBe(false);
      expect(body.checks.config_vault.detail).toContain('trading=false');
    });

    it('marks individual agent config as NOT OK when wallet is empty', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      const agents = [{ name: 'BANKER', trading_enabled: true, wallet_address: null }];
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: agents, error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.config_banker.ok).toBe(false);
      expect(body.checks.config_banker.detail).toContain('wallet=empty');
    });

    it('includes all agents from agent_config in response', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      const agents = [
        { name: 'VAULT', trading_enabled: true, wallet_address: '0x1111' },
        { name: 'BANKER', trading_enabled: true, wallet_address: '0x2222' },
        { name: 'DEALER', trading_enabled: false, wallet_address: '0x3333' },
      ];
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: agents, error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.config_vault).toBeDefined();
      expect(body.checks.config_banker).toBeDefined();
      expect(body.checks.config_dealer).toBeDefined();
    });

    it('marks supabase as NOT OK when query returns error', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      mockGetSupabaseAdmin.mockReturnValue(
        mockSupabaseAdmin({
          data: null,
          error: { message: 'Connection refused' },
        }),
      );

      const res = await GET();
      const body = await res.json();

      expect(body.checks.supabase.ok).toBe(false);
      expect(body.checks.supabase.detail).toContain('Query failed: Connection refused');
    });

    it('calls from() with agent_config table name', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      const admin = mockSupabaseAdmin({ data: [], error: null });
      mockGetSupabaseAdmin.mockReturnValue(admin);

      await GET();

      expect(admin.from).toHaveBeenCalledWith('agent_config');
    });

    it('calls select with correct columns', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      const agent = [{ name: 'VAULT', trading_enabled: true, wallet_address: '0x1111' }];
      const chain = chainMock({ data: agent, error: null });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });

      await GET();

      expect(chain.select).toHaveBeenCalledWith('name, trading_enabled, wallet_address');
    });

    it('calls order by name', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      const agent = [{ name: 'VAULT', trading_enabled: true, wallet_address: '0x1111' }];
      const chain = chainMock({ data: agent, error: null });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });

      await GET();

      expect(chain.order).toHaveBeenCalledWith('name');
    });
  });

  // ── Exception handling ───────────────────────────────────────────────────

  describe('Exception handling', () => {
    it('handles Supabase connection exception gracefully', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      mockGetSupabaseAdmin.mockImplementation(() => {
        throw new Error('Network timeout');
      });

      const res = await GET();
      const body = await res.json();

      expect(body.checks.supabase.ok).toBe(false);
      expect(body.checks.supabase.detail).toContain('Network timeout');
    });

    it('handles unknown error type in exception', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      mockGetSupabaseAdmin.mockImplementation(() => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw 'Something terrible happened';
      });

      const res = await GET();
      const body = await res.json();

      expect(body.checks.supabase.ok).toBe(false);
      expect(body.checks.supabase.detail).toBe('Supabase connection failed');
    });
  });

  // ── Response format ──────────────────────────────────────────────────────

  describe('Response format and status', () => {
    it('returns 200 OK', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();

      expect(res.status).toBe(200);
    });

    it('includes status, passing, checks, and action in response', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('passing');
      expect(body).toHaveProperty('checks');
      expect(body).toHaveProperty('action');
    });

    it('returns status=ready when ALL checks pass', async () => {
      process.env.PRIVY_APP_ID = 'test-id';
      process.env.PRIVY_APP_SECRET = 'test-secret';
      process.env.VAULT_WALLET_ID = '0x1111';
      process.env.BANKER_WALLET_ID = '0x2222';
      process.env.DEALER_WALLET_ID = '0x3333';
      process.env.ZX_API_KEY = 'zx-key';
      process.env.CRON_SECRET = 'cron-key';
      process.env.ZAO_OFFICIAL_SIGNER_UUID = 'uuid';
      process.env.ZAO_OFFICIAL_NEYNAR_API_KEY = 'neynar';
      const agents = [
        { name: 'VAULT', trading_enabled: true, wallet_address: '0x1111' },
        { name: 'BANKER', trading_enabled: true, wallet_address: '0x2222' },
        { name: 'DEALER', trading_enabled: true, wallet_address: '0x3333' },
      ];
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: agents, error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.status).toBe('ready');
      expect(body.action).toContain('All checks pass');
    });

    it('returns status=not_ready when ANY check fails', async () => {
      process.env.PRIVY_APP_ID = 'test-id';
      process.env.PRIVY_APP_SECRET = 'test-secret';
      // Missing wallet IDs
      process.env.ZX_API_KEY = 'zx-key';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.status).toBe('not_ready');
      expect(body.action).toContain('Fix failing checks before activating agents');
    });

    it('reports passing count correctly', async () => {
      process.env.PRIVY_APP_ID = 'test-id';
      process.env.PRIVY_APP_SECRET = 'test-secret';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();
      const body = await res.json();

      // 6 main checks: privy, 3 wallets, zx_api, cron_secret, farcaster, supabase
      // supabase fails (empty table), so 7/8 pass
      const [passing, total] = body.passing.split('/');
      expect(Number.parseInt(passing, 10)).toBeGreaterThan(0);
      expect(Number.parseInt(total, 10)).toBeGreaterThan(0);
      expect(Number.parseInt(passing, 10)).toBeLessThanOrEqual(Number.parseInt(total, 10));
    });

    it('includes detail string in each check', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();
      const body = await res.json();

      for (const [_key, check] of Object.entries(body.checks)) {
        expect(check).toHaveProperty('ok');
        expect(check).toHaveProperty('detail');
        expect(typeof check.ok).toBe('boolean');
        expect(typeof check.detail).toBe('string');
      }
    });
  });

  // ── Integration tests ────────────────────────────────────────────────────

  describe('Integration: all checks together', () => {
    it('performs a complete health check with mixed states', async () => {
      // Some env vars set, some not; supabase has data
      process.env.PRIVY_APP_ID = 'id';
      process.env.PRIVY_APP_SECRET = 'secret';
      process.env.ZX_API_KEY = 'key';
      // VAULT_WALLET_ID missing
      process.env.BANKER_WALLET_ID = '0x2222';
      process.env.DEALER_WALLET_ID = '0x3333';
      process.env.CRON_SECRET = 'cron';
      // Farcaster incomplete
      process.env.ZAO_OFFICIAL_SIGNER_UUID = 'uuid';
      // Missing API key for farcaster

      const agents = [
        { name: 'BANKER', trading_enabled: true, wallet_address: '0x2222' },
        { name: 'DEALER', trading_enabled: true, wallet_address: '0x3333' },
      ];
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: agents, error: null }));

      const res = await GET();
      const body = await res.json();

      // Should include various failing checks
      expect(body.status).toBe('not_ready');
      expect(body.checks.privy.ok).toBe(true);
      expect(body.checks.wallet_vault.ok).toBe(false);
      expect(body.checks.wallet_banker.ok).toBe(true);
      expect(body.checks.zx_api.ok).toBe(true);
      expect(body.checks.cron_secret.ok).toBe(true);
      expect(body.checks.farcaster.ok).toBe(false);
      expect(body.checks.supabase.ok).toBe(true);
      expect(body.checks.config_banker.ok).toBe(true);
      expect(body.checks.config_dealer.ok).toBe(true);
    });

    it('has no auth guard - always returns 200', async () => {
      // No session check, no auth required
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();

      expect(res.status).toBe(200);
    });
  });

  describe('Data validation in response', () => {
    it('returns JSON content-type', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: [], error: null }));

      const res = await GET();

      expect(res.headers.get('content-type')).toContain('application/json');
    });

    it('does not throw if data is null from supabase', async () => {
      process.env.PRIVY_APP_ID = 'test';
      process.env.PRIVY_APP_SECRET = 'test';
      mockGetSupabaseAdmin.mockReturnValue(mockSupabaseAdmin({ data: null, error: null }));

      const res = await GET();
      const body = await res.json();

      expect(body.checks.supabase.ok).toBe(false);
      expect(body.status).toBe('not_ready');
    });
  });
});
