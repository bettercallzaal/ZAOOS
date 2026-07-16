import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makePostRequest,
  makeRequest,
  mockAuthenticatedSession,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ───────────────────────────────────────────────────────────
const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

// ── Module mocks ────────────────────────────────────────────────────────────
vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// ── Import routes after mocks ───────────────────────────────────────────────
import { GET, POST } from '../route';

// ── Test helpers ────────────────────────────────────────────────────────────

/** A sample listening party object as returned from Supabase */
function sampleParty(overrides: Record<string, unknown> = {}) {
  return {
    id: 'party-123',
    title: 'ZAO Sunday Listening',
    description: 'Vibes only',
    host_fid: 123,
    host_name: 'Test User',
    track_urls: ['https://example.com/track1.mp3', 'https://example.com/track2.mp3'],
    scheduled_at: '2026-07-20T18:00:00Z',
    state: 'scheduled',
    started_at: null,
    created_at: '2026-07-15T10:00:00Z',
    updated_at: '2026-07-15T10:00:00Z',
    ...overrides,
  };
}

// ── GET /api/music/listening-party ──────────────────────────────────────────

describe('GET /api/music/listening-party', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when no session', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 200 with parties when authenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      const parties = [
        sampleParty({ id: 'party-1', state: 'live' }),
        sampleParty({ id: 'party-2', state: 'scheduled' }),
      ];
      const { chain } = chainMock({ data: parties, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.parties).toEqual(parties);
      expect(mockFrom).toHaveBeenCalledWith('listening_parties');
    });
  });

  describe('query filtering', () => {
    it('filters to only scheduled and live states', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      const parties = [sampleParty({ state: 'live' })];
      const { chain } = chainMock({ data: parties, error: null });
      mockFrom.mockReturnValue(chain);

      await GET();

      // Verify the chain was called with the correct filter
      expect(chain.in).toHaveBeenCalledWith('state', ['scheduled', 'live']);
    });

    it('orders by scheduled_at ascending', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      const parties = [
        sampleParty({ id: 'party-1', scheduled_at: '2026-07-20T10:00:00Z' }),
        sampleParty({ id: 'party-2', scheduled_at: '2026-07-20T18:00:00Z' }),
      ];
      const { chain } = chainMock({ data: parties, error: null });
      mockFrom.mockReturnValue(chain);

      await GET();

      // Verify ordering
      expect(chain.order).toHaveBeenCalledWith('scheduled_at', { ascending: true });
    });
  });

  describe('success response', () => {
    it('returns empty array when no parties found', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      const { chain } = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.parties).toEqual([]);
    });

    it('returns parties with all fields', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      const party = sampleParty();
      const { chain } = chainMock({ data: [party], error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.parties[0]).toMatchObject({
        id: 'party-123',
        title: 'ZAO Sunday Listening',
        host_fid: 123,
        state: 'scheduled',
      });
    });
  });

  describe('error handling', () => {
    it('returns 500 on Supabase error', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      const { chain } = chainMock({ data: null, error: new Error('DB connection failed') });
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to load listening parties');
    });

    it('returns 500 on query throw', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected query failure');
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to load listening parties');
    });
  });
});

// ── POST /api/music/listening-party ─────────────────────────────────────────

describe('POST /api/music/listening-party', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when no session', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Party',
          trackUrls: ['https://example.com/track.mp3'],
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 201 when authenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      const createdParty = sampleParty({ host_fid: 123 });
      const { chain } = chainMock({ data: createdParty, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'ZAO Sunday Listening',
          description: 'Vibes only',
          trackUrls: ['https://example.com/track1.mp3', 'https://example.com/track2.mp3'],
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.party).toMatchObject({
        id: 'party-123',
        title: 'ZAO Sunday Listening',
      });
    });
  });

  describe('request validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 when body is not valid JSON', async () => {
      const res = await POST(
        makeRequest('/api/music/listening-party', {
          method: 'POST',
          body: '{not json',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to create listening party');
    });

    it('returns 400 when title is missing', async () => {
      const res = await POST(
        makePostRequest('/api/music/listening-party', {
          trackUrls: ['https://example.com/track.mp3'],
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when title is empty string', async () => {
      const res = await POST(
        makePostRequest('/api/music/listening-party', {
          title: '',
          trackUrls: ['https://example.com/track.mp3'],
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when title exceeds 200 chars', async () => {
      const longTitle = 'a'.repeat(201);
      const res = await POST(
        makePostRequest('/api/music/listening-party', {
          title: longTitle,
          trackUrls: ['https://example.com/track.mp3'],
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when description exceeds 1000 chars', async () => {
      const longDescription = 'a'.repeat(1001);
      const res = await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Valid Title',
          description: longDescription,
          trackUrls: ['https://example.com/track.mp3'],
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when trackUrls is empty', async () => {
      const res = await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Valid Title',
          trackUrls: [],
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when trackUrls contains invalid URL', async () => {
      const res = await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Valid Title',
          trackUrls: ['not-a-url'],
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when trackUrls exceeds 50 items', async () => {
      const manyUrls = Array(51)
        .fill(0)
        .map((_, i) => `https://example.com/track${i}.mp3`);
      const res = await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Valid Title',
          trackUrls: manyUrls,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when URL exceeds 500 chars', async () => {
      const longUrl = `https://example.com/${'.'.repeat(500)}`;
      const res = await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Valid Title',
          trackUrls: [longUrl],
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when scheduledAt is not ISO datetime', async () => {
      const res = await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Valid Title',
          trackUrls: ['https://example.com/track.mp3'],
          scheduledAt: 'next friday',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('accepts valid ISO datetime for scheduledAt', async () => {
      const { chain } = chainMock({
        data: sampleParty({ scheduled_at: '2026-07-20T18:00:00Z' }),
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Valid Title',
          trackUrls: ['https://example.com/track.mp3'],
          scheduledAt: '2026-07-20T18:00:00Z',
        }),
      );

      expect(res.status).toBe(201);
    });
  });

  describe('insert behavior', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({
          fid: 123,
          username: 'testuser',
          displayName: 'Test User',
        }),
      );
    });

    it('inserts with host_fid and host_name from session', async () => {
      const createdParty = sampleParty({ host_fid: 123, host_name: 'Test User' });
      const { chain } = chainMock({ data: createdParty, error: null });
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Test Party',
          trackUrls: ['https://example.com/track.mp3'],
        }),
      );

      // Verify insert was called with session data
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          host_fid: 123,
          host_name: 'Test User',
          title: 'Test Party',
        }),
      );
    });

    it('sets state to "live" when scheduledAt is omitted', async () => {
      const createdParty = sampleParty({ state: 'live', started_at: expect.any(String) });
      const { chain } = chainMock({ data: createdParty, error: null });
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Test Party',
          trackUrls: ['https://example.com/track.mp3'],
        }),
      );

      // Verify state is 'live' and started_at is set
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'live',
          started_at: expect.any(String),
        }),
      );
    });

    it('sets state to "scheduled" when scheduledAt is provided', async () => {
      const createdParty = sampleParty({
        state: 'scheduled',
        started_at: null,
        scheduled_at: '2026-07-20T18:00:00Z',
      });
      const { chain } = chainMock({ data: createdParty, error: null });
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Test Party',
          trackUrls: ['https://example.com/track.mp3'],
          scheduledAt: '2026-07-20T18:00:00Z',
        }),
      );

      // Verify state is 'scheduled' and started_at is null
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'scheduled',
          started_at: null,
          scheduled_at: '2026-07-20T18:00:00Z',
        }),
      );
    });

    it('sets description to null when omitted', async () => {
      const createdParty = sampleParty({ description: null });
      const { chain } = chainMock({ data: createdParty, error: null });
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Test Party',
          trackUrls: ['https://example.com/track.mp3'],
        }),
      );

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
        }),
      );
    });

    it('preserves description when provided', async () => {
      const createdParty = sampleParty({ description: 'Test description' });
      const { chain } = chainMock({ data: createdParty, error: null });
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Test Party',
          description: 'Test description',
          trackUrls: ['https://example.com/track.mp3'],
        }),
      );

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Test description',
        }),
      );
    });

    it('calls .select() and .single() on insert', async () => {
      const createdParty = sampleParty();
      const { chain } = chainMock({ data: createdParty, error: null });
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Test Party',
          trackUrls: ['https://example.com/track.mp3'],
        }),
      );

      expect(chain.select).toHaveBeenCalled();
      expect(chain.single).toHaveBeenCalled();
    });
  });

  describe('success response', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 201 status', async () => {
      const createdParty = sampleParty();
      const { chain } = chainMock({ data: createdParty, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Test Party',
          trackUrls: ['https://example.com/track.mp3'],
        }),
      );

      expect(res.status).toBe(201);
    });

    it('returns the created party in the response', async () => {
      const createdParty = sampleParty({
        id: 'party-xyz',
        title: 'ZAO Sunday Listening',
        description: 'Vibes only',
      });
      const { chain } = chainMock({ data: createdParty, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'ZAO Sunday Listening',
          description: 'Vibes only',
          trackUrls: ['https://example.com/track.mp3'],
        }),
      );
      const body = await res.json();

      expect(body.party).toEqual(createdParty);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 on Supabase insert error', async () => {
      const { chain } = chainMock({ data: null, error: new Error('Duplicate key') });
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Test Party',
          trackUrls: ['https://example.com/track.mp3'],
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to create listening party');
    });

    it('returns 500 when insert throws unexpectedly', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const res = await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Test Party',
          trackUrls: ['https://example.com/track.mp3'],
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to create listening party');
    });

    it('logs error on Supabase failure', async () => {
      const { logger } = await import('@/lib/logger');
      const { chain } = chainMock({ data: null, error: new Error('DB error') });
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Test Party',
          trackUrls: ['https://example.com/track.mp3'],
        }),
      );

      expect(logger.error).toHaveBeenCalledWith(
        '[listening-party] POST failed:',
        expect.any(Error),
      );
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({
          fid: 123,
          username: 'testuser',
          displayName: null,
        }),
      );
    });

    it('handles null displayName in session', async () => {
      const createdParty = sampleParty({ host_name: null });
      const { chain } = chainMock({ data: createdParty, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Test Party',
          trackUrls: ['https://example.com/track.mp3'],
        }),
      );

      expect(res.status).toBe(201);
      // Verify that host_name falls back to username when displayName is null
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          host_name: expect.any(String),
        }),
      );
    });

    it('accepts description as empty string (treats as optional)', async () => {
      const createdParty = sampleParty();
      const { chain } = chainMock({ data: createdParty, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Test Party',
          description: '',
          trackUrls: ['https://example.com/track.mp3'],
        }),
      );

      expect(res.status).toBe(201);
    });

    it('accepts single track URL', async () => {
      const createdParty = sampleParty({
        track_urls: ['https://example.com/track.mp3'],
      });
      const { chain } = chainMock({ data: createdParty, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Test Party',
          trackUrls: ['https://example.com/track.mp3'],
        }),
      );

      expect(res.status).toBe(201);
    });

    it('accepts maximum 50 track URLs', async () => {
      const urls = Array(50)
        .fill(0)
        .map((_, i) => `https://example.com/track${i}.mp3`);
      const createdParty = sampleParty({ track_urls: urls });
      const { chain } = chainMock({ data: createdParty, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/music/listening-party', {
          title: 'Test Party',
          trackUrls: urls,
        }),
      );

      expect(res.status).toBe(201);
    });
  });
});
