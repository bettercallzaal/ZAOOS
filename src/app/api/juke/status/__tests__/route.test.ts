import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRequest } from '@/test-utils/api-helpers';

const mockEnv = vi.hoisted(() => ({
  JUKE_API_KEY: 'jk_sec_live_test' as string | undefined,
}));

const {
  mockGetJukeIntegrationManifest,
  mockFetchJukeChangelog,
  mockBuildResolutionIndex,
  mockGetJukeIntegrationStats,
  mockListRecentJukeSpaces,
  mockListRecentWebhookEvents,
} = vi.hoisted(() => ({
  mockGetJukeIntegrationManifest: vi.fn(),
  mockFetchJukeChangelog: vi.fn(),
  mockBuildResolutionIndex: vi.fn(),
  mockGetJukeIntegrationStats: vi.fn(),
  mockListRecentJukeSpaces: vi.fn(),
  mockListRecentWebhookEvents: vi.fn(),
}));

vi.mock('@/lib/env', () => ({ ENV: mockEnv }));

vi.mock('@/lib/spaces/jukeIntegrationManifest', () => ({
  getJukeIntegrationManifest: mockGetJukeIntegrationManifest,
}));

vi.mock('@/lib/spaces/jukeChangelog', () => ({
  fetchJukeChangelog: mockFetchJukeChangelog,
  buildResolutionIndex: mockBuildResolutionIndex,
}));

vi.mock('@/lib/spaces/jukeSpacesDb', () => ({
  getJukeIntegrationStats: mockGetJukeIntegrationStats,
  listRecentJukeSpaces: mockListRecentJukeSpaces,
  listRecentWebhookEvents: mockListRecentWebhookEvents,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

/** A minimal valid manifest from getJukeIntegrationManifest. */
const SAMPLE_MANIFEST = {
  version: '1.5',
  generated_at: '2026-07-16T12:00:00Z',
  about: {
    name: 'The ZAO',
    pitch: 'Decentralized impact network.',
    farcaster: 'https://warpcast.com/~/channel/zao',
    site: 'https://www.thezao.com',
    juke_path_a_route: '/live/{spaceId}',
    juke_path_b_route: '/api/juke/space',
    public_status_route: 'https://zaoos.com/juke-status',
  },
  shipped: [
    {
      id: 'path-a-iframe',
      title: 'Path A — keyless iframe',
      description: 'Embedded Juke',
      shippedAt: '2026-05-20',
      files: ['src/lib/spaces/juke.ts'],
    },
  ],
  open_asks: [
    {
      id: 'agents',
      title: 'Agent join surface',
      reason: 'ZOE in Juke rooms',
      blocks: 'ZOE-in-Juke',
      priority: 'p0' as const,
    },
  ],
  conventions: ['All Juke calls server-side'],
  contact: {
    zao_dev: '@zaal (Farcaster)',
    general: 'https://www.thezao.com',
    partnership: 'See /juke-status',
  },
  juke_release_feed: 'https://juke.audio/changelog.json',
};

/** A minimal changelog to test resolution index building. */
const SAMPLE_CHANGELOG = {
  version: 1,
  generated_at: '2026-07-16T12:00:00Z',
  canonical_spec: 'https://juke.audio/spec.json',
  skill_md: 'https://juke.audio/SKILL.md',
  entries: [
    {
      id: 'agents',
      shipped_at: '2026-07-15T10:00:00Z',
      category: 'core',
      title: 'Agent join',
      summary: 'Agents can join rooms',
      resolves: ['agents'],
    },
  ],
};

/** Sample stats from the database. */
const SAMPLE_STATS = {
  total_spaces: 42,
  active_rooms: 3,
  total_participants: 156,
};

/** Sample recent spaces. */
const SAMPLE_RECENT_SPACES = [
  {
    id: 'space-1',
    title: 'Fractal Call',
    status: 'active' as const,
    participant_count: 12,
    scheduled_at: null,
    started_at: '2026-07-16T11:00:00Z',
    ended_at: null,
    recording_url: null,
    updated_at: '2026-07-16T12:00:00Z',
  },
];

/** Sample recent webhook events. */
const SAMPLE_RECENT_EVENTS = [
  {
    id: 'evt-1',
    space_id: 'space-1',
    event_type: 'room.started',
    status: 'processed',
    created_at: '2026-07-16T11:00:00Z',
  },
];

describe('GET /api/juke/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.JUKE_API_KEY = 'jk_sec_live_test';
  });

  it('returns 200 with manifest and decorated open_asks on success', async () => {
    mockGetJukeIntegrationManifest.mockReturnValue(SAMPLE_MANIFEST);
    mockFetchJukeChangelog.mockResolvedValue(SAMPLE_CHANGELOG);
    mockBuildResolutionIndex.mockReturnValue(new Map([['agents', SAMPLE_CHANGELOG.entries[0]]]));
    mockGetJukeIntegrationStats.mockResolvedValue(SAMPLE_STATS);
    mockListRecentJukeSpaces.mockResolvedValue(SAMPLE_RECENT_SPACES);
    mockListRecentWebhookEvents.mockResolvedValue(SAMPLE_RECENT_EVENTS);

    const res = await GET(makeRequest('/api/juke/status'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('version', '1.5');
    expect(body).toHaveProperty('about');
    expect(body).toHaveProperty('shipped');
    expect(body).toHaveProperty('open_asks');
    expect(body).toHaveProperty('stats', SAMPLE_STATS);
    expect(body).toHaveProperty('recent_spaces', SAMPLE_RECENT_SPACES);
    expect(body).toHaveProperty('recent_events', SAMPLE_RECENT_EVENTS);
    expect(body).toHaveProperty('release_feed', 'https://juke.audio/changelog.json');
  });

  it('decorates open_asks with juke_resolved when changelog resolves them', async () => {
    mockGetJukeIntegrationManifest.mockReturnValue(SAMPLE_MANIFEST);
    mockFetchJukeChangelog.mockResolvedValue(SAMPLE_CHANGELOG);
    mockBuildResolutionIndex.mockReturnValue(new Map([['agents', SAMPLE_CHANGELOG.entries[0]]]));
    mockGetJukeIntegrationStats.mockResolvedValue(SAMPLE_STATS);
    mockListRecentJukeSpaces.mockResolvedValue([]);
    mockListRecentWebhookEvents.mockResolvedValue([]);

    const res = await GET(makeRequest('/api/juke/status'));
    const body = await res.json();

    const agentsAsk = body.open_asks.find(
      (ask: unknown) => (ask as Record<string, unknown>).id === 'agents',
    );
    expect(agentsAsk).toBeDefined();
    expect((agentsAsk as Record<string, unknown>).juke_resolved).toEqual(
      SAMPLE_CHANGELOG.entries[0],
    );
  });

  it('leaves open_asks unchanged when not resolved by changelog', async () => {
    mockGetJukeIntegrationManifest.mockReturnValue(SAMPLE_MANIFEST);
    mockFetchJukeChangelog.mockResolvedValue(SAMPLE_CHANGELOG);
    mockBuildResolutionIndex.mockReturnValue(new Map()); // Empty — no resolutions
    mockGetJukeIntegrationStats.mockResolvedValue(SAMPLE_STATS);
    mockListRecentJukeSpaces.mockResolvedValue([]);
    mockListRecentWebhookEvents.mockResolvedValue([]);

    const res = await GET(makeRequest('/api/juke/status'));
    const body = await res.json();

    const agentsAsk = body.open_asks.find(
      (ask: unknown) => (ask as Record<string, unknown>).id === 'agents',
    );
    expect(agentsAsk).toBeDefined();
    expect((agentsAsk as Record<string, unknown>).juke_resolved).toBeUndefined();
  });

  it('handles changelog fetch returning null', async () => {
    mockGetJukeIntegrationManifest.mockReturnValue(SAMPLE_MANIFEST);
    mockFetchJukeChangelog.mockResolvedValue(null); // Changelog unavailable
    mockBuildResolutionIndex.mockReturnValue(new Map()); // Empty on null input
    mockGetJukeIntegrationStats.mockResolvedValue(SAMPLE_STATS);
    mockListRecentJukeSpaces.mockResolvedValue([]);
    mockListRecentWebhookEvents.mockResolvedValue([]);

    const res = await GET(makeRequest('/api/juke/status'));
    expect(res.status).toBe(200);
    const body = await res.json();
    // open_asks should be unchanged (no juke_resolved decorations)
    expect(body.open_asks).toBeDefined();
  });

  it('handles getJukeIntegrationStats error gracefully', async () => {
    mockGetJukeIntegrationManifest.mockReturnValue(SAMPLE_MANIFEST);
    mockFetchJukeChangelog.mockResolvedValue(null);
    mockBuildResolutionIndex.mockReturnValue(new Map());
    mockGetJukeIntegrationStats.mockRejectedValue(new Error('db error'));
    mockListRecentJukeSpaces.mockResolvedValue([]);
    mockListRecentWebhookEvents.mockResolvedValue([]);

    const res = await GET(makeRequest('/api/juke/status'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats).toBeNull(); // Caught by .catch(() => null)
  });

  it('handles listRecentJukeSpaces error gracefully', async () => {
    mockGetJukeIntegrationManifest.mockReturnValue(SAMPLE_MANIFEST);
    mockFetchJukeChangelog.mockResolvedValue(null);
    mockBuildResolutionIndex.mockReturnValue(new Map());
    mockGetJukeIntegrationStats.mockResolvedValue(SAMPLE_STATS);
    mockListRecentJukeSpaces.mockRejectedValue(new Error('db error'));
    mockListRecentWebhookEvents.mockResolvedValue([]);

    const res = await GET(makeRequest('/api/juke/status'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.recent_spaces).toEqual([]); // Caught by .catch(() => [])
  });

  it('handles listRecentWebhookEvents error gracefully', async () => {
    mockGetJukeIntegrationManifest.mockReturnValue(SAMPLE_MANIFEST);
    mockFetchJukeChangelog.mockResolvedValue(null);
    mockBuildResolutionIndex.mockReturnValue(new Map());
    mockGetJukeIntegrationStats.mockResolvedValue(SAMPLE_STATS);
    mockListRecentJukeSpaces.mockResolvedValue(SAMPLE_RECENT_SPACES);
    mockListRecentWebhookEvents.mockRejectedValue(new Error('db error'));

    const res = await GET(makeRequest('/api/juke/status'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.recent_events).toEqual([]); // Caught by .catch(() => [])
  });

  it('returns correct Cache-Control headers', async () => {
    mockGetJukeIntegrationManifest.mockReturnValue(SAMPLE_MANIFEST);
    mockFetchJukeChangelog.mockResolvedValue(null);
    mockBuildResolutionIndex.mockReturnValue(new Map());
    mockGetJukeIntegrationStats.mockResolvedValue(SAMPLE_STATS);
    mockListRecentJukeSpaces.mockResolvedValue([]);
    mockListRecentWebhookEvents.mockResolvedValue([]);

    const res = await GET(makeRequest('/api/juke/status'));

    expect(res.headers.get('Cache-Control')).toBe(
      'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
    );
  });

  it('returns CORS open with Access-Control-Allow-Origin: *', async () => {
    mockGetJukeIntegrationManifest.mockReturnValue(SAMPLE_MANIFEST);
    mockFetchJukeChangelog.mockResolvedValue(null);
    mockBuildResolutionIndex.mockReturnValue(new Map());
    mockGetJukeIntegrationStats.mockResolvedValue(SAMPLE_STATS);
    mockListRecentJukeSpaces.mockResolvedValue([]);
    mockListRecentWebhookEvents.mockResolvedValue([]);

    const res = await GET(makeRequest('/api/juke/status'));

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('returns X-ZAO-Juke-Status header v3', async () => {
    mockGetJukeIntegrationManifest.mockReturnValue(SAMPLE_MANIFEST);
    mockFetchJukeChangelog.mockResolvedValue(null);
    mockBuildResolutionIndex.mockReturnValue(new Map());
    mockGetJukeIntegrationStats.mockResolvedValue(SAMPLE_STATS);
    mockListRecentJukeSpaces.mockResolvedValue([]);
    mockListRecentWebhookEvents.mockResolvedValue([]);

    const res = await GET(makeRequest('/api/juke/status'));

    expect(res.headers.get('X-ZAO-Juke-Status')).toBe('v3');
  });

  it('is publicly accessible (no auth check)', async () => {
    mockGetJukeIntegrationManifest.mockReturnValue(SAMPLE_MANIFEST);
    mockFetchJukeChangelog.mockResolvedValue(null);
    mockBuildResolutionIndex.mockReturnValue(new Map());
    mockGetJukeIntegrationStats.mockResolvedValue(SAMPLE_STATS);
    mockListRecentJukeSpaces.mockResolvedValue([]);
    mockListRecentWebhookEvents.mockResolvedValue([]);

    // No session is passed or checked — route should return 200
    const res = await GET(makeRequest('/api/juke/status'));

    expect(res.status).toBe(200);
  });

  it('always includes release_feed in response', async () => {
    mockGetJukeIntegrationManifest.mockReturnValue(SAMPLE_MANIFEST);
    mockFetchJukeChangelog.mockResolvedValue(null);
    mockBuildResolutionIndex.mockReturnValue(new Map());
    mockGetJukeIntegrationStats.mockResolvedValue(null); // All errors
    mockListRecentJukeSpaces.mockResolvedValue([]);
    mockListRecentWebhookEvents.mockResolvedValue([]);

    const res = await GET(makeRequest('/api/juke/status'));
    const body = await res.json();

    expect(body.release_feed).toBe('https://juke.audio/changelog.json');
  });
});
