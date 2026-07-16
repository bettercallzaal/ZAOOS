import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
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
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

/**
 * FIFO chain for sequential database calls in events/rsvp.
 * Each request does: (1) select/maybeSingle for duplicate check, (2) insert.
 * Queue one result per call.
 */
function queuedChain(results: Array<{ data?: unknown; error?: unknown; count?: number }>) {
  const q = [...results];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const chainMethods = [
    'from',
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'in',
    'order',
    'limit',
  ];
  for (const m of chainMethods) {
    chain[m] = vi.fn(() => chain);
  }
  chain.maybeSingle = vi.fn(() => Promise.resolve(q.shift()));
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve(q.shift());
  return chain;
}

describe('POST /api/events/rsvp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
  });

  describe('input validation', () => {
    it('returns 400 when name is missing', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      const res = await POST(
        makePostRequest('/api/events/rsvp', {
          email: 'test@example.com',
          eventSlug: 'conference-2026',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when email is missing', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      const res = await POST(
        makePostRequest('/api/events/rsvp', {
          name: 'John Doe',
          eventSlug: 'conference-2026',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when eventSlug is missing', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      const res = await POST(
        makePostRequest('/api/events/rsvp', {
          name: 'John Doe',
          email: 'test@example.com',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when name is empty string', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      const res = await POST(
        makePostRequest('/api/events/rsvp', {
          name: '',
          email: 'test@example.com',
          eventSlug: 'conference-2026',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when name exceeds 200 chars', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      const longName = 'a'.repeat(201);
      const res = await POST(
        makePostRequest('/api/events/rsvp', {
          name: longName,
          email: 'test@example.com',
          eventSlug: 'conference-2026',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when email is invalid', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      const res = await POST(
        makePostRequest('/api/events/rsvp', {
          name: 'John Doe',
          email: 'not-an-email',
          eventSlug: 'conference-2026',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when email exceeds 320 chars', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      const longEmail = `${'a'.repeat(310)}@example.com`;
      const res = await POST(
        makePostRequest('/api/events/rsvp', {
          name: 'John Doe',
          email: longEmail,
          eventSlug: 'conference-2026',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when eventSlug is empty', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      const res = await POST(
        makePostRequest('/api/events/rsvp', {
          name: 'John Doe',
          email: 'test@example.com',
          eventSlug: '',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when eventSlug exceeds 100 chars', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      const longSlug = 'a'.repeat(101);
      const res = await POST(
        makePostRequest('/api/events/rsvp', {
          name: 'John Doe',
          email: 'test@example.com',
          eventSlug: longSlug,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });
  });

  describe('successful RSVP', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('successfully adds an RSVP with valid input', async () => {
      const chain = queuedChain([
        { data: null, error: null }, // duplicate check: no existing RSVP
        { error: null }, // insert
      ]);

      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/events/rsvp', {
          name: 'John Doe',
          email: 'john@example.com',
          eventSlug: 'conference-2026',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      // Verify duplicate check was performed
      expect(chain.select).toHaveBeenCalledWith('id');
      expect(chain.eq).toHaveBeenCalledWith('email', 'john@example.com');
      expect(chain.eq).toHaveBeenCalledWith('event_slug', 'conference-2026');

      // Verify insert was called
      expect(chain.insert).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        event_slug: 'conference-2026',
        fid: 123,
      });
    });

    it('successfully adds RSVP with null fid when session has no fid', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: undefined }));

      const chain = queuedChain([
        { data: null, error: null }, // duplicate check
        { error: null }, // insert
      ]);

      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/events/rsvp', {
          name: 'Guest User',
          email: 'guest@example.com',
          eventSlug: 'public-event',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      // Verify insert includes fid: null
      expect(chain.insert).toHaveBeenCalledWith({
        name: 'Guest User',
        email: 'guest@example.com',
        event_slug: 'public-event',
        fid: null,
      });
    });

    it('accepts valid emails at boundary length (320 chars)', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const chain = queuedChain([
        { data: null, error: null }, // duplicate check
        { error: null }, // insert
      ]);

      mockFrom.mockReturnValue(chain);

      const longEmail = `${'a'.repeat(305)}@example.com`;
      const res = await POST(
        makePostRequest('/api/events/rsvp', {
          name: 'Test User',
          email: longEmail,
          eventSlug: 'event',
        }),
      );

      expect(res.status).toBe(200);
      expect((await res.json()).success).toBe(true);
    });

    it('accepts valid names at boundary length (200 chars)', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const chain = queuedChain([
        { data: null, error: null }, // duplicate check
        { error: null }, // insert
      ]);

      mockFrom.mockReturnValue(chain);

      const longName = 'a'.repeat(200);
      const res = await POST(
        makePostRequest('/api/events/rsvp', {
          name: longName,
          email: 'test@example.com',
          eventSlug: 'event',
        }),
      );

      expect(res.status).toBe(200);
      expect((await res.json()).success).toBe(true);
    });
  });

  describe('duplicate RSVP handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    });

    it('returns 409 when RSVP already exists for same email and event', async () => {
      const chain = queuedChain([
        { data: { id: 'existing-rsvp-id' }, error: null }, // duplicate found
      ]);

      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/events/rsvp', {
          name: 'John Doe',
          email: 'john@example.com',
          eventSlug: 'conference-2026',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(409);
      expect(body.error).toBe('You have already RSVPed for this event');

      // Verify insert was never called (only select was queued)
      expect(chain.insert).not.toHaveBeenCalled();
    });

    it('allows duplicate name but different email for same event', async () => {
      const chain = queuedChain([
        { data: null, error: null }, // duplicate check: no existing
        { error: null }, // insert
      ]);

      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/events/rsvp', {
          name: 'John Doe',
          email: 'john2@example.com',
          eventSlug: 'conference-2026',
        }),
      );

      expect(res.status).toBe(200);
      expect((await res.json()).success).toBe(true);
    });

    it('allows same email for different events', async () => {
      const chain = queuedChain([
        { data: null, error: null }, // duplicate check: no existing
        { error: null }, // insert
      ]);

      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/events/rsvp', {
          name: 'John Doe',
          email: 'john@example.com',
          eventSlug: 'different-event',
        }),
      );

      expect(res.status).toBe(200);
      expect((await res.json()).success).toBe(true);
    });
  });

  describe('database errors', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 789 }));
    });

    it('returns 500 when duplicate check query fails', async () => {
      const chain = queuedChain([
        { data: null, error: new Error('Database connection error') }, // duplicate check errors
      ]);

      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/events/rsvp', {
          name: 'John Doe',
          email: 'john@example.com',
          eventSlug: 'conference-2026',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Server error');
    });

    it('returns 500 when insert fails', async () => {
      const chain = queuedChain([
        { data: null, error: null }, // duplicate check: ok
        { error: new Error('Unique constraint violation') }, // insert fails
      ]);

      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/events/rsvp', {
          name: 'John Doe',
          email: 'john@example.com',
          eventSlug: 'conference-2026',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to save RSVP');
    });

    it('returns 500 when Supabase throws during duplicate check', async () => {
      mockFrom.mockImplementationOnce(() => {
        throw new Error('Network timeout');
      });

      const res = await POST(
        makePostRequest('/api/events/rsvp', {
          name: 'John Doe',
          email: 'john@example.com',
          eventSlug: 'conference-2026',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Server error');
    });

    it('returns 500 when Supabase throws during insert', async () => {
      const chain = queuedChain([
        { data: null, error: null }, // duplicate check: ok
      ]);

      mockFrom.mockReturnValueOnce(chain).mockImplementationOnce(() => {
        throw new Error('Network timeout');
      });

      const res = await POST(
        makePostRequest('/api/events/rsvp', {
          name: 'John Doe',
          email: 'john@example.com',
          eventSlug: 'conference-2026',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Server error');
    });
  });

  describe('maybeSingle chain behavior', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 999 }));
    });

    it('correctly uses maybeSingle for duplicate check', async () => {
      const chain = queuedChain([
        { data: null, error: null }, // duplicate check
        { error: null }, // insert
      ]);

      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/events/rsvp', {
          name: 'John Doe',
          email: 'john@example.com',
          eventSlug: 'conference-2026',
        }),
      );

      // Verify the chain has maybeSingle called
      expect(chain.maybeSingle).toHaveBeenCalled();
    });
  });

  describe('case sensitivity', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 111 }));
    });

    it('preserves email case in insert', async () => {
      const chain = queuedChain([
        { data: null, error: null }, // duplicate check
        { error: null }, // insert
      ]);

      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/events/rsvp', {
          name: 'John Doe',
          email: 'John.Doe@Example.COM',
          eventSlug: 'conference-2026',
        }),
      );

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'John.Doe@Example.COM',
        }),
      );
    });

    it('preserves name case in insert', async () => {
      const chain = queuedChain([
        { data: null, error: null }, // duplicate check
        { error: null }, // insert
      ]);

      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/events/rsvp', {
          name: 'JOHN DOE',
          email: 'john@example.com',
          eventSlug: 'conference-2026',
        }),
      );

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'JOHN DOE',
        }),
      );
    });
  });
});
