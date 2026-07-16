import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';
import { GET } from '../route';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

const { mockGetFrameCatalog, mockGetRelevantFrames } = vi.hoisted(() => ({
  mockGetFrameCatalog: vi.fn(),
  mockGetRelevantFrames: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: mockGetSessionData,
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getFrameCatalog: mockGetFrameCatalog,
  getRelevantFrames: mockGetRelevantFrames,
}));

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/miniapp/discover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when session is missing', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const req = makeGetRequest('/api/miniapp/discover');
      const res = await GET(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('mode: catalog (default)', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('calls getFrameCatalog with default limit when no params', async () => {
      const mockData = { frames: [{ id: 'frame1' }] };
      mockGetFrameCatalog.mockResolvedValue(mockData);

      const req = makeGetRequest('/api/miniapp/discover');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(mockData);
      expect(mockGetFrameCatalog).toHaveBeenCalledWith(20, undefined);
      expect(mockGetRelevantFrames).not.toHaveBeenCalled();
    });

    it('uses default limit (20) when mode is not provided', async () => {
      const mockData = { frames: [] };
      mockGetFrameCatalog.mockResolvedValue(mockData);

      const req = makeGetRequest('/api/miniapp/discover', {});
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockGetFrameCatalog).toHaveBeenCalledWith(20, undefined);
    });

    it('uses explicit mode=catalog with custom limit', async () => {
      const mockData = { frames: [{ id: 'frame2' }] };
      mockGetFrameCatalog.mockResolvedValue(mockData);

      const req = makeGetRequest('/api/miniapp/discover', {
        mode: 'catalog',
        limit: '35',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(mockData);
      expect(mockGetFrameCatalog).toHaveBeenCalledWith(35, undefined);
    });

    it('passes cursor to getFrameCatalog', async () => {
      const mockData = { frames: [], cursor: 'next123' };
      mockGetFrameCatalog.mockResolvedValue(mockData);

      const req = makeGetRequest('/api/miniapp/discover', {
        limit: '25',
        cursor: 'abc123def',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockGetFrameCatalog).toHaveBeenCalledWith(25, 'abc123def');
    });

    it('returns empty results when getFrameCatalog returns no frames', async () => {
      const mockData = { frames: [] };
      mockGetFrameCatalog.mockResolvedValue(mockData);

      const req = makeGetRequest('/api/miniapp/discover');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.frames).toEqual([]);
    });
  });

  describe('mode: relevant', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    });

    it('calls getRelevantFrames with fid and default limit', async () => {
      const mockData = { frames: [{ id: 'relevant1' }] };
      mockGetRelevantFrames.mockResolvedValue(mockData);

      const req = makeGetRequest('/api/miniapp/discover', {
        mode: 'relevant',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(mockData);
      expect(mockGetRelevantFrames).toHaveBeenCalledWith(456, 20);
      expect(mockGetFrameCatalog).not.toHaveBeenCalled();
    });

    it('passes custom limit to getRelevantFrames', async () => {
      const mockData = { frames: [] };
      mockGetRelevantFrames.mockResolvedValue(mockData);

      const req = makeGetRequest('/api/miniapp/discover', {
        mode: 'relevant',
        limit: '40',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockGetRelevantFrames).toHaveBeenCalledWith(456, 40);
    });

    it('does not use cursor param for relevant mode', async () => {
      const mockData = { frames: [] };
      mockGetRelevantFrames.mockResolvedValue(mockData);

      const req = makeGetRequest('/api/miniapp/discover', {
        mode: 'relevant',
        cursor: 'ignored',
      });
      const _res = await GET(req);

      // getRelevantFrames signature: (fid, limit) — no cursor param
      expect(mockGetRelevantFrames).toHaveBeenCalledWith(456, 20);
    });

    it('returns results from getRelevantFrames', async () => {
      const mockData = {
        frames: [
          { id: 'rel1', title: 'Frame 1' },
          { id: 'rel2', title: 'Frame 2' },
        ],
      };
      mockGetRelevantFrames.mockResolvedValue(mockData);

      const req = makeGetRequest('/api/miniapp/discover', {
        mode: 'relevant',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.frames).toHaveLength(2);
      expect(body.frames[0].id).toBe('rel1');
    });
  });

  describe('limit clamping', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
      mockGetFrameCatalog.mockResolvedValue({ frames: [] });
    });

    it('clamps limit to 50 when limit > 50', async () => {
      const req = makeGetRequest('/api/miniapp/discover', {
        limit: '100',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockGetFrameCatalog).toHaveBeenCalledWith(50, undefined);
    });

    it('allows limit exactly at 50', async () => {
      const req = makeGetRequest('/api/miniapp/discover', {
        limit: '50',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockGetFrameCatalog).toHaveBeenCalledWith(50, undefined);
    });

    it('allows limit below 50', async () => {
      const req = makeGetRequest('/api/miniapp/discover', {
        limit: '10',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockGetFrameCatalog).toHaveBeenCalledWith(10, undefined);
    });

    it('falls back to default limit (20) for a non-numeric limit string', async () => {
      const req = makeGetRequest('/api/miniapp/discover', {
        limit: 'notanumber',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      // Regression guard: a non-numeric limit must clamp to the default 20, never
      // pass NaN downstream to getFrameCatalog (String(NaN) → ?limit=NaN → Neynar 400 → 500).
      expect(mockGetFrameCatalog).toHaveBeenCalledWith(20, undefined);
    });

    it('falls back to default limit (20) for a negative limit', async () => {
      const req = makeGetRequest('/api/miniapp/discover', {
        limit: '-10',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      // A negative limit is invalid → clamp to default 20 (not passed through).
      expect(mockGetFrameCatalog).toHaveBeenCalledWith(20, undefined);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 500 when getFrameCatalog throws', async () => {
      mockGetFrameCatalog.mockRejectedValue(new Error('Neynar API error'));

      const req = makeGetRequest('/api/miniapp/discover');
      const res = await GET(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to fetch mini apps');
    });

    it('returns 500 when getRelevantFrames throws', async () => {
      mockGetRelevantFrames.mockRejectedValue(new Error('Network error'));

      const req = makeGetRequest('/api/miniapp/discover', {
        mode: 'relevant',
      });
      const res = await GET(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to fetch mini apps');
    });

    it('returns 500 for non-Error thrown values', async () => {
      mockGetFrameCatalog.mockRejectedValue('unexpected string error');

      const req = makeGetRequest('/api/miniapp/discover');
      const res = await GET(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to fetch mini apps');
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 789 }));
      mockGetFrameCatalog.mockResolvedValue({ frames: [] });
    });

    it('ignores empty cursor string (treats as undefined)', async () => {
      const req = makeGetRequest('/api/miniapp/discover', {
        cursor: '',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      // Empty string is falsy, so cursor should be undefined
      expect(mockGetFrameCatalog).toHaveBeenCalledWith(20, undefined);
    });

    it('handles whitespace in limit parameter', async () => {
      const req = makeGetRequest('/api/miniapp/discover', {
        limit: '  25  ',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      // parseInt handles leading/trailing whitespace
      expect(mockGetFrameCatalog).toHaveBeenCalledWith(25, undefined);
    });

    it('uses default limit when limit is 0', async () => {
      const req = makeGetRequest('/api/miniapp/discover', {
        limit: '0',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      // 0 is not a valid page size → clamp to the default 20.
      expect(mockGetFrameCatalog).toHaveBeenCalledWith(20, undefined);
    });

    it('preserves full session data beyond fid for relevant mode', async () => {
      const session = mockAuthenticatedSession({
        fid: 999,
        username: 'testuser',
        displayName: 'Test User',
      });
      mockGetSessionData.mockResolvedValue(session);
      mockGetRelevantFrames.mockResolvedValue({ frames: [] });

      const req = makeGetRequest('/api/miniapp/discover', {
        mode: 'relevant',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      // Only fid is used, but session should have other data
      expect(mockGetRelevantFrames).toHaveBeenCalledWith(999, 20);
    });

    it('handles case-sensitive mode parameter', async () => {
      mockGetRelevantFrames.mockResolvedValue({ frames: [] });

      const req = makeGetRequest('/api/miniapp/discover', {
        mode: 'Relevant',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      // 'Relevant' !== 'relevant', so falls through to catalog
      expect(mockGetFrameCatalog).toHaveBeenCalled();
      expect(mockGetRelevantFrames).not.toHaveBeenCalled();
    });
  });

  describe('response shape', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns JSON response for catalog mode', async () => {
      const mockData = {
        frames: [{ id: '1' }],
        cursor: 'next',
        total: 100,
      };
      mockGetFrameCatalog.mockResolvedValue(mockData);

      const req = makeGetRequest('/api/miniapp/discover');
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('application/json');
      const body = await res.json();
      expect(body).toEqual(mockData);
    });

    it('returns JSON response for relevant mode', async () => {
      const mockData = {
        frames: [{ id: '2' }],
      };
      mockGetRelevantFrames.mockResolvedValue(mockData);

      const req = makeGetRequest('/api/miniapp/discover', {
        mode: 'relevant',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('application/json');
      const body = await res.json();
      expect(body).toEqual(mockData);
    });

    it('returns error JSON with proper status code on failure', async () => {
      mockGetFrameCatalog.mockRejectedValue(new Error('API error'));

      const req = makeGetRequest('/api/miniapp/discover');
      const res = await GET(req);

      expect(res.status).toBe(500);
      expect(res.headers.get('content-type')).toContain('application/json');
      const body = await res.json();
      expect(body).toEqual({ error: 'Failed to fetch mini apps' });
    });
  });
});
