import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

const { mockGetDraftStats, mockPostizConfig, mockClipperConfig } = vi.hoisted(() => ({
  mockGetDraftStats: vi.fn(),
  mockPostizConfig: {
    apiKey: 'test-key-123',
    rateLimitPerHour: 90,
  },
  mockClipperConfig: {
    platforms: ['warpcast', 'x', 'bluesky', 'discord'] as const,
    videoMaxSizeMB: 500,
    captionMaxChars: 300,
  },
}));

vi.mock('@/lib/autocliper', () => ({
  getDraftStats: mockGetDraftStats,
  postizConfig: mockPostizConfig,
  clipperConfig: mockClipperConfig,
}));

import { GET } from '../route';

describe('GET /api/autocliper/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset config to default state
    mockPostizConfig.apiKey = 'test-key-123';
    mockPostizConfig.rateLimitPerHour = 90;
  });

  // ========================================================================
  // Success path tests
  // ========================================================================

  it('returns 200 with full status and stats on success', async () => {
    const mockStats = {
      total: 5,
      byStage: {
        draft: 2,
        approved: 1,
        published: 1,
        rejected: 1,
      },
    };

    mockGetDraftStats.mockReturnValue(mockStats);

    const res = await GET(makeGetRequest('/api/autocliper/status'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      success: true,
      status: {
        postizConfigured: true,
        ffmpegAvailable: true,
        storageReady: true,
      },
      config: {
        platforms: ['warpcast', 'x', 'bluesky', 'discord'],
        videoMaxSizeMB: 500,
        captionMaxChars: 300,
        postizRateLimitPerHour: 90,
      },
      stats: mockStats,
    });
  });

  it('returns empty draft stats when no clips exist', async () => {
    const mockStats = {
      total: 0,
      byStage: {
        draft: 0,
        approved: 0,
        published: 0,
        rejected: 0,
      },
    };

    mockGetDraftStats.mockReturnValue(mockStats);

    const res = await GET(makeGetRequest('/api/autocliper/status'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.stats).toEqual(mockStats);
  });

  // ========================================================================
  // Config flag tests
  // ========================================================================

  it('sets postizConfigured to true when apiKey is present', async () => {
    mockPostizConfig.apiKey = 'valid-api-key';

    const mockStats = {
      total: 0,
      byStage: {
        draft: 0,
        approved: 0,
        published: 0,
        rejected: 0,
      },
    };

    mockGetDraftStats.mockReturnValue(mockStats);

    const res = await GET(makeGetRequest('/api/autocliper/status'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status.postizConfigured).toBe(true);
  });

  it('sets postizConfigured to false when apiKey is empty string', async () => {
    mockPostizConfig.apiKey = '';

    const mockStats = {
      total: 0,
      byStage: {
        draft: 0,
        approved: 0,
        published: 0,
        rejected: 0,
      },
    };

    mockGetDraftStats.mockReturnValue(mockStats);

    const res = await GET(makeGetRequest('/api/autocliper/status'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status.postizConfigured).toBe(false);
  });

  it('sets postizConfigured to false when apiKey is undefined', async () => {
    mockPostizConfig.apiKey = undefined;

    const mockStats = {
      total: 0,
      byStage: {
        draft: 0,
        approved: 0,
        published: 0,
        rejected: 0,
      },
    };

    mockGetDraftStats.mockReturnValue(mockStats);

    const res = await GET(makeGetRequest('/api/autocliper/status'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status.postizConfigured).toBe(false);
  });

  it('sets postizConfigured to false when apiKey is null', async () => {
    mockPostizConfig.apiKey = null;

    const mockStats = {
      total: 0,
      byStage: {
        draft: 0,
        approved: 0,
        published: 0,
        rejected: 0,
      },
    };

    mockGetDraftStats.mockReturnValue(mockStats);

    const res = await GET(makeGetRequest('/api/autocliper/status'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status.postizConfigured).toBe(false);
  });

  // ========================================================================
  // Config values tests
  // ========================================================================

  it('includes clipper config in response', async () => {
    const mockStats = {
      total: 0,
      byStage: {
        draft: 0,
        approved: 0,
        published: 0,
        rejected: 0,
      },
    };

    mockGetDraftStats.mockReturnValue(mockStats);

    const res = await GET(makeGetRequest('/api/autocliper/status'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.config).toEqual({
      platforms: ['warpcast', 'x', 'bluesky', 'discord'],
      videoMaxSizeMB: 500,
      captionMaxChars: 300,
      postizRateLimitPerHour: 90,
    });
  });

  // ========================================================================
  // Error handling tests
  // ========================================================================

  it('returns 500 when getDraftStats throws an Error', async () => {
    const error = new Error('Stats retrieval failed');
    mockGetDraftStats.mockImplementation(() => {
      throw error;
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await GET(makeGetRequest('/api/autocliper/status'));
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body).toEqual({
      success: false,
      error: 'Stats retrieval failed',
    });

    expect(consoleSpy).toHaveBeenCalledWith('[api/autocliper/status]', 'Stats retrieval failed');

    consoleSpy.mockRestore();
  });

  it('returns 500 with "Unknown error" when getDraftStats throws a non-Error value', async () => {
    mockGetDraftStats.mockImplementation(() => {
      throw 'unexpected string error';
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await GET(makeGetRequest('/api/autocliper/status'));
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body).toEqual({
      success: false,
      error: 'Unknown error',
    });

    expect(consoleSpy).toHaveBeenCalledWith('[api/autocliper/status]', 'Unknown error');

    consoleSpy.mockRestore();
  });

  it('logs error with correct prefix when exception occurs', async () => {
    const error = new Error('Test error');
    mockGetDraftStats.mockImplementation(() => {
      throw error;
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await GET(makeGetRequest('/api/autocliper/status'));

    expect(consoleSpy).toHaveBeenCalledWith('[api/autocliper/status]', 'Test error');

    consoleSpy.mockRestore();
  });

  // ========================================================================
  // No authentication tests (route is public)
  // ========================================================================

  it('does not require authentication (no session needed)', async () => {
    const mockStats = {
      total: 1,
      byStage: {
        draft: 1,
        approved: 0,
        published: 0,
        rejected: 0,
      },
    };

    mockGetDraftStats.mockReturnValue(mockStats);

    // No session mocking — route should work without it
    const res = await GET(makeGetRequest('/api/autocliper/status'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
