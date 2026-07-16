import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  makeRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_UUID,
} from '@/test-utils/api-helpers';
import { DELETE, GET, POST } from '../route';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockCreateTarget, mockGetUserTargets, mockDeleteTarget } = vi.hoisted(
  () => ({
    mockGetSessionData: vi.fn(),
    mockCreateTarget: vi.fn(),
    mockGetUserTargets: vi.fn(),
    mockDeleteTarget: vi.fn(),
  }),
);

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/broadcast/targetsDb', () => ({
  createTarget: (data: unknown) => mockCreateTarget(data),
  deleteTarget: (id: unknown, fid: unknown) => mockDeleteTarget(id, fid),
  getUserTargets: (fid: unknown) => mockGetUserTargets(fid),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// ── Test data factories ──────────────────────────────────────────────────────
function createMockTarget(overrides: Record<string, unknown> = {}) {
  return {
    id: VALID_UUID,
    user_fid: 123,
    platform: 'youtube',
    name: 'My YouTube Channel',
    rtmp_url: 'rtmps://a.rtmp.youtube.com/live2',
    stream_key: 'test-key-123',
    provider: 'direct',
    is_active: true,
    created_at: '2026-07-01T10:00:00Z',
    updated_at: '2026-07-01T10:00:00Z',
    ...overrides,
  };
}

function createValidPostBody(overrides: Record<string, unknown> = {}) {
  return {
    platform: 'youtube',
    name: 'My Stream',
    rtmpUrl: 'rtmps://a.rtmp.youtube.com/live2',
    streamKey: 'test-stream-key',
    provider: 'direct',
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe('GET /api/broadcast/targets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const res = await GET();

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Unauthorized');
  });

  it('returns targets for authenticated user', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const targets = [
      createMockTarget({ name: 'YouTube Stream' }),
      createMockTarget({ id: 'uuid-2', name: 'Twitch Stream', platform: 'twitch' }),
    ];
    mockGetUserTargets.mockResolvedValue(targets);

    const res = await GET();

    expect(res.status).toBe(200);
    const body = (await res.json()) as { targets: unknown[] };
    expect(body.targets).toEqual(targets);
    expect(mockGetUserTargets).toHaveBeenCalledWith(123);
  });

  it('returns empty array when user has no targets', async () => {
    const session = mockAuthenticatedSession({ fid: 456 });
    mockGetSessionData.mockResolvedValue(session);
    mockGetUserTargets.mockResolvedValue([]);

    const res = await GET();

    expect(res.status).toBe(200);
    const body = (await res.json()) as { targets: unknown[] };
    expect(body.targets).toEqual([]);
  });

  it('returns 500 when getUserTargets throws', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);
    mockGetUserTargets.mockRejectedValue(new Error('Database error'));

    const res = await GET();

    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Failed to fetch targets');
  });
});

describe('POST /api/broadcast/targets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const body = createValidPostBody();
    const req = makePostRequest('/api/broadcast/targets', body);
    const res = await POST(req);

    expect(res.status).toBe(401);
    const responseBody = (await res.json()) as { error: string };
    expect(responseBody.error).toBe('Unauthorized');
  });

  it('creates a target with required fields', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const bodyData = {
      platform: 'youtube',
      name: 'My YouTube Stream',
      rtmpUrl: 'rtmps://a.rtmp.youtube.com/live2',
      streamKey: 'test-key-123',
    };
    const createdTarget = createMockTarget(bodyData);
    mockCreateTarget.mockResolvedValue(createdTarget);

    const req = makePostRequest('/api/broadcast/targets', bodyData);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { target: unknown };
    expect(body.target).toEqual(createdTarget);
    expect(mockCreateTarget).toHaveBeenCalledWith(
      expect.objectContaining({
        userFid: 123,
        platform: 'youtube',
        name: 'My YouTube Stream',
        rtmpUrl: 'rtmps://a.rtmp.youtube.com/live2',
        streamKey: 'test-key-123',
      }),
    );
  });

  it('creates a target with optional provider field', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const bodyData = {
      platform: 'twitch',
      name: 'My Twitch Stream',
      rtmpUrl: 'rtmps://live.twitch.tv/app',
      streamKey: 'test-twitch-key',
      provider: 'livepeer',
    };
    const createdTarget = createMockTarget(bodyData);
    mockCreateTarget.mockResolvedValue(createdTarget);

    const req = makePostRequest('/api/broadcast/targets', bodyData);
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockCreateTarget).toHaveBeenCalledWith(
      expect.objectContaining({
        userFid: 123,
        provider: 'livepeer',
      }),
    );
  });

  it('returns 400 when platform is invalid', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const bodyData = {
      platform: 'invalid-platform',
      name: 'My Stream',
      rtmpUrl: 'rtmps://example.com/live',
      streamKey: 'test-key',
    };

    const req = makePostRequest('/api/broadcast/targets', bodyData);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; details?: unknown };
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when name is missing', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const bodyData = {
      platform: 'youtube',
      rtmpUrl: 'rtmps://a.rtmp.youtube.com/live2',
      streamKey: 'test-key',
    };

    const req = makePostRequest('/api/broadcast/targets', bodyData);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when name is empty string', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const bodyData = {
      platform: 'youtube',
      name: '',
      rtmpUrl: 'rtmps://a.rtmp.youtube.com/live2',
      streamKey: 'test-key',
    };

    const req = makePostRequest('/api/broadcast/targets', bodyData);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when name exceeds max length', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const bodyData = {
      platform: 'youtube',
      name: 'a'.repeat(101),
      rtmpUrl: 'rtmps://a.rtmp.youtube.com/live2',
      streamKey: 'test-key',
    };

    const req = makePostRequest('/api/broadcast/targets', bodyData);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when rtmpUrl is missing', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const bodyData = {
      platform: 'youtube',
      name: 'My Stream',
      streamKey: 'test-key',
    };

    const req = makePostRequest('/api/broadcast/targets', bodyData);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when rtmpUrl is empty string', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const bodyData = {
      platform: 'youtube',
      name: 'My Stream',
      rtmpUrl: '',
      streamKey: 'test-key',
    };

    const req = makePostRequest('/api/broadcast/targets', bodyData);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when streamKey is missing', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const bodyData = {
      platform: 'youtube',
      name: 'My Stream',
      rtmpUrl: 'rtmps://a.rtmp.youtube.com/live2',
    };

    const req = makePostRequest('/api/broadcast/targets', bodyData);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when streamKey is empty string', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const bodyData = {
      platform: 'youtube',
      name: 'My Stream',
      rtmpUrl: 'rtmps://a.rtmp.youtube.com/live2',
      streamKey: '',
    };

    const req = makePostRequest('/api/broadcast/targets', bodyData);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when provider is invalid enum', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const bodyData = {
      platform: 'youtube',
      name: 'My Stream',
      rtmpUrl: 'rtmps://a.rtmp.youtube.com/live2',
      streamKey: 'test-key',
      provider: 'invalid-provider',
    };

    const req = makePostRequest('/api/broadcast/targets', bodyData);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Invalid input');
  });

  it('returns 500 when createTarget throws', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const bodyData = createValidPostBody();
    mockCreateTarget.mockRejectedValue(new Error('Database error'));

    const req = makePostRequest('/api/broadcast/targets', bodyData);
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Failed to create target');
  });

  it('supports all valid platform enums', async () => {
    const platforms = ['youtube', 'twitch', 'tiktok', 'facebook', 'kick', 'custom'];

    for (const platform of platforms) {
      vi.clearAllMocks();
      const session = mockAuthenticatedSession({ fid: 123 });
      mockGetSessionData.mockResolvedValue(session);

      const bodyData = {
        ...createValidPostBody(),
        platform,
      };
      const createdTarget = createMockTarget(bodyData);
      mockCreateTarget.mockResolvedValue(createdTarget);

      const req = makePostRequest('/api/broadcast/targets', bodyData);
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockCreateTarget).toHaveBeenCalled();
    }
  });

  it('supports all valid provider enums', async () => {
    const providers = ['direct', 'livepeer', 'restream'];

    for (const provider of providers) {
      vi.clearAllMocks();
      const session = mockAuthenticatedSession({ fid: 123 });
      mockGetSessionData.mockResolvedValue(session);

      const bodyData = {
        ...createValidPostBody(),
        provider,
      };
      const createdTarget = createMockTarget(bodyData);
      mockCreateTarget.mockResolvedValue(createdTarget);

      const req = makePostRequest('/api/broadcast/targets', bodyData);
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockCreateTarget).toHaveBeenCalledWith(expect.objectContaining({ provider }));
    }
  });
});

describe('DELETE /api/broadcast/targets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const req = makeRequest(`/api/broadcast/targets?id=${VALID_UUID}`, {
      method: 'DELETE',
    });
    const res = await DELETE(req);

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Unauthorized');
  });

  it('deletes a target when id is provided', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);
    mockDeleteTarget.mockResolvedValue(undefined);

    const req = makeRequest(`/api/broadcast/targets?id=${VALID_UUID}`, {
      method: 'DELETE',
    });
    const res = await DELETE(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
    expect(mockDeleteTarget).toHaveBeenCalledWith(VALID_UUID, 123);
  });

  it('returns 400 when id is missing', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const req = makeRequest('/api/broadcast/targets', {
      method: 'DELETE',
    });
    const res = await DELETE(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Target ID required');
    expect(mockDeleteTarget).not.toHaveBeenCalled();
  });

  it('returns 400 when id is empty string', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);

    const req = makeRequest('/api/broadcast/targets?id=', {
      method: 'DELETE',
    });
    const res = await DELETE(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Target ID required');
    expect(mockDeleteTarget).not.toHaveBeenCalled();
  });

  it('returns 500 when deleteTarget throws', async () => {
    const session = mockAuthenticatedSession({ fid: 123 });
    mockGetSessionData.mockResolvedValue(session);
    mockDeleteTarget.mockRejectedValue(new Error('Database error'));

    const req = makeRequest(`/api/broadcast/targets?id=${VALID_UUID}`, {
      method: 'DELETE',
    });
    const res = await DELETE(req);

    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Failed to delete target');
  });

  it('passes correct parameters to deleteTarget', async () => {
    const session = mockAuthenticatedSession({ fid: 456 });
    mockGetSessionData.mockResolvedValue(session);
    mockDeleteTarget.mockResolvedValue(undefined);

    const targetId = 'some-target-uuid';
    const req = makeRequest(`/api/broadcast/targets?id=${targetId}`, {
      method: 'DELETE',
    });
    const res = await DELETE(req);

    expect(res.status).toBe(200);
    expect(mockDeleteTarget).toHaveBeenCalledWith(targetId, 456);
  });
});
