import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockGetStorageUsage, mockLoggerError } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockGetStorageUsage: vi.fn(),
  mockLoggerError: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getStorageUsage: mockGetStorageUsage,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: mockLoggerError,
  },
}));

// ── Route import ─────────────────────────────────────────────────────────────
import { GET } from '@/app/api/users/storage/route';

describe('GET /api/users/storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 Unauthorized when no session', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await GET();
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 Unauthorized when session exists but has no fid', async () => {
      mockGetSessionData.mockResolvedValue({ username: 'testuser' });

      const res = await GET();
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('success path', () => {
    it('returns storage usage data when authenticated with valid fid', async () => {
      const mockSessionData = {
        fid: 12345,
        username: 'testuser',
      };
      const mockStorageData = {
        fid: 12345,
        used_bytes: 1024000,
        total_bytes: 104857600,
      };

      mockGetSessionData.mockResolvedValue(mockSessionData);
      mockGetStorageUsage.mockResolvedValue(mockStorageData);

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual(mockStorageData);
    });

    it('calls getStorageUsage with the fid from session', async () => {
      const mockSessionData = { fid: 99999, username: 'testuser' };
      const mockStorageData = { fid: 99999, used_bytes: 500, total_bytes: 1000 };

      mockGetSessionData.mockResolvedValue(mockSessionData);
      mockGetStorageUsage.mockResolvedValue(mockStorageData);

      await GET();

      expect(mockGetStorageUsage).toHaveBeenCalledWith(99999);
    });
  });

  describe('error handling', () => {
    it('returns 500 when getStorageUsage throws an error', async () => {
      const mockSessionData = { fid: 12345, username: 'testuser' };
      const testError = new Error('Network error from Neynar');

      mockGetSessionData.mockResolvedValue(mockSessionData);
      mockGetStorageUsage.mockRejectedValue(testError);

      const res = await GET();
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body).toEqual({ error: 'Failed to fetch storage usage' });
    });

    it('logs error when getStorageUsage fails', async () => {
      const mockSessionData = { fid: 12345, username: 'testuser' };
      const testError = new Error('API timeout');

      mockGetSessionData.mockResolvedValue(mockSessionData);
      mockGetStorageUsage.mockRejectedValue(testError);

      await GET();

      expect(mockLoggerError).toHaveBeenCalledWith('Storage usage fetch error:', testError);
    });

    it('returns 500 when getStorageUsage throws with unknown object', async () => {
      const mockSessionData = { fid: 12345, username: 'testuser' };

      mockGetSessionData.mockResolvedValue(mockSessionData);
      mockGetStorageUsage.mockRejectedValue('Unknown error string');

      const res = await GET();
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body).toEqual({ error: 'Failed to fetch storage usage' });
    });
  });
});
