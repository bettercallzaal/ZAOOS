import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makePostRequest,
  makeRequest,
  mockAuthenticatedSession,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
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

import { GET, POST } from '../route';

// ── Test constants ───────────────────────────────────────────────────────────

/** A valid future ISO datetime for scheduled_at. */
const FUTURE_TIME = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

/** A past ISO datetime — should fail validation. */
const PAST_TIME = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

/** Sample scheduled room from DB. */
const SAMPLE_ROOM = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Morning Standup',
  description: 'Daily team sync',
  host_fid: 123,
  host_name: 'Test User',
  host_pfp: 'https://pfp.example.com/123.jpg',
  scheduled_at: FUTURE_TIME,
  category: 'general',
  theme: 'default',
  state: 'scheduled',
  created_at: new Date().toISOString(),
};

const SAMPLE_ROOM_2 = {
  ...SAMPLE_ROOM,
  id: '660e8400-e29b-41d4-a716-446655440001',
  title: 'Music Session',
  category: 'music',
  state: 'live',
};

// ── GET tests ────────────────────────────────────────────────────────────────

describe('GET /api/spaces/scheduled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('successful fetch', () => {
    it('returns empty list when no rooms exist', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const { chain } = chainMock({ data: [] });
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.rooms).toEqual([]);
      expect(mockFrom).toHaveBeenCalledWith('scheduled_rooms');
    });

    it('returns scheduled rooms filtered by state and future time', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const { chain } = chainMock({ data: [SAMPLE_ROOM, SAMPLE_ROOM_2] });
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.rooms).toHaveLength(2);
      expect(body.rooms[0].id).toBe(SAMPLE_ROOM.id);
      expect(body.rooms[1].id).toBe(SAMPLE_ROOM_2.id);

      // Verify chain calls
      expect(chain.select).toHaveBeenCalledWith('*');
      expect(chain.in).toHaveBeenCalledWith('state', ['scheduled', 'live']);
      expect(chain.gte).toHaveBeenCalledWith('scheduled_at', expect.any(String));
      expect(chain.order).toHaveBeenCalledWith('scheduled_at', { ascending: true });
    });

    it('returns rooms sorted by scheduled_at ascending', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const room1 = { ...SAMPLE_ROOM, scheduled_at: FUTURE_TIME };
      const room2 = {
        ...SAMPLE_ROOM_2,
        scheduled_at: new Date(Date.now() + 7200000).toISOString(),
      };

      const { chain } = chainMock({ data: [room1, room2] });
      mockFrom.mockReturnValue(chain);

      await GET();

      expect(chain.order).toHaveBeenCalledWith('scheduled_at', { ascending: true });
    });
  });

  describe('database errors', () => {
    it('returns 500 when Supabase query fails', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const { chain } = chainMock({ error: new Error('Connection failed') });
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch scheduled rooms');
    });

    it('returns 500 when supabaseAdmin.from throws', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch scheduled rooms');
    });
  });
});

// ── POST tests ───────────────────────────────────────────────────────────────

describe('POST /api/spaces/scheduled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Standup',
        scheduledAt: FUTURE_TIME,
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('request body validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 when body is not valid JSON (req.json throws)', async () => {
      const req = makeRequest('/api/spaces/scheduled', {
        method: 'POST',
        body: '{not json}',
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to schedule room');
    });

    it('returns 400 when title is missing', async () => {
      const req = makePostRequest('/api/spaces/scheduled', {
        scheduledAt: FUTURE_TIME,
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when title is empty string', async () => {
      const req = makePostRequest('/api/spaces/scheduled', {
        title: '',
        scheduledAt: FUTURE_TIME,
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when title exceeds 100 characters', async () => {
      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'a'.repeat(101),
        scheduledAt: FUTURE_TIME,
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when scheduledAt is missing', async () => {
      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Standup',
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when scheduledAt is in the past', async () => {
      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Past Event',
        scheduledAt: PAST_TIME,
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when scheduledAt is not an ISO datetime', async () => {
      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Standup',
        scheduledAt: 'not-a-date',
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when description exceeds 500 characters', async () => {
      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Standup',
        scheduledAt: FUTURE_TIME,
        description: 'a'.repeat(501),
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when category is invalid', async () => {
      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Standup',
        scheduledAt: FUTURE_TIME,
        category: 'invalid-category',
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when theme exceeds 50 characters', async () => {
      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Standup',
        scheduledAt: FUTURE_TIME,
        theme: 'a'.repeat(51),
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });
  });

  describe('schema defaults', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('applies default category when omitted', async () => {
      const { chain } = chainMock({ data: SAMPLE_ROOM });
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Standup',
        scheduledAt: FUTURE_TIME,
      });

      await POST(req);

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'general',
        }),
      );
    });

    it('applies default theme when omitted', async () => {
      const { chain } = chainMock({ data: SAMPLE_ROOM });
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Standup',
        scheduledAt: FUTURE_TIME,
      });

      await POST(req);

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: 'default',
        }),
      );
    });

    it('applies default empty description when omitted', async () => {
      const { chain } = chainMock({ data: SAMPLE_ROOM });
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Standup',
        scheduledAt: FUTURE_TIME,
      });

      await POST(req);

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
        }),
      );
    });
  });

  describe('successful creation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({
          fid: 123,
          displayName: 'Test User',
          pfpUrl: 'https://pfp.example.com/123.jpg',
        }),
      );
    });

    it('creates a room with minimal fields', async () => {
      const { chain } = chainMock({ data: SAMPLE_ROOM });
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Standup',
        scheduledAt: FUTURE_TIME,
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.room).toEqual(SAMPLE_ROOM);
    });

    it('creates a room with all fields', async () => {
      const fullRoom = { ...SAMPLE_ROOM, description: 'Team sync' };
      const { chain } = chainMock({ data: fullRoom });
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Standup',
        description: 'Team sync',
        scheduledAt: FUTURE_TIME,
        category: 'music',
        theme: 'dark',
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.room).toEqual(fullRoom);
    });

    it('correctly formats insert payload with session data', async () => {
      const { chain } = chainMock({ data: SAMPLE_ROOM });
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Standup',
        description: 'Team sync',
        scheduledAt: FUTURE_TIME,
        category: 'podcast',
        theme: 'custom',
      });

      await POST(req);

      expect(chain.insert).toHaveBeenCalledWith({
        title: 'Standup',
        description: 'Team sync',
        host_fid: 123,
        host_name: 'Test User',
        host_pfp: 'https://pfp.example.com/123.jpg',
        scheduled_at: FUTURE_TIME,
        category: 'podcast',
        theme: 'custom',
      });
    });

    it('handles null pfpUrl from session', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({
          fid: 456,
          displayName: 'No PFP User',
          pfpUrl: null,
        }),
      );

      const { chain } = chainMock({ data: { ...SAMPLE_ROOM, host_fid: 456, host_pfp: null } });
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Standup',
        scheduledAt: FUTURE_TIME,
      });

      await POST(req);

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          host_fid: 456,
          host_pfp: null,
        }),
      );
    });

    it('chains select and single for insert query', async () => {
      const { chain } = chainMock({ data: SAMPLE_ROOM });
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Standup',
        scheduledAt: FUTURE_TIME,
      });

      await POST(req);

      expect(chain.select).toHaveBeenCalledWith();
      expect(chain.single).toHaveBeenCalledWith();
    });
  });

  describe('database errors', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 when Supabase insert fails', async () => {
      const { chain } = chainMock({ error: new Error('Unique constraint violated') });
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Standup',
        scheduledAt: FUTURE_TIME,
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to schedule room');
    });

    it('returns 500 when supabaseAdmin.from throws', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Standup',
        scheduledAt: FUTURE_TIME,
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to schedule room');
    });

    it('returns 500 when chain methods throw', async () => {
      mockFrom.mockReturnValue({
        insert: vi.fn().mockImplementation(() => {
          throw new Error('Insert failed');
        }),
      });

      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Standup',
        scheduledAt: FUTURE_TIME,
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to schedule room');
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('accepts title with exactly 100 characters', async () => {
      const { chain } = chainMock({ data: SAMPLE_ROOM });
      mockFrom.mockReturnValue(chain);

      const title100 = 'a'.repeat(100);
      const req = makePostRequest('/api/spaces/scheduled', {
        title: title100,
        scheduledAt: FUTURE_TIME,
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it('accepts description with exactly 500 characters', async () => {
      const { chain } = chainMock({ data: SAMPLE_ROOM });
      mockFrom.mockReturnValue(chain);

      const desc500 = 'a'.repeat(500);
      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Standup',
        description: desc500,
        scheduledAt: FUTURE_TIME,
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it('accepts theme with exactly 50 characters', async () => {
      const { chain } = chainMock({ data: SAMPLE_ROOM });
      mockFrom.mockReturnValue(chain);

      const theme50 = 'a'.repeat(50);
      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Standup',
        scheduledAt: FUTURE_TIME,
        theme: theme50,
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it('accepts all valid categories', async () => {
      const categories = ['general', 'music', 'podcast', 'ama', 'chill', 'dj-set'];
      const { chain } = chainMock({ data: SAMPLE_ROOM });
      mockFrom.mockReturnValue(chain);

      for (const category of categories) {
        const req = makePostRequest('/api/spaces/scheduled', {
          title: 'Standup',
          scheduledAt: FUTURE_TIME,
          category,
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
      }
    });

    it('schedules a room far in the future', async () => {
      const farFuture = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
      const { chain } = chainMock({ data: SAMPLE_ROOM });
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/spaces/scheduled', {
        title: 'Future Event',
        scheduledAt: farFuture,
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
    });
  });
});
