import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chainMock, makeRequest, mockAuthenticatedSession } from '@/test-utils/api-helpers';

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
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// ── Import route handlers after mocks ────────────────────────────────────────
import { GET, PATCH } from '../route';

// ── Constants ────────────────────────────────────────────────────────────────
const DEFAULTS = { autoJoinGroup: true, allowNonZaoDms: false };

describe('/api/users/messaging-prefs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(null);
  });

  describe('GET', () => {
    describe('auth guard', () => {
      it('returns 401 when no session', async () => {
        mockGetSessionData.mockResolvedValue(null);

        const res = await GET();
        const body = await res.json();

        expect(res.status).toBe(401);
        expect(body.error).toBe('Unauthorized');
      });

      it('returns 401 when session has no fid', async () => {
        mockGetSessionData.mockResolvedValue({ username: 'testuser' });

        const res = await GET();
        const body = await res.json();

        expect(res.status).toBe(401);
        expect(body.error).toBe('Unauthorized');
      });
    });

    describe('success paths', () => {
      it('returns defaults when no user record exists', async () => {
        const session = mockAuthenticatedSession({ fid: 123 });
        mockGetSessionData.mockResolvedValue(session);

        const { chain } = chainMock({ data: null, error: null });
        mockFrom.mockReturnValue(chain);

        const res = await GET();
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual(DEFAULTS);
        expect(mockFrom).toHaveBeenCalledWith('users');
        expect(chain.select).toHaveBeenCalledWith('messaging_prefs');
        expect(chain.eq).toHaveBeenCalledWith('fid', 123);
      });

      it('returns user prefs merged with defaults', async () => {
        const session = mockAuthenticatedSession({ fid: 123 });
        mockGetSessionData.mockResolvedValue(session);

        const userPrefs = {
          autoJoinGroup: false,
          allowNonZaoDms: true,
        };
        const { chain } = chainMock({
          data: { messaging_prefs: userPrefs },
          error: null,
        });
        mockFrom.mockReturnValue(chain);

        const res = await GET();
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual(userPrefs);
      });

      it('merges partial prefs with defaults', async () => {
        const session = mockAuthenticatedSession({ fid: 456 });
        mockGetSessionData.mockResolvedValue(session);

        const partialPrefs = { autoJoinGroup: false };
        const { chain } = chainMock({
          data: { messaging_prefs: partialPrefs },
          error: null,
        });
        mockFrom.mockReturnValue(chain);

        const res = await GET();
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual({
          autoJoinGroup: false,
          allowNonZaoDms: false,
        });
      });

      it('filters for is_active = true', async () => {
        const session = mockAuthenticatedSession({ fid: 789 });
        mockGetSessionData.mockResolvedValue(session);

        const { chain } = chainMock({
          data: { messaging_prefs: {} },
          error: null,
        });
        mockFrom.mockReturnValue(chain);

        await GET();

        expect(chain.eq).toHaveBeenCalledWith('fid', 789);
        expect(chain.eq).toHaveBeenCalledWith('is_active', true);
      });
    });

    describe('error handling', () => {
      it('returns 500 when Supabase query fails', async () => {
        const session = mockAuthenticatedSession({ fid: 999 });
        mockGetSessionData.mockResolvedValue(session);

        const supabaseError = new Error('Connection failed');
        const { chain } = chainMock({
          data: null,
          error: supabaseError,
        });
        mockFrom.mockReturnValue(chain);

        const res = await GET();
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe('Failed to load preferences');
      });
    });
  });

  describe('PATCH', () => {
    describe('auth guard', () => {
      it('returns 401 when no session', async () => {
        mockGetSessionData.mockResolvedValue(null);

        const req = makeRequest('/api/users/messaging-prefs', {
          method: 'PATCH',
          body: JSON.stringify({ autoJoinGroup: false }),
        });
        const res = await PATCH(req);
        const body = await res.json();

        expect(res.status).toBe(401);
        expect(body.error).toBe('Unauthorized');
      });

      it('returns 401 when session has no fid', async () => {
        mockGetSessionData.mockResolvedValue({ username: 'testuser' });

        const req = makeRequest('/api/users/messaging-prefs', {
          method: 'PATCH',
          body: JSON.stringify({ autoJoinGroup: false }),
        });
        const res = await PATCH(req);
        const body = await res.json();

        expect(res.status).toBe(401);
        expect(body.error).toBe('Unauthorized');
      });
    });

    describe('request validation', () => {
      it('returns 400 for invalid JSON', async () => {
        const session = mockAuthenticatedSession({ fid: 123 });
        mockGetSessionData.mockResolvedValue(session);

        const req = makeRequest('/api/users/messaging-prefs', {
          method: 'PATCH',
          body: '{not valid json}',
        });
        const res = await PATCH(req);
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBe('Invalid preferences');
        expect(body.details).toBeDefined();
      });

      it('returns 400 for non-object body', async () => {
        const session = mockAuthenticatedSession({ fid: 123 });
        mockGetSessionData.mockResolvedValue(session);

        const req = makeRequest('/api/users/messaging-prefs', {
          method: 'PATCH',
          body: '"string"',
        });
        const res = await PATCH(req);
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBe('Invalid preferences');
        expect(body.details).toBeDefined();
      });

      it('returns 400 for invalid boolean values', async () => {
        const session = mockAuthenticatedSession({ fid: 123 });
        mockGetSessionData.mockResolvedValue(session);

        const req = makeRequest('/api/users/messaging-prefs', {
          method: 'PATCH',
          body: JSON.stringify({ autoJoinGroup: 'not a boolean' }),
        });
        const res = await PATCH(req);
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBe('Invalid preferences');
        expect(body.details).toBeDefined();
      });

      it('ignores unknown properties and updates valid ones', async () => {
        const session = mockAuthenticatedSession({ fid: 123 });
        mockGetSessionData.mockResolvedValue(session);

        const selectChain = chainMock({
          data: { messaging_prefs: DEFAULTS },
          error: null,
        });
        const updateChain = chainMock({
          data: null,
          error: null,
        });

        let callCount = 0;
        mockFrom.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return selectChain.chain;
          }
          return updateChain.chain;
        });

        // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
        updateChain.chain.then = vi.fn((resolve: (val: unknown) => void) =>
          resolve({ error: null }),
        );

        const req = makeRequest('/api/users/messaging-prefs', {
          method: 'PATCH',
          body: JSON.stringify({ autoJoinGroup: false, unknownProperty: true }),
        });
        const res = await PATCH(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual({
          autoJoinGroup: false,
          allowNonZaoDms: false,
        });
      });

      it('allows empty object', async () => {
        const session = mockAuthenticatedSession({ fid: 123 });
        mockGetSessionData.mockResolvedValue(session);

        const { chain } = chainMock({ data: null, error: null });
        mockFrom.mockReturnValue(chain);

        const req = makeRequest('/api/users/messaging-prefs', {
          method: 'PATCH',
          body: JSON.stringify({}),
        });
        const res = await PATCH(req);

        expect(res.status).toBe(200);
      });
    });

    describe('success paths', () => {
      it('updates single preference', async () => {
        const session = mockAuthenticatedSession({ fid: 123 });
        mockGetSessionData.mockResolvedValue(session);

        const selectChain = chainMock({
          data: { messaging_prefs: { autoJoinGroup: true, allowNonZaoDms: false } },
          error: null,
        });
        const updateChain = chainMock({
          data: null,
          error: null,
        });

        mockFrom.mockImplementation((table) => {
          if (table === 'users') {
            return selectChain.chain;
          }
          return updateChain.chain;
        });

        // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
        updateChain.chain.then = vi.fn((resolve: (val: unknown) => void) =>
          resolve({ error: null }),
        );

        const req = makeRequest('/api/users/messaging-prefs', {
          method: 'PATCH',
          body: JSON.stringify({ autoJoinGroup: false }),
        });
        const res = await PATCH(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual({
          autoJoinGroup: false,
          allowNonZaoDms: false,
        });
      });

      it('updates multiple preferences at once', async () => {
        const session = mockAuthenticatedSession({ fid: 456 });
        mockGetSessionData.mockResolvedValue(session);

        const selectChain = chainMock({
          data: { messaging_prefs: DEFAULTS },
          error: null,
        });
        const updateChain = chainMock({
          data: null,
          error: null,
        });

        mockFrom.mockImplementation(() => selectChain.chain);

        // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
        updateChain.chain.then = vi.fn((resolve: (val: unknown) => void) =>
          resolve({ error: null }),
        );

        const req = makeRequest('/api/users/messaging-prefs', {
          method: 'PATCH',
          body: JSON.stringify({
            autoJoinGroup: false,
            allowNonZaoDms: true,
          }),
        });

        // Mock the second from() call for update
        let callCount = 0;
        mockFrom.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return selectChain.chain;
          }
          return updateChain.chain;
        });

        const res = await PATCH(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual({
          autoJoinGroup: false,
          allowNonZaoDms: true,
        });
      });

      it('merges with existing preferences', async () => {
        const session = mockAuthenticatedSession({ fid: 789 });
        mockGetSessionData.mockResolvedValue(session);

        const existingPrefs = { autoJoinGroup: false };
        const selectChain = chainMock({
          data: { messaging_prefs: existingPrefs },
          error: null,
        });
        const updateChain = chainMock({
          data: null,
          error: null,
        });

        let callCount = 0;
        mockFrom.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return selectChain.chain;
          }
          return updateChain.chain;
        });

        // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
        updateChain.chain.then = vi.fn((resolve: (val: unknown) => void) =>
          resolve({ error: null }),
        );

        const req = makeRequest('/api/users/messaging-prefs', {
          method: 'PATCH',
          body: JSON.stringify({ allowNonZaoDms: true }),
        });
        const res = await PATCH(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual({
          autoJoinGroup: false,
          allowNonZaoDms: true,
        });
      });

      it('when no existing prefs, uses defaults then applies update', async () => {
        const session = mockAuthenticatedSession({ fid: 999 });
        mockGetSessionData.mockResolvedValue(session);

        const selectChain = chainMock({
          data: null,
          error: null,
        });
        const updateChain = chainMock({
          data: null,
          error: null,
        });

        let callCount = 0;
        mockFrom.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return selectChain.chain;
          }
          return updateChain.chain;
        });

        // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
        updateChain.chain.then = vi.fn((resolve: (val: unknown) => void) =>
          resolve({ error: null }),
        );

        const req = makeRequest('/api/users/messaging-prefs', {
          method: 'PATCH',
          body: JSON.stringify({ autoJoinGroup: false }),
        });
        const res = await PATCH(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual({
          autoJoinGroup: false,
          allowNonZaoDms: false,
        });
      });
    });

    describe('error handling', () => {
      it('returns 500 when select query fails', async () => {
        const session = mockAuthenticatedSession({ fid: 123 });
        mockGetSessionData.mockResolvedValue(session);

        const supabaseError = new Error('Connection failed');
        const { chain } = chainMock({
          data: null,
          error: supabaseError,
        });
        mockFrom.mockReturnValue(chain);

        const req = makeRequest('/api/users/messaging-prefs', {
          method: 'PATCH',
          body: JSON.stringify({ autoJoinGroup: false }),
        });
        const res = await PATCH(req);
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe('Failed to save preferences');
      });

      it('returns 500 when update query fails', async () => {
        const session = mockAuthenticatedSession({ fid: 456 });
        mockGetSessionData.mockResolvedValue(session);

        const selectChain = chainMock({
          data: { messaging_prefs: DEFAULTS },
          error: null,
        });
        const updateError = new Error('Write failed');
        const updateChain = chainMock({
          data: null,
          error: updateError,
        });

        let callCount = 0;
        mockFrom.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return selectChain.chain;
          }
          return updateChain.chain;
        });

        // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
        updateChain.chain.then = vi.fn((resolve: (val: unknown) => void) =>
          resolve({ error: updateError }),
        );

        const req = makeRequest('/api/users/messaging-prefs', {
          method: 'PATCH',
          body: JSON.stringify({ autoJoinGroup: false }),
        });
        const res = await PATCH(req);
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe('Failed to save preferences');
      });
    });
  });
});
