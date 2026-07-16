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

import { GET as chatMessagesGET } from '@/app/api/chat/messages/route';
// ── Route imports ────────────────────────────────────────────────────────────
import { POST as chatSendPOST } from '@/app/api/chat/send/route';
import { GET as membersMeGET, POST as membersMePOST } from '@/app/api/members/me/route';
import { GET as membersNftsGET } from '@/app/api/members/nfts/route';
import { GET as musicCuratorsGET } from '@/app/api/music/curators/route';
import { GET as musicDigestGET } from '@/app/api/music/digest/route';
import { GET as musicLyricsGET } from '@/app/api/music/lyrics/route';
import { GET as musicPlaylistsGET } from '@/app/api/music/playlists/route';
import {
  DELETE as musicSubmissionsDELETE,
  GET as musicSubmissionsGET,
  POST as musicSubmissionsPOST,
} from '@/app/api/music/submissions/route';
import {
  GET as notificationsGET,
  PATCH as notificationsPATCH,
} from '@/app/api/notifications/route';
import { GET as respectLeaderboardGET } from '@/app/api/respect/leaderboard/route';
import { DELETE as usersBlockDELETE, POST as usersBlockPOST } from '@/app/api/users/block/route';
import { POST as usersFollowBatchPOST } from '@/app/api/users/follow-batch/route';
import { DELETE as usersMuteDELETE, POST as usersMutePOST } from '@/app/api/users/mute/route';
import { GET as usersProfileGET, PATCH as usersProfilePATCH } from '@/app/api/users/profile/route';
import { GET as usersSocialsGET, PATCH as usersSocialsPATCH } from '@/app/api/users/socials/route';

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options);
}

// ── Table-driven 401 tests ───────────────────────────────────────────────────
type RouteHandler = (req: NextRequest) => Promise<Response>;

const unauthRoutes: [string, string, RouteHandler, RequestInit?][] = [
  [
    'POST /api/chat/send',
    '/api/chat/send',
    chatSendPOST,
    { method: 'POST', body: JSON.stringify({ text: 'hi' }) },
  ],
  ['GET  /api/chat/messages', '/api/chat/messages?channel=zao', chatMessagesGET],
  ['GET  /api/music/submissions', '/api/music/submissions', musicSubmissionsGET],
  [
    'POST /api/music/submissions',
    '/api/music/submissions',
    musicSubmissionsPOST,
    { method: 'POST', body: JSON.stringify({ url: 'https://open.spotify.com/track/123' }) },
  ],
  [
    'DELETE /api/music/submissions',
    '/api/music/submissions',
    musicSubmissionsDELETE,
    { method: 'DELETE', body: JSON.stringify({ id: 'abc' }) },
  ],
  ['GET  /api/notifications', '/api/notifications', notificationsGET],
  [
    'PATCH /api/notifications',
    '/api/notifications',
    notificationsPATCH,
    { method: 'PATCH', body: JSON.stringify({ all: true }) },
  ],
  ['GET  /api/respect/leaderboard', '/api/respect/leaderboard', respectLeaderboardGET],
  ['GET  /api/music/playlists', '/api/music/playlists', musicPlaylistsGET],
  ['GET  /api/music/curators', '/api/music/curators', musicCuratorsGET],
  ['GET  /api/music/digest', '/api/music/digest', musicDigestGET],
  ['GET  /api/music/lyrics', '/api/music/lyrics?songId=1', musicLyricsGET],
  ['GET  /api/members/me', '/api/members/me', membersMeGET],
  [
    'POST /api/members/me',
    '/api/members/me',
    membersMePOST,
    { method: 'POST', body: JSON.stringify({ bio: 'hi' }) },
  ],
  ['GET  /api/members/nfts', '/api/members/nfts?address=0x1234', membersNftsGET],
  ['GET  /api/users/socials', '/api/users/socials', usersSocialsGET],
  [
    'PATCH /api/users/socials',
    '/api/users/socials',
    usersSocialsPATCH,
    { method: 'PATCH', body: JSON.stringify({}) },
  ],
  ['GET  /api/users/profile', '/api/users/profile', usersProfileGET],
  [
    'PATCH /api/users/profile',
    '/api/users/profile',
    usersProfilePATCH,
    { method: 'PATCH', body: JSON.stringify({}) },
  ],
];

// Mutation routes gated on a Neynar signer — no signer → 401 "Signer required".
const signerRoutes: [string, string, RouteHandler, RequestInit?][] = [
  [
    'POST   /api/users/block',
    '/api/users/block',
    usersBlockPOST,
    { method: 'POST', body: JSON.stringify({ targetFid: 1 }) },
  ],
  [
    'DELETE /api/users/block',
    '/api/users/block',
    usersBlockDELETE,
    { method: 'DELETE', body: JSON.stringify({ targetFid: 1 }) },
  ],
  [
    'POST   /api/users/mute',
    '/api/users/mute',
    usersMutePOST,
    { method: 'POST', body: JSON.stringify({ targetFid: 1 }) },
  ],
  [
    'DELETE /api/users/mute',
    '/api/users/mute',
    usersMuteDELETE,
    { method: 'DELETE', body: JSON.stringify({ targetFid: 1 }) },
  ],
  [
    'POST   /api/users/follow-batch',
    '/api/users/follow-batch',
    usersFollowBatchPOST,
    { method: 'POST', body: JSON.stringify({ fids: [1] }) },
  ],
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

describe('Auth guards — signer-gated mutations return 401 without a signer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(null);
  });

  describe.each(signerRoutes)('%s', (_label, url, handler, init) => {
    it('returns 401 with error "Signer required"', async () => {
      const req = makeRequest(url, init);
      const res = await handler(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Signer required');
    });
  });
});
