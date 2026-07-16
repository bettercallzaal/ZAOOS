import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makePostRequest,
  mockAdminSession,
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

import { GET, PUT } from '../route';

// ============================================================================
// GET /api/admin/poll-config (PUBLIC)
// ============================================================================

describe('GET /api/admin/poll-config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('public access (no auth required)', () => {
    it('returns 200 without requiring authentication', async () => {
      const chain = chainMock({
        data: null,
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET();

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalled();
    });
  });

  describe('successful read of existing config', () => {
    it('queries poll_config table by POLL_CONFIG_ID', async () => {
      const configData = {
        id: 'weekly-priority',
        choices: JSON.stringify(['Choice 1', 'Choice 2']),
        poll_title_template: 'Custom Title — Week of {date}',
        poll_body_template: 'Custom body',
        voting_duration_days: 5,
        updated_at: '2026-01-15T10:00:00Z',
        updated_by_fid: 123,
      };

      const chain = chainMock({ data: configData, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await GET();

      expect(mockFrom).toHaveBeenCalledWith('poll_config');
      expect(chain.select).toHaveBeenCalledWith('*');
      expect(chain.eq).toHaveBeenCalledWith('id', 'weekly-priority');
    });

    it('returns existing config with camelCase field names', async () => {
      const configData = {
        id: 'weekly-priority',
        choices: JSON.stringify(['Choice 1', 'Choice 2']),
        poll_title_template: 'Custom Title',
        poll_body_template: 'Custom body',
        voting_duration_days: 5,
        updated_at: '2026-01-15T10:00:00Z',
        updated_by_fid: 789,
      };

      const chain = chainMock({ data: configData, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({
        id: 'weekly-priority',
        choices: JSON.stringify(['Choice 1', 'Choice 2']),
        pollTitleTemplate: 'Custom Title',
        pollBodyTemplate: 'Custom body',
        votingDurationDays: 5,
        updatedAt: '2026-01-15T10:00:00Z',
        updatedByFid: 789,
      });
    });

    it('handles JSON-stringified choices field', async () => {
      const configData = {
        id: 'weekly-priority',
        choices: JSON.stringify(['Option A', 'Option B', 'Option C']),
        poll_title_template: 'Title',
        poll_body_template: null,
        voting_duration_days: 7,
        updated_at: '2026-01-15T10:00:00Z',
        updated_by_fid: 100,
      };

      const chain = chainMock({ data: configData, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(body.choices).toEqual(JSON.stringify(['Option A', 'Option B', 'Option C']));
    });

    it('handles null poll_body_template', async () => {
      const configData = {
        id: 'weekly-priority',
        choices: JSON.stringify(['A', 'B']),
        poll_title_template: 'Title',
        poll_body_template: null,
        voting_duration_days: 7,
        updated_at: '2026-01-15T10:00:00Z',
        updated_by_fid: 100,
      };

      const chain = chainMock({ data: configData, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(body.pollBodyTemplate).toBeNull();
    });
  });

  describe('fallback to defaults when no config exists', () => {
    it('returns defaults when no row found', async () => {
      const chain = chainMock({ data: null, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.id).toBe('weekly-priority');
      expect(body.pollTitleTemplate).toBe('ZAO Weekly Priority Vote — Week of {date}');
      expect(body.votingDurationDays).toBe(7);
      expect(body.updatedAt).toBeNull();
      expect(body.updatedByFid).toBeNull();
    });

    it('returns default choices from community.config when query returns null', async () => {
      const chain = chainMock({ data: null, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      // Verify choices come from communityConfig.snapshot.weeklyPollChoices
      expect(Array.isArray(body.choices)).toBe(true);
      expect(body.choices.length).toBeGreaterThan(0);
      expect(body.choices[0]).toBe('WAVEWARZ — Competitive Web3 music battles');
    });

    it('returns defaults when Supabase error occurs', async () => {
      const chain = chainMock({ data: null, error: new Error('DB error') }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.id).toBe('weekly-priority');
      expect(body.pollTitleTemplate).toBe('ZAO Weekly Priority Vote — Week of {date}');
    });

    it('does not expose error details in default response', async () => {
      const chain = chainMock({ data: null, error: new Error('Connection timeout') }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(body.error).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('returns 500 when exception is thrown during query', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch poll config');
    });

    it('logs error to logger.error when exception occurs', async () => {
      const { logger } = await import('@/lib/logger');
      mockFrom.mockImplementation(() => {
        throw new Error('Fetch failed');
      });

      await GET();

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        '[poll-config] GET error:',
        expect.any(Error),
      );
    });

    it('does not expose sensitive error details in response', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Password: secret123, host: db.example.com');
      });

      const res = await GET();
      const body = await res.json();

      expect(body.error).toBe('Failed to fetch poll config');
      expect(body.details).toBeUndefined();
    });
  });
});

// ============================================================================
// PUT /api/admin/poll-config (ADMIN-ONLY UPDATE)
// ============================================================================

describe('PUT /api/admin/poll-config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await PUT(makePostRequest('/api/admin/poll-config', { choices: ['A', 'B'] }));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const res = await PUT(makePostRequest('/api/admin/poll-config', { choices: ['A', 'B'] }));
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('input validation — choices field', () => {
    it('accepts valid choices array with 2 items', async () => {
      const chain = chainMock({
        data: {
          id: 'weekly-priority',
          choices: JSON.stringify(['Choice 1', 'Choice 2']),
          poll_title_template: 'Title',
          poll_body_template: null,
          voting_duration_days: 7,
          updated_at: '2026-01-15T10:00:00Z',
          updated_by_fid: 123,
        },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['Choice 1', 'Choice 2'],
        }),
      );

      expect(res.status).toBe(200);
    });

    it('accepts valid choices array with 20 items', async () => {
      const chain = chainMock({
        data: {
          id: 'weekly-priority',
          choices: JSON.stringify(Array.from({ length: 20 }, (_, i) => `Choice ${i + 1}`)),
          poll_title_template: 'Title',
          poll_body_template: null,
          voting_duration_days: 7,
          updated_at: '2026-01-15T10:00:00Z',
          updated_by_fid: 123,
        },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: Array.from({ length: 20 }, (_, i) => `Choice ${i + 1}`),
        }),
      );

      expect(res.status).toBe(200);
    });

    it('returns 400 when choices has only 1 item (min 2)', async () => {
      const res = await PUT(makePostRequest('/api/admin/poll-config', { choices: ['Only One'] }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when choices is empty array', async () => {
      const res = await PUT(makePostRequest('/api/admin/poll-config', { choices: [] }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when choices exceeds 20 items', async () => {
      const longChoices = Array.from({ length: 21 }, (_, i) => `Choice ${i + 1}`);
      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: longChoices,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when choice string exceeds 200 chars', async () => {
      const longChoice = 'a'.repeat(201);
      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['Valid', longChoice],
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts choice string with exactly 200 chars', async () => {
      const maxChoice = 'a'.repeat(200);
      const chain = chainMock({
        data: {
          id: 'weekly-priority',
          choices: JSON.stringify(['Valid', maxChoice]),
          poll_title_template: 'Title',
          poll_body_template: null,
          voting_duration_days: 7,
          updated_at: '2026-01-15T10:00:00Z',
          updated_by_fid: 123,
        },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['Valid', maxChoice],
        }),
      );

      expect(res.status).toBe(200);
    });

    it('returns 400 when choices is missing', async () => {
      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          pollTitleTemplate: 'Some title',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when choices is not an array', async () => {
      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: 'not-an-array',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('input validation — optional fields', () => {
    it('accepts optional pollTitleTemplate (max 500 chars)', async () => {
      const chain = chainMock({
        data: {
          id: 'weekly-priority',
          choices: JSON.stringify(['A', 'B']),
          poll_title_template: 'Custom title',
          poll_body_template: null,
          voting_duration_days: 7,
          updated_at: '2026-01-15T10:00:00Z',
          updated_by_fid: 123,
        },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['A', 'B'],
          pollTitleTemplate: 'Custom title',
        }),
      );

      expect(res.status).toBe(200);
    });

    it('returns 400 when pollTitleTemplate exceeds 500 chars', async () => {
      const longTitle = 'a'.repeat(501);
      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['A', 'B'],
          pollTitleTemplate: longTitle,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts pollTitleTemplate with exactly 500 chars', async () => {
      const maxTitle = 'a'.repeat(500);
      const chain = chainMock({
        data: {
          id: 'weekly-priority',
          choices: JSON.stringify(['A', 'B']),
          poll_title_template: maxTitle,
          poll_body_template: null,
          voting_duration_days: 7,
          updated_at: '2026-01-15T10:00:00Z',
          updated_by_fid: 123,
        },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['A', 'B'],
          pollTitleTemplate: maxTitle,
        }),
      );

      expect(res.status).toBe(200);
    });

    it('accepts optional pollBodyTemplate (max 2000 chars)', async () => {
      const chain = chainMock({
        data: {
          id: 'weekly-priority',
          choices: JSON.stringify(['A', 'B']),
          poll_title_template: 'Title',
          poll_body_template: 'Custom body text',
          voting_duration_days: 7,
          updated_at: '2026-01-15T10:00:00Z',
          updated_by_fid: 123,
        },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['A', 'B'],
          pollBodyTemplate: 'Custom body text',
        }),
      );

      expect(res.status).toBe(200);
    });

    it('returns 400 when pollBodyTemplate exceeds 2000 chars', async () => {
      const longBody = 'a'.repeat(2001);
      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['A', 'B'],
          pollBodyTemplate: longBody,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts pollBodyTemplate with exactly 2000 chars', async () => {
      const maxBody = 'a'.repeat(2000);
      const chain = chainMock({
        data: {
          id: 'weekly-priority',
          choices: JSON.stringify(['A', 'B']),
          poll_title_template: 'Title',
          poll_body_template: maxBody,
          voting_duration_days: 7,
          updated_at: '2026-01-15T10:00:00Z',
          updated_by_fid: 123,
        },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['A', 'B'],
          pollBodyTemplate: maxBody,
        }),
      );

      expect(res.status).toBe(200);
    });

    it('accepts optional votingDurationDays (1-30)', async () => {
      const chain = chainMock({
        data: {
          id: 'weekly-priority',
          choices: JSON.stringify(['A', 'B']),
          poll_title_template: 'Title',
          poll_body_template: null,
          voting_duration_days: 10,
          updated_at: '2026-01-15T10:00:00Z',
          updated_by_fid: 123,
        },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['A', 'B'],
          votingDurationDays: 10,
        }),
      );

      expect(res.status).toBe(200);
    });

    it('accepts votingDurationDays = 1 (minimum)', async () => {
      const chain = chainMock({
        data: {
          id: 'weekly-priority',
          choices: JSON.stringify(['A', 'B']),
          poll_title_template: 'Title',
          poll_body_template: null,
          voting_duration_days: 1,
          updated_at: '2026-01-15T10:00:00Z',
          updated_by_fid: 123,
        },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['A', 'B'],
          votingDurationDays: 1,
        }),
      );

      expect(res.status).toBe(200);
    });

    it('accepts votingDurationDays = 30 (maximum)', async () => {
      const chain = chainMock({
        data: {
          id: 'weekly-priority',
          choices: JSON.stringify(['A', 'B']),
          poll_title_template: 'Title',
          poll_body_template: null,
          voting_duration_days: 30,
          updated_at: '2026-01-15T10:00:00Z',
          updated_by_fid: 123,
        },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['A', 'B'],
          votingDurationDays: 30,
        }),
      );

      expect(res.status).toBe(200);
    });

    it('returns 400 when votingDurationDays is 0 (below minimum)', async () => {
      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['A', 'B'],
          votingDurationDays: 0,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when votingDurationDays exceeds 30', async () => {
      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['A', 'B'],
          votingDurationDays: 31,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when votingDurationDays is not an integer', async () => {
      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['A', 'B'],
          votingDurationDays: 7.5,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('Supabase upsert operation', () => {
    it('calls supabaseAdmin.from with poll_config table', async () => {
      const chain = chainMock({
        data: {
          id: 'weekly-priority',
          choices: JSON.stringify(['A', 'B']),
          poll_title_template: 'Title',
          poll_body_template: null,
          voting_duration_days: 7,
          updated_at: '2026-01-15T10:00:00Z',
          updated_by_fid: 123,
        },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['A', 'B'],
        }),
      );

      expect(mockFrom).toHaveBeenCalledWith('poll_config');
    });

    it('performs upsert with correct ID and merged fields', async () => {
      const chain = chainMock({
        data: {
          id: 'weekly-priority',
          choices: JSON.stringify(['A', 'B']),
          poll_title_template: 'Custom',
          poll_body_template: null,
          voting_duration_days: 7,
          updated_at: '2026-01-15T10:00:00Z',
          updated_by_fid: 123,
        },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['A', 'B'],
          pollTitleTemplate: 'Custom',
        }),
      );

      const upsertCall = vi.mocked(chain.upsert);
      expect(upsertCall).toHaveBeenCalled();
      const [payload] = upsertCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(payload).toMatchObject({
        id: 'weekly-priority',
        choices: JSON.stringify(['A', 'B']),
        poll_title_template: 'Custom',
        updated_by_fid: 123,
      });
    });

    it('applies default poll_title_template when not provided', async () => {
      const chain = chainMock({
        data: {
          id: 'weekly-priority',
          choices: JSON.stringify(['A', 'B']),
          poll_title_template: 'ZAO Weekly Priority Vote — Week of {date}',
          poll_body_template: null,
          voting_duration_days: 7,
          updated_at: '2026-01-15T10:00:00Z',
          updated_by_fid: 123,
        },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['A', 'B'],
        }),
      );

      const upsertCall = vi.mocked(chain.upsert);
      const [payload] = upsertCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(payload.poll_title_template).toBe('ZAO Weekly Priority Vote — Week of {date}');
    });

    it('applies default poll_body_template (null) when not provided', async () => {
      const chain = chainMock({
        data: {
          id: 'weekly-priority',
          choices: JSON.stringify(['A', 'B']),
          poll_title_template: 'Title',
          poll_body_template: null,
          voting_duration_days: 7,
          updated_at: '2026-01-15T10:00:00Z',
          updated_by_fid: 123,
        },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['A', 'B'],
        }),
      );

      const upsertCall = vi.mocked(chain.upsert);
      const [payload] = upsertCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(payload.poll_body_template).toBeNull();
    });

    it('applies default voting_duration_days = 7 when not provided', async () => {
      const chain = chainMock({
        data: {
          id: 'weekly-priority',
          choices: JSON.stringify(['A', 'B']),
          poll_title_template: 'Title',
          poll_body_template: null,
          voting_duration_days: 7,
          updated_at: '2026-01-15T10:00:00Z',
          updated_by_fid: 123,
        },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['A', 'B'],
        }),
      );

      const upsertCall = vi.mocked(chain.upsert);
      const [payload] = upsertCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(payload.voting_duration_days).toBe(7);
    });

    it('sets updated_at to ISO string on upsert', async () => {
      const chain = chainMock({
        data: {
          id: 'weekly-priority',
          choices: JSON.stringify(['A', 'B']),
          poll_title_template: 'Title',
          poll_body_template: null,
          voting_duration_days: 7,
          updated_at: '2026-01-15T10:00:00Z',
          updated_by_fid: 123,
        },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['A', 'B'],
        }),
      );

      const upsertCall = vi.mocked(chain.upsert);
      const [payload] = upsertCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(typeof payload.updated_at).toBe('string');
      // Verify it's a valid ISO string
      expect(new Date(payload.updated_at as string).getTime()).not.toBeNaN();
    });

    it('sets updated_by_fid to current session FID', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
      const chain = chainMock({
        data: {
          id: 'weekly-priority',
          choices: JSON.stringify(['A', 'B']),
          poll_title_template: 'Title',
          poll_body_template: null,
          voting_duration_days: 7,
          updated_at: '2026-01-15T10:00:00Z',
          updated_by_fid: 999,
        },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['A', 'B'],
        }),
      );

      const upsertCall = vi.mocked(chain.upsert);
      const [payload] = upsertCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(payload.updated_by_fid).toBe(999);
    });

    it('specifies onConflict: id to update on duplicate', async () => {
      const chain = chainMock({
        data: {
          id: 'weekly-priority',
          choices: JSON.stringify(['A', 'B']),
          poll_title_template: 'Title',
          poll_body_template: null,
          voting_duration_days: 7,
          updated_at: '2026-01-15T10:00:00Z',
          updated_by_fid: 123,
        },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['A', 'B'],
        }),
      );

      const upsertCall = vi.mocked(chain.upsert);
      const _payload = upsertCall.mock.calls[0][0];
      const options = upsertCall.mock.calls[0][1];

      expect(options).toEqual({ onConflict: 'id' });
    });
  });

  describe('success response', () => {
    it('returns 200 with camelCase field names', async () => {
      const configData = {
        id: 'weekly-priority',
        choices: JSON.stringify(['Choice A', 'Choice B']),
        poll_title_template: 'Updated Title',
        poll_body_template: 'Updated Body',
        voting_duration_days: 5,
        updated_at: '2026-01-15T10:00:00Z',
        updated_by_fid: 123,
      };

      const chain = chainMock({ data: configData, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['Choice A', 'Choice B'],
          pollTitleTemplate: 'Updated Title',
          pollBodyTemplate: 'Updated Body',
          votingDurationDays: 5,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({
        id: 'weekly-priority',
        choices: JSON.stringify(['Choice A', 'Choice B']),
        pollTitleTemplate: 'Updated Title',
        pollBodyTemplate: 'Updated Body',
        votingDurationDays: 5,
        updatedAt: '2026-01-15T10:00:00Z',
        updatedByFid: 123,
      });
    });

    it('returns updated choices as JSON string from supabase', async () => {
      const configData = {
        id: 'weekly-priority',
        choices: JSON.stringify(['New Choice 1', 'New Choice 2']),
        poll_title_template: 'Title',
        poll_body_template: null,
        voting_duration_days: 7,
        updated_at: '2026-01-15T10:00:00Z',
        updated_by_fid: 123,
      };

      const chain = chainMock({ data: configData, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['New Choice 1', 'New Choice 2'],
        }),
      );
      const body = await res.json();

      expect(body.choices).toEqual(JSON.stringify(['New Choice 1', 'New Choice 2']));
    });
  });

  describe('error handling', () => {
    it('returns 500 when Supabase upsert returns error', async () => {
      const dbError = new Error('Database connection failed');
      const chain = chainMock({ data: null, error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PUT(makePostRequest('/api/admin/poll-config', { choices: ['A', 'B'] }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to save poll config');
    });

    it('returns 500 when request body is not valid JSON', async () => {
      const malformedReq = new (await import('next/server')).NextRequest(
        new URL('/api/admin/poll-config', 'http://localhost:3000'),
        {
          method: 'PUT',
          body: '{invalid json',
        },
      );

      const res = await PUT(malformedReq);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to update poll config');
    });

    it('logs error to logger.error when exception occurs during upsert', async () => {
      const { logger } = await import('@/lib/logger');
      mockFrom.mockImplementation(() => {
        throw new Error('Upsert failed');
      });

      await PUT(makePostRequest('/api/admin/poll-config', { choices: ['A', 'B'] }));

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        '[poll-config] PUT error:',
        expect.any(Error),
      );
    });

    it('logs error to logger.error when exception occurs during body parsing', async () => {
      const { logger } = await import('@/lib/logger');
      const malformedReq = new (await import('next/server')).NextRequest(
        new URL('/api/admin/poll-config', 'http://localhost:3000'),
        {
          method: 'PUT',
          body: '{invalid json',
        },
      );

      await PUT(malformedReq);

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        '[poll-config] PUT error:',
        expect.any(Error),
      );
    });

    it('does not expose sensitive error details in response', async () => {
      const dbError = new Error('Connection to db.example.com:5432 failed, password: secret123');
      const chain = chainMock({ data: null, error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PUT(makePostRequest('/api/admin/poll-config', { choices: ['A', 'B'] }));
      const body = await res.json();

      expect(body.error).toBe('Failed to save poll config');
      expect(body.details).toBeUndefined();
      expect(body.errorMessage).toBeUndefined();
    });

    it('returns validation errors in details field', async () => {
      const res = await PUT(
        makePostRequest('/api/admin/poll-config', {
          choices: ['Only One'],
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(typeof body.details).toBe('object');
    });
  });
});
