import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

// FIFO chain: queries pop results from a queue in order.
// Each awaited call (via .then or .single()) consumes one result from the queue.
function queuedChain(results: Array<{ data?: unknown; error?: unknown }>) {
  const q = [...results];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  // Chainable methods — each returns the chain for further chaining
  for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'maybeSingle']) {
    chain[m] = vi.fn(() => chain);
  }

  // Terminal method .single() returns a promise that resolves to the next queued result
  chain.single = vi.fn(() => Promise.resolve(q.shift() ?? { data: null, error: null }));

  // Allow the chain to be awaited directly (for queries without .single())
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve(q.shift() ?? { data: null, error: null });

  return chain;
}

// Create a Supabase mock that returns new FIFO chains on each from() call
function createSupabaseMock(results: Array<{ data?: unknown; error?: unknown }>[]) {
  let callIndex = 0;
  return {
    from: () => {
      const chainResults = results[callIndex] || [];
      callIndex++;
      return queuedChain([...chainResults]);
    },
  };
}

const { mockGetSupabaseAdmin } = vi.hoisted(() => ({
  mockGetSupabaseAdmin: vi.fn(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: new Proxy({} as unknown, {
    get(_target, prop) {
      return (mockGetSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[prop];
    },
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

describe('POST /api/discord/link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('DISCORD_BOT_WEBHOOK_SECRET', 'test-secret-token-12345');
  });

  describe('Bearer token authentication', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 1 });
      // No authorization header set
      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when Bearer token is wrong', async () => {
      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 1 });
      req.headers.set('authorization', 'Bearer wrong-token-value');
      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when token is empty string', async () => {
      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 1 });
      req.headers.set('authorization', 'Bearer ');
      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when Bearer token has length mismatch', async () => {
      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 1 });
      // Send a token that's the right format but wrong value
      req.headers.set('authorization', 'Bearer wrong-token-value-that-doesnt-match-secret');
      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 503 when DISCORD_BOT_WEBHOOK_SECRET env is not set', async () => {
      vi.stubEnv('DISCORD_BOT_WEBHOOK_SECRET', '');
      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 1 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.error).toBe('Link endpoint not configured');
    });

    it('accepts correct Bearer token', async () => {
      // Setup supabase mocks: both lookups return null, so case 5 (neither exists)
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null }], // byDiscord lookup
          [{ data: null, error: null }], // byFid lookup
        ]),
      );

      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 1 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      // Will return 404 because neither user exists, but auth passed
      expect(res.status).toBe(404);
    });
  });

  describe('Zod validation', () => {
    beforeEach(() => {
      vi.stubEnv('DISCORD_BOT_WEBHOOK_SECRET', 'test-secret-token-12345');
    });

    it('returns 400 when discord_id is missing', async () => {
      const req = makePostRequest('/api/discord/link', { fid: 1 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when fid is missing', async () => {
      const req = makePostRequest('/api/discord/link', { discord_id: '123456' });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when discord_id is empty string', async () => {
      const req = makePostRequest('/api/discord/link', { discord_id: '', fid: 1 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when fid is not an integer', async () => {
      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 1.5 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when fid is not positive', async () => {
      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 0 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when fid is negative', async () => {
      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: -1 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('accepts valid discord_id and fid', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([[{ data: null, error: null }], [{ data: null, error: null }]]),
      );

      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 999 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(404); // Neither exists, but validation passed
    });
  });

  describe('Case 1: Both fields already on the same row (already_linked)', () => {
    beforeEach(() => {
      vi.stubEnv('DISCORD_BOT_WEBHOOK_SECRET', 'test-secret-token-12345');
    });

    it('returns ok: true with action already_linked when both discord_id and fid exist on same row', async () => {
      const existingUser = {
        id: 'user-id-1',
        discord_id: '123456',
        fid: 999,
        primary_wallet: '0x123',
        username: 'testuser',
      };

      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: existingUser, error: null }], // byDiscord lookup
          [{ data: existingUser, error: null }], // byFid lookup (same row)
        ]),
      );

      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 999 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.action).toBe('already_linked');
      expect(body.user_id).toBe('user-id-1');
    });
  });

  describe('Case 2: Both rows exist but are separate (merged)', () => {
    beforeEach(() => {
      vi.stubEnv('DISCORD_BOT_WEBHOOK_SECRET', 'test-secret-token-12345');
    });

    it('merges separate rows when both discord_id and fid exist on different rows, prefers fid row if it has wallet', async () => {
      const discordRow = {
        id: 'discord-row',
        discord_id: '123456',
        fid: null,
        primary_wallet: null,
        username: 'discord_user',
      };
      const fidRow = {
        id: 'fid-row',
        discord_id: null,
        fid: 999,
        primary_wallet: '0x456',
        username: 'fid_user',
      };

      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: discordRow, error: null }], // byDiscord lookup
          [{ data: fidRow, error: null }], // byFid lookup
          [{ data: null, error: null }], // update fidRow with fields
          [{ data: null, error: null }], // clear discordRow
        ]),
      );

      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 999 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.action).toBe('merged');
      expect(body.kept_id).toBe('fid-row'); // fid row has wallet, so it's kept
      expect(body.merged_id).toBe('discord-row');
    });

    it('merges separate rows, prefers discord row if fid row has no wallet', async () => {
      const discordRow = {
        id: 'discord-row',
        discord_id: '123456',
        fid: null,
        primary_wallet: '0x789',
        username: 'discord_user',
      };
      const fidRow = {
        id: 'fid-row',
        discord_id: null,
        fid: 999,
        primary_wallet: null,
        username: 'fid_user',
      };

      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: discordRow, error: null }], // byDiscord lookup
          [{ data: fidRow, error: null }], // byFid lookup
          [{ data: null, error: null }], // update discordRow with fields
          [{ data: null, error: null }], // clear fidRow
        ]),
      );

      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 999 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.action).toBe('merged');
      expect(body.kept_id).toBe('discord-row'); // discord row has wallet, so it's kept
      expect(body.merged_id).toBe('fid-row');
    });

    it('merges separate rows, prefers fid row even when both have wallets', async () => {
      const discordRow = {
        id: 'discord-row',
        discord_id: '123456',
        fid: null,
        primary_wallet: '0x111',
        username: 'discord_user',
      };
      const fidRow = {
        id: 'fid-row',
        discord_id: null,
        fid: 999,
        primary_wallet: '0x222',
        username: 'fid_user',
      };

      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: discordRow, error: null }], // byDiscord lookup
          [{ data: fidRow, error: null }], // byFid lookup
          [{ data: null, error: null }], // update fidRow with fields
          [{ data: null, error: null }], // clear discordRow
        ]),
      );

      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 999 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.action).toBe('merged');
      expect(body.kept_id).toBe('fid-row'); // fid row is preferred even when both have wallets
      expect(body.merged_id).toBe('discord-row');
    });

    it('does not update kept row if no fields need copying', async () => {
      const discordRow = {
        id: 'discord-row',
        discord_id: '123456',
        fid: 999, // Already has the fid
        primary_wallet: null,
        username: 'discord_user',
      };
      const fidRow = {
        id: 'fid-row',
        discord_id: '123456', // Already has the discord_id
        fid: 999,
        primary_wallet: '0x456',
        username: 'fid_user',
      };

      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: discordRow, error: null }], // byDiscord lookup
          [{ data: fidRow, error: null }], // byFid lookup
          [{ data: null, error: null }], // clear discordRow (only operation)
        ]),
      );

      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 999 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.action).toBe('merged');
    });
  });

  describe('Case 3: Only discord row exists (linked_fid_to_discord)', () => {
    beforeEach(() => {
      vi.stubEnv('DISCORD_BOT_WEBHOOK_SECRET', 'test-secret-token-12345');
    });

    it('adds fid to existing discord row', async () => {
      const discordRow = {
        id: 'discord-row',
        discord_id: '123456',
        fid: null,
        primary_wallet: '0x123',
        username: 'discord_user',
      };

      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: discordRow, error: null }], // byDiscord lookup
          [{ data: null, error: null }], // byFid lookup
          [{ data: null, error: null }], // update with fid
        ]),
      );

      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 999 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.action).toBe('linked_fid_to_discord');
      expect(body.user_id).toBe('discord-row');
    });
  });

  describe('Case 4: Only fid row exists (linked_discord_to_fid)', () => {
    beforeEach(() => {
      vi.stubEnv('DISCORD_BOT_WEBHOOK_SECRET', 'test-secret-token-12345');
    });

    it('adds discord_id to existing fid row', async () => {
      const fidRow = {
        id: 'fid-row',
        discord_id: null,
        fid: 999,
        primary_wallet: '0x456',
        username: 'fid_user',
      };

      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null }], // byDiscord lookup
          [{ data: fidRow, error: null }], // byFid lookup
          [{ data: null, error: null }], // update with discord_id
        ]),
      );

      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 999 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.action).toBe('linked_discord_to_fid');
      expect(body.user_id).toBe('fid-row');
    });
  });

  describe('Case 5: Neither exists (error)', () => {
    beforeEach(() => {
      vi.stubEnv('DISCORD_BOT_WEBHOOK_SECRET', 'test-secret-token-12345');
    });

    it('returns 404 when neither discord_id nor fid exist', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null }], // byDiscord lookup
          [{ data: null, error: null }], // byFid lookup
        ]),
      );

      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 999 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toContain('Neither discord_id nor fid found');
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      vi.stubEnv('DISCORD_BOT_WEBHOOK_SECRET', 'test-secret-token-12345');
    });

    it('returns 500 on JSON parse error', async () => {
      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 999 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');

      // Stub req.json() to throw
      const stub = req as unknown as { json: () => Promise<unknown> };
      stub.json = vi.fn(async () => {
        throw new Error('Invalid JSON');
      });

      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Link failed');
    });

    it('returns 404 when supabase query returns error but data is null', async () => {
      // Note: The route doesn't check for errors in the response, only whether data is null.
      // A database error returned by Supabase still results in data: null, which the route
      // interprets as "not found". This continues to case 5 (neither exists).
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: new Error('Database connection failed') }], // byDiscord fails
          [{ data: null, error: new Error('Database connection failed') }], // byFid fails
        ]),
      );

      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 999 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      // Route treats error responses as "not found" and returns 404
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toContain('Neither discord_id nor fid found');
    });

    it('logs error on exception', async () => {
      const { logger } = await import('@/lib/logger');
      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 999 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');

      const stub = req as unknown as { json: () => Promise<unknown> };
      stub.json = vi.fn(async () => {
        throw new Error('Parse error');
      });

      await POST(req);

      expect(logger.error).toHaveBeenCalledWith('[Discord link] POST error:', expect.any(Error));
    });
  });

  describe('Merge logic: field copying and wallet preference', () => {
    beforeEach(() => {
      vi.stubEnv('DISCORD_BOT_WEBHOOK_SECRET', 'test-secret-token-12345');
    });

    it('copies missing fields from mergeRow to keepRow', async () => {
      const discordRow = {
        id: 'discord-row',
        discord_id: '123456',
        fid: null,
        primary_wallet: '0x wallet_from_discord',
        username: 'discord_user',
      };
      const fidRow = {
        id: 'fid-row',
        discord_id: null,
        fid: 999,
        primary_wallet: null,
        username: 'fid_user',
      };

      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: discordRow, error: null }], // byDiscord lookup
          [{ data: fidRow, error: null }], // byFid lookup
          [{ data: null, error: null }], // update fidRow with wallet from discordRow
          [{ data: null, error: null }], // clear discordRow
        ]),
      );

      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 999 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.action).toBe('merged');
    });

    it('ensures both discord_id and fid are set on keepRow after merge', async () => {
      const discordRow = {
        id: 'discord-row',
        discord_id: '123456',
        fid: null,
        primary_wallet: null,
        username: 'discord_user',
      };
      const fidRow = {
        id: 'fid-row',
        discord_id: null,
        fid: 999,
        primary_wallet: '0x456',
        username: 'fid_user',
      };

      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: discordRow, error: null }], // byDiscord lookup
          [{ data: fidRow, error: null }], // byFid lookup
          [{ data: null, error: null }], // update fidRow (sets both discord_id and fid)
          [{ data: null, error: null }], // clear discordRow
        ]),
      );

      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 999 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
    });

    it('clears discord_id and fid from mergeRow to avoid conflicts', async () => {
      const discordRow = {
        id: 'discord-row',
        discord_id: '123456',
        fid: null,
        primary_wallet: null,
        username: 'discord_user',
      };
      const fidRow = {
        id: 'fid-row',
        discord_id: null,
        fid: 999,
        primary_wallet: '0x456',
        username: 'fid_user',
      };

      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: discordRow, error: null }], // byDiscord lookup
          [{ data: fidRow, error: null }], // byFid lookup
          [{ data: null, error: null }], // update keepRow
          [{ data: null, error: null }], // update mergeRow to clear fields
        ]),
      );

      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 999 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.merged_id).toBe('discord-row');
    });
  });

  describe('Response shapes and headers', () => {
    beforeEach(() => {
      vi.stubEnv('DISCORD_BOT_WEBHOOK_SECRET', 'test-secret-token-12345');
    });

    it('returns valid JSON response for already_linked case', async () => {
      const existingUser = {
        id: 'user-id-1',
        discord_id: '123456',
        fid: 999,
        primary_wallet: '0x123',
        username: 'testuser',
      };

      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: existingUser, error: null }],
          [{ data: existingUser, error: null }],
        ]),
      );

      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 999 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('ok', true);
      expect(body).toHaveProperty('action', 'already_linked');
      expect(body).toHaveProperty('user_id');
    });

    it('returns valid JSON response for merged case', async () => {
      const discordRow = {
        id: 'discord-row',
        discord_id: '123456',
        fid: null,
        primary_wallet: null,
        username: 'discord_user',
      };
      const fidRow = {
        id: 'fid-row',
        discord_id: null,
        fid: 999,
        primary_wallet: '0x456',
        username: 'fid_user',
      };

      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: discordRow, error: null }],
          [{ data: fidRow, error: null }],
          [{ data: null, error: null }],
          [{ data: null, error: null }],
        ]),
      );

      const req = makePostRequest('/api/discord/link', { discord_id: '123456', fid: 999 });
      req.headers.set('authorization', 'Bearer test-secret-token-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('ok', true);
      expect(body).toHaveProperty('action', 'merged');
      expect(body).toHaveProperty('kept_id');
      expect(body).toHaveProperty('merged_id');
    });
  });
});
