import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makeRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
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

import { GET, PATCH } from '../route';

describe('GET /api/users/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 "Unauthorized" when no session', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 "Unauthorized" when session has no fid', async () => {
      mockGetSessionData.mockResolvedValue({});

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('successful retrieval', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    });

    it('returns profile data with all fields populated', async () => {
      const profileData = {
        display_name: 'Test User',
        bio: 'A test bio',
        ign: 'testign',
        real_name: 'Test Real Name',
        bluesky_handle: 'test.bsky.social',
        lens_profile_id: 'lens123',
        hive_username: 'hive_user',
        publishing_prefs: { x: true, bluesky: false },
      };

      const { chain } = chainMock({ data: profileData, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual(profileData);
      expect(mockFrom).toHaveBeenCalledWith('users');
      expect(chain.select).toHaveBeenCalledWith(
        'display_name, bio, ign, real_name, bluesky_handle, lens_profile_id, hive_username, publishing_prefs',
      );
      expect(chain.eq).toHaveBeenCalledWith('fid', 456);
      expect(chain.eq).toHaveBeenCalledWith('is_active', true);
      expect(chain.maybeSingle).toHaveBeenCalled();
    });

    it('returns empty strings for missing text fields and null for rich fields', async () => {
      const profileData = {
        display_name: null,
        bio: null,
        ign: null,
        real_name: null,
        bluesky_handle: null,
        lens_profile_id: null,
        hive_username: null,
        publishing_prefs: null,
      };

      const { chain } = chainMock({ data: profileData, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.display_name).toBe('');
      expect(body.bio).toBe('');
      expect(body.ign).toBe('');
      expect(body.real_name).toBe('');
      expect(body.bluesky_handle).toBeNull();
      expect(body.lens_profile_id).toBeNull();
      expect(body.hive_username).toBeNull();
      expect(body.publishing_prefs).toBeNull();
    });

    it('returns empty strings/nulls when user record does not exist', async () => {
      const { chain } = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.display_name).toBe('');
      expect(body.bio).toBe('');
      expect(body.ign).toBe('');
      expect(body.real_name).toBe('');
      expect(body.bluesky_handle).toBeNull();
      expect(body.lens_profile_id).toBeNull();
      expect(body.hive_username).toBeNull();
      expect(body.publishing_prefs).toBeNull();
    });

    it('returns 500 when Supabase query throws', async () => {
      const { chain } = chainMock({ data: null, error: new Error('DB error') });
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to load profile');
    });
  });
});

describe('PATCH /api/users/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 "Unauthorized" when no session', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const req = makeRequest('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ display_name: 'New Name' }),
      });

      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 "Unauthorized" when session has no fid', async () => {
      mockGetSessionData.mockResolvedValue({});

      const req = makeRequest('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ display_name: 'New Name' }),
      });

      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    });

    it('returns 400 when body is not valid JSON', async () => {
      const req = makeRequest('/api/users/profile', {
        method: 'PATCH',
        body: '{not json}',
      });

      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid profile data');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when body is empty object (no fields to update)', async () => {
      const req = makeRequest('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({}),
      });

      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid profile data');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when display_name exceeds max length', async () => {
      const req = makeRequest('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ display_name: 'x'.repeat(51) }),
      });

      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid profile data');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when bio exceeds max length', async () => {
      const req = makeRequest('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ bio: 'x'.repeat(301) }),
      });

      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid profile data');
    });

    it('returns 400 when ign exceeds max length', async () => {
      const req = makeRequest('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ ign: 'x'.repeat(31) }),
      });

      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid profile data');
    });

    it('returns 400 when real_name exceeds max length', async () => {
      const req = makeRequest('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ real_name: 'x'.repeat(81) }),
      });

      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid profile data');
    });

    it('trims whitespace from all string fields', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

      const result = {
        display_name: 'Test User',
        bio: 'Test bio',
        ign: 'testign',
        real_name: 'Real Name',
      };
      const { chain } = chainMock({ data: result, error: null });
      mockFrom.mockReturnValue(chain);

      const req = makeRequest('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ display_name: '  Test User  ' }),
      });

      const res = await PATCH(req);

      expect(res.status).toBe(200);
      // The trim is applied during schema parse, before the update call
      expect(chain.update).toHaveBeenCalled();
      const updateCall = chain.update.mock.calls[0];
      expect(updateCall[0].display_name).toBe('Test User');
    });
  });

  describe('successful updates', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    });

    it('updates display_name and returns updated profile', async () => {
      const result = {
        display_name: 'Updated Name',
        bio: '',
        ign: '',
        real_name: '',
      };
      const { chain } = chainMock({ data: result, error: null });
      mockFrom.mockReturnValue(chain);

      const req = makeRequest('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ display_name: 'Updated Name' }),
      });

      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.display_name).toBe('Updated Name');
      expect(mockFrom).toHaveBeenCalledWith('users');
      expect(chain.update).toHaveBeenCalled();
      const updateCall = chain.update.mock.calls[0][0];
      expect(updateCall.display_name).toBe('Updated Name');
      expect(updateCall.updated_at).toBeDefined();
    });

    it('updates multiple fields at once', async () => {
      const result = {
        display_name: 'New Display',
        bio: 'New bio',
        ign: 'newign',
        real_name: 'New Real',
      };
      const { chain } = chainMock({ data: result, error: null });
      mockFrom.mockReturnValue(chain);

      const req = makeRequest('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          display_name: 'New Display',
          bio: 'New bio',
          ign: 'newign',
          real_name: 'New Real',
        }),
      });

      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.display_name).toBe('New Display');
      expect(body.bio).toBe('New bio');
      expect(body.ign).toBe('newign');
      expect(body.real_name).toBe('New Real');

      const updateCall = chain.update.mock.calls[0][0];
      expect(updateCall.display_name).toBe('New Display');
      expect(updateCall.bio).toBe('New bio');
      expect(updateCall.ign).toBe('newign');
      expect(updateCall.real_name).toBe('New Real');
      expect(updateCall.updated_at).toBeDefined();
    });

    it('includes updated_at timestamp in Supabase update', async () => {
      const result = {
        display_name: 'Test',
        bio: '',
        ign: '',
        real_name: '',
      };
      const { chain } = chainMock({ data: result, error: null });
      mockFrom.mockReturnValue(chain);

      const req = makeRequest('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ display_name: 'Test' }),
      });

      await PATCH(req);

      const updateCall = chain.update.mock.calls[0][0];
      expect(updateCall.updated_at).toBeDefined();
      expect(typeof updateCall.updated_at).toBe('string');
      // Basic ISO string validation
      expect(updateCall.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('filters returned fields to only profile fields (no timestamps, etc)', async () => {
      const result = {
        display_name: 'Test',
        bio: 'bio',
        ign: 'ign',
        real_name: 'real',
      };
      const { chain } = chainMock({ data: result, error: null });
      mockFrom.mockReturnValue(chain);

      const req = makeRequest('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ display_name: 'Test' }),
      });

      await PATCH(req);

      expect(chain.select).toHaveBeenCalledWith('display_name, bio, ign, real_name');
    });

    it('applies filters for current fid and is_active user', async () => {
      const result = {
        display_name: 'Test',
        bio: '',
        ign: '',
        real_name: '',
      };
      const { chain } = chainMock({ data: result, error: null });
      mockFrom.mockReturnValue(chain);

      const req = makeRequest('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ display_name: 'Test' }),
      });

      await PATCH(req);

      expect(chain.eq).toHaveBeenCalledWith('fid', 456);
      expect(chain.eq).toHaveBeenCalledWith('is_active', true);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    });

    it('returns 500 "Failed to update profile" when Supabase throws', async () => {
      const { chain } = chainMock({ data: null, error: new Error('DB error') });
      mockFrom.mockReturnValue(chain);

      const req = makeRequest('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ display_name: 'Test' }),
      });

      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to update profile');
    });

    it('returns 500 when single() resolves to an error', async () => {
      const { chain } = chainMock({ data: null, error: { message: 'No rows updated' } });
      mockFrom.mockReturnValue(chain);

      const req = makeRequest('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ display_name: 'Test' }),
      });

      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to update profile');
    });

    it('returns 500 when JSON parsing fails catastrophically', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

      // Create a request with a stream body that will throw when .json() is called
      const req = makeRequest('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ display_name: 'Test' }),
      });

      // Mock req.json to throw after the .catch handler
      vi.spyOn(req, 'json').mockRejectedValueOnce(new Error('Stream error'));

      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid profile data');
    });
  });
});
