import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

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

vi.mock('@/lib/farcaster/neynar', () => ({
  getChannelFeed: vi.fn().mockResolvedValue({ casts: [] }),
  postCast: vi.fn().mockResolvedValue({ cast: { hash: 'abc' } }),
  getUserByFid: vi.fn(),
  getUserByAddress: vi.fn(),
  searchUsers: vi.fn(),
}));

vi.mock('@/lib/notifications', () => ({
  createInAppNotification: vi.fn().mockResolvedValue(undefined),
  sendNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/bluesky/client', () => ({
  postToBluesky: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/respect/leaderboard', () => ({
  fetchLeaderboard: vi.fn().mockResolvedValue({ leaderboard: [], stats: {} }),
}));

vi.mock('@/lib/music/isMusicUrl', () => ({
  isMusicUrl: vi.fn().mockReturnValue('spotify'),
}));

// ── Route imports ────────────────────────────────────────────────────────────
import { POST as chatSendPOST } from '@/app/api/chat/send/route';
import { GET as chatMessagesGET } from '@/app/api/chat/messages/route';
import { GET as musicSubmissionsGET, POST as musicSubmissionsPOST, DELETE as musicSubmissionsDELETE } from '@/app/api/music/submissions/route';
import { GET as notificationsGET, PATCH as notificationsPATCH } from '@/app/api/notifications/route';
import { GET as respectLeaderboardGET } from '@/app/api/respect/leaderboard/route';

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options);
}

// ── Table-driven 401 tests ───────────────────────────────────────────────────
type RouteHandler = (req: NextRequest) => Promise<Response>;

const unauthRoutes: [string, string, RouteHandler, RequestInit?][] = [
  ['POST /api/chat/send', '/api/chat/send', chatSendPOST, { method: 'POST', body: JSON.stringify({ text: 'hi' }) }],
  ['GET  /api/chat/messages', '/api/chat/messages?channel=zao', chatMessagesGET],
  ['GET  /api/music/submissions', '/api/music/submissions', musicSubmissionsGET],
  ['POST /api/music/submissions', '/api/music/submissions', musicSubmissionsPOST, { method: 'POST', body: JSON.stringify({ url: 'https://open.spotify.com/track/123' }) }],
  ['DELETE /api/music/submissions', '/api/music/submissions', musicSubmissionsDELETE, { method: 'DELETE', body: JSON.stringify({ id: 'abc' }) }],
  ['GET  /api/notifications', '/api/notifications', notificationsGET],
  ['PATCH /api/notifications', '/api/notifications', notificationsPATCH, { method: 'PATCH', body: JSON.stringify({ all: true }) }],
  ['GET  /api/respect/leaderboard', '/api/respect/leaderboard', respectLeaderboardGET],
];

describe('Auth guards — unauthenticated requests return 401', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(null);
  });

  describe.each(unauthRoutes)('%s', (_label, url, handler, init) => {
    it('returns 401 with error "Unauthorized"', async () => {
      const req = makeRequest(url, init);
      const res = await handler(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });
});
