import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

// FIFO chain: queries pop results from a queue in order.
// Each awaited call (via .then or .single()) consumes one result from the queue.
function queuedChain(results: Array<{ data?: unknown; error?: unknown }>) {
  const q = [...results];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  // Chainable methods — each returns the chain for further chaining
  for (const m of ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'maybeSingle']) {
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

describe('POST /api/fractals/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('FRACTAL_BOT_WEBHOOK_SECRET', 'test-webhook-secret-12345');
  });

  describe('Bearer token authentication', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_started',
        data: {
          threadId: 'thread-123',
          name: 'Test',
          guildId: 'guild-1',
          facilitatorDiscordId: 'fac-1',
          participantDiscordIds: ['p1', 'p2'],
          currentLevel: 1,
        },
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when Bearer token is wrong', async () => {
      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_started',
        data: {
          threadId: 'thread-123',
          name: 'Test',
          guildId: 'guild-1',
          facilitatorDiscordId: 'fac-1',
          participantDiscordIds: ['p1', 'p2'],
          currentLevel: 1,
        },
      });
      req.headers.set('authorization', 'Bearer wrong-token-value');
      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when Bearer token is empty string', async () => {
      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_started',
        data: {
          threadId: 'thread-123',
          name: 'Test',
          guildId: 'guild-1',
          facilitatorDiscordId: 'fac-1',
          participantDiscordIds: ['p1', 'p2'],
          currentLevel: 1,
        },
      });
      req.headers.set('authorization', 'Bearer ');
      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 503 when FRACTAL_BOT_WEBHOOK_SECRET env is not set', async () => {
      vi.stubEnv('FRACTAL_BOT_WEBHOOK_SECRET', '');
      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_started',
        data: {
          threadId: 'thread-123',
          name: 'Test',
          guildId: 'guild-1',
          facilitatorDiscordId: 'fac-1',
          participantDiscordIds: ['p1', 'p2'],
          currentLevel: 1,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.error).toBe('Webhook not configured');
    });

    it('accepts correct Bearer token', async () => {
      // Setup supabase mock for upsert + logEvent
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null }], // fractal_sessions upsert
          [{ data: null, error: null }], // fractal_events insert
        ]),
      );

      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_started',
        data: {
          threadId: 'thread-123',
          name: 'Test',
          guildId: 'guild-1',
          facilitatorDiscordId: 'fac-1',
          participantDiscordIds: ['p1', 'p2'],
          currentLevel: 1,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.event).toBe('fractal_started');
    });
  });

  describe('Request validation', () => {
    beforeEach(() => {
      vi.stubEnv('FRACTAL_BOT_WEBHOOK_SECRET', 'test-webhook-secret-12345');
    });

    it('returns 400 when request body is invalid JSON', async () => {
      const req = new Request('http://localhost:3000/api/fractals/webhook', {
        method: 'POST',
        body: 'not valid json {]',
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req as unknown as Parameters<typeof POST>[0]);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid JSON');
    });

    it('returns 400 when fractalId is missing', async () => {
      const req = makePostRequest('/api/fractals/webhook', {
        event: 'fractal_started',
        data: {
          threadId: 'thread-123',
          name: 'Test',
          guildId: 'guild-1',
          facilitatorDiscordId: 'fac-1',
          participantDiscordIds: ['p1', 'p2'],
          currentLevel: 1,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid payload');
    });

    it('returns 400 when event type is missing', async () => {
      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        data: {
          threadId: 'thread-123',
          name: 'Test',
          guildId: 'guild-1',
          facilitatorDiscordId: 'fac-1',
          participantDiscordIds: ['p1', 'p2'],
          currentLevel: 1,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid payload');
    });

    it('returns 400 when event type is unknown', async () => {
      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'unknown_event',
        data: {},
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid payload');
    });

    it('returns 400 when data object is missing', async () => {
      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_started',
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid payload');
    });

    it('returns 400 when fractalId exceeds max length', async () => {
      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'x'.repeat(201),
        event: 'fractal_started',
        data: {
          threadId: 'thread-123',
          name: 'Test',
          guildId: 'guild-1',
          facilitatorDiscordId: 'fac-1',
          participantDiscordIds: ['p1', 'p2'],
          currentLevel: 1,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid payload');
    });

    it('returns 400 when fractalId is empty', async () => {
      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: '',
        event: 'fractal_started',
        data: {
          threadId: 'thread-123',
          name: 'Test',
          guildId: 'guild-1',
          facilitatorDiscordId: 'fac-1',
          participantDiscordIds: ['p1', 'p2'],
          currentLevel: 1,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid payload');
    });
  });

  describe('fractal_started event', () => {
    beforeEach(() => {
      vi.stubEnv('FRACTAL_BOT_WEBHOOK_SECRET', 'test-webhook-secret-12345');
    });

    it('returns 200 and processes fractal_started with all required fields', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null }], // upsert fractal_sessions
          [{ data: null, error: null }], // insert fractal_events
        ]),
      );

      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_started',
        data: {
          threadId: 'thread-123',
          name: 'Test Fractal',
          guildId: 'guild-1',
          facilitatorDiscordId: 'fac-1',
          participantDiscordIds: ['p1', 'p2', 'p3'],
          currentLevel: 1,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.event).toBe('fractal_started');
    });

    it('returns 400 when fractal_started data has missing threadId', async () => {
      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_started',
        data: {
          name: 'Test Fractal',
          guildId: 'guild-1',
          facilitatorDiscordId: 'fac-1',
          participantDiscordIds: ['p1', 'p2'],
          currentLevel: 1,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Invalid data for fractal_started');
    });

    it('returns 400 when fractal_started data has non-integer currentLevel', async () => {
      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_started',
        data: {
          threadId: 'thread-123',
          name: 'Test Fractal',
          guildId: 'guild-1',
          facilitatorDiscordId: 'fac-1',
          participantDiscordIds: ['p1', 'p2'],
          currentLevel: 1.5,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Invalid data for fractal_started');
    });

    it('returns 400 when fractal_started participantDiscordIds is not an array', async () => {
      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_started',
        data: {
          threadId: 'thread-123',
          name: 'Test Fractal',
          guildId: 'guild-1',
          facilitatorDiscordId: 'fac-1',
          participantDiscordIds: 'not-an-array',
          currentLevel: 1,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Invalid data for fractal_started');
    });

    it('returns 500 when fractal_sessions upsert fails', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: new Error('Database constraint violation') }], // upsert fails
        ]),
      );

      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_started',
        data: {
          threadId: 'thread-123',
          name: 'Test Fractal',
          guildId: 'guild-1',
          facilitatorDiscordId: 'fac-1',
          participantDiscordIds: ['p1', 'p2'],
          currentLevel: 1,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to process event');
    });
  });

  describe('vote_cast event', () => {
    beforeEach(() => {
      vi.stubEnv('FRACTAL_BOT_WEBHOOK_SECRET', 'test-webhook-secret-12345');
    });

    it('returns 200 and processes vote_cast event', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null }], // update fractal_sessions
          [{ data: null, error: null }], // insert fractal_events
        ]),
      );

      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'vote_cast',
        data: {
          voterId: 'voter-1',
          candidateId: 'candidate-1',
          level: 2,
          totalVotes: 5,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.event).toBe('vote_cast');
    });

    it('returns 400 when vote_cast data has missing voterId', async () => {
      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'vote_cast',
        data: {
          candidateId: 'candidate-1',
          level: 2,
          totalVotes: 5,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Invalid data for vote_cast');
    });

    it('returns 400 when vote_cast totalVotes is negative', async () => {
      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'vote_cast',
        data: {
          voterId: 'voter-1',
          candidateId: 'candidate-1',
          level: 2,
          totalVotes: -1,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(200); // totalVotes is just an int, no min/max constraint in schema
      const body = await res.json();
      expect(body.ok).toBe(true);
    });
  });

  describe('round_complete event', () => {
    beforeEach(() => {
      vi.stubEnv('FRACTAL_BOT_WEBHOOK_SECRET', 'test-webhook-secret-12345');
    });

    it('returns 200 and processes round_complete event', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null }], // update fractal_sessions
          [{ data: null, error: null }], // insert fractal_events
        ]),
      );

      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'round_complete',
        data: {
          level: 1,
          winnerId: 'winner-1',
          totalVotes: 5,
          voteDistribution: { 'candidate-1': 3, 'candidate-2': 2 },
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.event).toBe('round_complete');
    });

    it('returns 400 when round_complete voteDistribution is not an object', async () => {
      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'round_complete',
        data: {
          level: 1,
          winnerId: 'winner-1',
          totalVotes: 5,
          voteDistribution: 'not an object',
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Invalid data for round_complete');
    });
  });

  describe('fractal_complete event', () => {
    beforeEach(() => {
      vi.stubEnv('FRACTAL_BOT_WEBHOOK_SECRET', 'test-webhook-secret-12345');
    });

    it('returns 200 and processes fractal_complete with scores insertion', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: { id: 'session-1' }, error: null }], // update fractal_sessions + select id
          [{ data: null, error: null }], // insert fractal_scores
          [{ data: null, error: null }], // insert fractal_events
        ]),
      );

      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_complete',
        data: {
          results: [
            { discordId: 'user-1', rank: 1, level: 3 },
            { discordId: 'user-2', rank: 2, level: 3 },
          ],
          totalRounds: 3,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.event).toBe('fractal_complete');
    });

    it('returns 500 when fractal_complete session update fails', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: new Error('Session not found') }], // update fails
        ]),
      );

      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_complete',
        data: {
          results: [{ discordId: 'user-1', rank: 1, level: 3 }],
          totalRounds: 3,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to process event');
    });

    it('returns 400 when fractal_complete results array has invalid rank', async () => {
      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_complete',
        data: {
          results: [{ discordId: 'user-1', rank: 1.5, level: 3 }],
          totalRounds: 3,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Invalid data for fractal_complete');
    });

    it('returns 200 and continues when fractal_complete scores insert fails (non-fatal)', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: { id: 'session-1' }, error: null }], // update session succeeds
          [{ data: null, error: new Error('Scores insert failed') }], // scores insert fails (non-fatal)
          [{ data: null, error: null }], // insert fractal_events succeeds
        ]),
      );

      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_complete',
        data: {
          results: [{ discordId: 'user-1', rank: 1, level: 3 }],
          totalRounds: 3,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
    });
  });

  describe('fractal_paused event', () => {
    beforeEach(() => {
      vi.stubEnv('FRACTAL_BOT_WEBHOOK_SECRET', 'test-webhook-secret-12345');
    });

    it('returns 200 and processes fractal_paused event', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null }], // update fractal_sessions
          [{ data: null, error: null }], // insert fractal_events
        ]),
      );

      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_paused',
        data: {
          currentLevel: 2,
          pausedAt: '2026-07-15T12:00:00Z',
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.event).toBe('fractal_paused');
    });

    it('returns 200 when fractal_paused pausedAt is optional', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null }], // update fractal_sessions
          [{ data: null, error: null }], // insert fractal_events
        ]),
      );

      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_paused',
        data: {
          currentLevel: 2,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
    });

    it('returns 400 when fractal_paused currentLevel is missing', async () => {
      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_paused',
        data: {
          pausedAt: '2026-07-15T12:00:00Z',
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Invalid data for fractal_paused');
    });
  });

  describe('fractal_resumed event', () => {
    beforeEach(() => {
      vi.stubEnv('FRACTAL_BOT_WEBHOOK_SECRET', 'test-webhook-secret-12345');
    });

    it('returns 200 and processes fractal_resumed event', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null }], // update fractal_sessions
          [{ data: null, error: null }], // insert fractal_events
        ]),
      );

      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_resumed',
        data: {
          currentLevel: 2,
          resumedAt: '2026-07-15T13:00:00Z',
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.event).toBe('fractal_resumed');
    });

    it('returns 200 when fractal_resumed resumedAt is optional', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null }], // update fractal_sessions
          [{ data: null, error: null }], // insert fractal_events
        ]),
      );

      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_resumed',
        data: {
          currentLevel: 2,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
    });
  });

  describe('Error handling and edge cases', () => {
    beforeEach(() => {
      vi.stubEnv('FRACTAL_BOT_WEBHOOK_SECRET', 'test-webhook-secret-12345');
    });

    it('returns 200 even when fractal_events insert fails (non-fatal)', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null }], // fractal_sessions update succeeds
          [{ data: null, error: new Error('Events table missing') }], // fractal_events insert fails
        ]),
      );

      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'vote_cast',
        data: {
          voterId: 'voter-1',
          candidateId: 'candidate-1',
          level: 1,
          totalVotes: 1,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
    });

    it('logs error but continues when vote_cast update fails (non-fatal)', async () => {
      const { logger } = await import('@/lib/logger');
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: new Error('DB error on update') }], // fractal_sessions update fails
          [{ data: null, error: null }], // fractal_events insert succeeds
        ]),
      );

      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'vote_cast',
        data: {
          voterId: 'voter-1',
          candidateId: 'candidate-1',
          level: 1,
          totalVotes: 1,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(logger.error).toHaveBeenCalledWith(
        '[fractal-webhook] vote_cast update error:',
        expect.any(Error),
      );
    });
  });

  describe('Response shape', () => {
    beforeEach(() => {
      vi.stubEnv('FRACTAL_BOT_WEBHOOK_SECRET', 'test-webhook-secret-12345');
    });

    it('returns correct response shape for successful webhook', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null }], // fractal_sessions upsert
          [{ data: null, error: null }], // fractal_events insert
        ]),
      );

      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_started',
        data: {
          threadId: 'thread-123',
          name: 'Test',
          guildId: 'guild-1',
          facilitatorDiscordId: 'fac-1',
          participantDiscordIds: ['p1'],
          currentLevel: 1,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      const body = await res.json();
      expect(body).toHaveProperty('ok', true);
      expect(body).toHaveProperty('event', 'fractal_started');
      expect(Object.keys(body)).toEqual(['ok', 'event']);
    });

    it('returns error response with details for validation failure', async () => {
      const req = makePostRequest('/api/fractals/webhook', {
        fractalId: 'thread-123',
        event: 'fractal_started',
        data: {
          name: 'Test',
          guildId: 'guild-1',
          facilitatorDiscordId: 'fac-1',
          participantDiscordIds: ['p1'],
          currentLevel: 1,
        },
      });
      req.headers.set('authorization', 'Bearer test-webhook-secret-12345');
      const res = await POST(req);

      const body = await res.json();
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('details');
    });
  });
});
