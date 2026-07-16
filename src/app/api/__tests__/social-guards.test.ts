import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom, rpc: vi.fn() },
}));

vi.mock('@/lib/env', () => ({
  ENV: {
    NEYNAR_API_KEY: 'test-key',
    SESSION_SECRET: 'test-secret-that-is-at-least-32-chars-long',
  },
}));

// Import-safety mocks — the guard returns 401 before any of these run, so these
// exist only so the route modules load cleanly under test.
vi.mock('@/lib/farcaster/neynar', () => ({
  getUserByFid: vi.fn(),
  getUserByAddress: vi.fn(),
  searchUsers: vi.fn(),
  getUsersByFids: vi.fn(),
  getChannelFeed: vi.fn(),
  postCast: vi.fn(),
}));

vi.mock('@/lib/openrank/client', () => ({
  getEngagementScores: vi.fn(),
  getPersonalizedScores: vi.fn(),
  getChannelRankings: vi.fn(),
}));

// ── Route imports ────────────────────────────────────────────────────────────
import { GET as clustersGET } from '@/app/api/social/clusters/route';
import { GET as communityGraphGET } from '@/app/api/social/community-graph/route';
import { GET as compareGET } from '@/app/api/social/compare/route';
import { GET as engagementGET } from '@/app/api/social/engagement/route';
import { GET as engagementHeatmapGET } from '@/app/api/social/engagement-heatmap/route';
import { GET as growthGET } from '@/app/api/social/growth/route';
import { GET as spotlightGET } from '@/app/api/social/spotlight/route';
import { GET as suggestionsGET } from '@/app/api/social/suggestions/route';
import { GET as tasteMatchGET } from '@/app/api/social/taste-match/route';
import { GET as trendingGET } from '@/app/api/social/trending/route';
import { GET as trendingTopicsGET } from '@/app/api/social/trending-topics/route';
import { GET as unfollowersGET } from '@/app/api/social/unfollowers/route';

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options);
}

type RouteHandler = (req: NextRequest) => Promise<Response>;

// Every /api/social read route requires a session and returns 401/"Unauthorized"
// when there is none. (social/verifications is intentionally excluded — it does
// not use the standard guard.)
const unauthRoutes: [string, string, RouteHandler][] = [
  ['GET /api/social/growth', '/api/social/growth?fid=123', growthGET],
  ['GET /api/social/community-graph', '/api/social/community-graph', communityGraphGET],
  ['GET /api/social/suggestions', '/api/social/suggestions', suggestionsGET],
  ['GET /api/social/taste-match', '/api/social/taste-match?fid=123', tasteMatchGET],
  ['GET /api/social/unfollowers', '/api/social/unfollowers', unfollowersGET],
  ['GET /api/social/trending', '/api/social/trending', trendingGET],
  ['GET /api/social/trending-topics', '/api/social/trending-topics', trendingTopicsGET],
  ['GET /api/social/engagement-heatmap', '/api/social/engagement-heatmap', engagementHeatmapGET],
  ['GET /api/social/engagement', '/api/social/engagement', engagementGET],
  ['GET /api/social/spotlight', '/api/social/spotlight', spotlightGET],
  ['GET /api/social/clusters', '/api/social/clusters', clustersGET],
  ['GET /api/social/compare', '/api/social/compare?fid=123', compareGET],
];

describe('Social guards — unauthenticated requests return 401', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(null);
  });

  describe.each(unauthRoutes)('%s', (_label, url, handler) => {
    it('returns 401 with error "Unauthorized"', async () => {
      const res = await handler(makeRequest(url));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });
});
