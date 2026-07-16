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

vi.mock('@/lib/farcaster/neynar', () => ({
  getUserByFid: vi.fn(),
  getUserByAddress: vi.fn(),
  searchUsers: vi.fn(),
  getUsersByFids: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  ENV: {
    NEYNAR_API_KEY: 'test-key',
    SESSION_SECRET: 'test-secret-that-is-at-least-32-chars-long',
  },
}));

vi.mock('@/lib/validation/schemas', () => ({
  csvRowSchema: { safeParse: vi.fn() },
  allowlistEntrySchema: { safeParse: vi.fn() },
  removeAllowlistSchema: { safeParse: vi.fn() },
}));

vi.mock('papaparse', () => ({
  default: { parse: vi.fn() },
}));

vi.mock('viem', () => ({
  createPublicClient: vi.fn(() => ({ getEnsName: vi.fn() })),
  http: vi.fn(),
}));

vi.mock('viem/chains', () => ({
  mainnet: { id: 1 },
}));

// ens-subnames + discord-link deps - mocked so their route modules load cleanly
// (the guard returns before any of these run; this is purely import safety).
vi.mock('@/lib/ens/subnames', () => ({
  createSubnameWithFallback: vi.fn(),
  batchCreateSubnames: vi.fn(),
  buildMemberTextRecords: vi.fn(),
  isValidSubname: vi.fn(),
  sanitizeSubname: vi.fn(),
}));
vi.mock('@/lib/db/audit-log', () => ({
  logAuditEvent: vi.fn(),
  getClientIp: vi.fn(() => '0.0.0.0'),
}));

import {
  DELETE as allowlistDELETE,
  GET as allowlistGET,
  POST as allowlistPOST,
} from '@/app/api/admin/allowlist/route';
import { POST as backfillPOST } from '@/app/api/admin/backfill/route';
import { POST as broadcastPOST } from '@/app/api/admin/broadcast/route';
import { GET as discordLinkGET } from '@/app/api/admin/discord-link/route';
import { GET as dormantGET } from '@/app/api/admin/dormant/route';
import { GET as ensSubnamesGET } from '@/app/api/admin/ens-subnames/route';
import { GET as exportGET } from '@/app/api/admin/export/route';
import { GET as hiddenGET } from '@/app/api/admin/hidden/route';
import { GET as memberFidGET, PATCH as memberFidPATCH } from '@/app/api/admin/member-fid/route';
import { GET as memberHealthGET } from '@/app/api/admin/member-health/route';
import { GET as onboardingFunnelGET } from '@/app/api/admin/onboarding-funnel/route';
import { GET as quickStatsGET } from '@/app/api/admin/quick-stats/route';
import { POST as respectImportPOST } from '@/app/api/admin/respect-import/route';
import { GET as searchUsersGET } from '@/app/api/admin/search-users/route';
import { DELETE as spacesIdDELETE } from '@/app/api/admin/spaces/[id]/route';
import { GET as spacesGET } from '@/app/api/admin/spaces/route';
import { POST as uploadPOST } from '@/app/api/admin/upload/route';
// ── Route imports ────────────────────────────────────────────────────────────
import {
  DELETE as usersDELETE,
  GET as usersGET,
  PATCH as usersPATCH,
  POST as usersPOST,
} from '@/app/api/admin/users/route';

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options);
}

// Some handlers accept no args (POST backfill, POST respect-import, GET hidden, GET allowlist)
// We define the table with optional request overrides.
type HandlerFn = (req?: NextRequest) => Promise<Response>;

// ── Admin route table ────────────────────────────────────────────────────────
// [label, url, handler, requestInit?, expectedUnauthStatus, expectedUnauthError]
// Most routes return 401 for unauthenticated, but backfill and search-users
// use `!session?.isAdmin` which collapses both checks into a 403.
interface AdminRouteEntry {
  label: string;
  url: string;
  handler: HandlerFn;
  init?: RequestInit;
  unauthStatus: number;
  unauthError: string;
  // Non-admin (authenticated) response. Most routes share 403/"Admin access
  // required"; some (quick-stats, member-health) return 403/"Admin required".
  nonAdminStatus?: number;
  nonAdminError?: string;
}

const dummyBody = JSON.stringify({ id: '550e8400-e29b-41d4-a716-446655440000' });

const adminRoutes: AdminRouteEntry[] = [
  // admin/users — uses requireAdmin() helper → 401 unauth, 403 non-admin
  {
    label: 'GET    /api/admin/users',
    url: '/api/admin/users',
    handler: usersGET as HandlerFn,
    unauthStatus: 401,
    unauthError: 'Unauthorized',
  },
  {
    label: 'POST   /api/admin/users',
    url: '/api/admin/users',
    handler: usersPOST as HandlerFn,
    init: { method: 'POST', body: JSON.stringify({ fid: 1 }) },
    unauthStatus: 401,
    unauthError: 'Unauthorized',
  },
  {
    label: 'PATCH  /api/admin/users',
    url: '/api/admin/users',
    handler: usersPATCH as HandlerFn,
    init: {
      method: 'PATCH',
      body: JSON.stringify({ id: '550e8400-e29b-41d4-a716-446655440000', role: 'member' }),
    },
    unauthStatus: 401,
    unauthError: 'Unauthorized',
  },
  {
    label: 'DELETE /api/admin/users',
    url: '/api/admin/users',
    handler: usersDELETE as HandlerFn,
    init: { method: 'DELETE', body: dummyBody },
    unauthStatus: 401,
    unauthError: 'Unauthorized',
  },

  // admin/allowlist — uses requireAdmin() helper → 401 unauth, 403 non-admin
  {
    label: 'GET    /api/admin/allowlist',
    url: '/api/admin/allowlist',
    handler: allowlistGET as HandlerFn,
    unauthStatus: 401,
    unauthError: 'Unauthorized',
  },
  {
    label: 'POST   /api/admin/allowlist',
    url: '/api/admin/allowlist',
    handler: allowlistPOST as HandlerFn,
    init: { method: 'POST', body: JSON.stringify({ wallet: '0x1234' }) },
    unauthStatus: 401,
    unauthError: 'Unauthorized',
  },
  {
    label: 'DELETE /api/admin/allowlist',
    url: '/api/admin/allowlist',
    handler: allowlistDELETE as HandlerFn,
    init: { method: 'DELETE', body: dummyBody },
    unauthStatus: 401,
    unauthError: 'Unauthorized',
  },

  // admin/hidden — inline checks → 401 unauth, 403 non-admin
  {
    label: 'GET    /api/admin/hidden',
    url: '/api/admin/hidden',
    handler: hiddenGET as HandlerFn,
    unauthStatus: 401,
    unauthError: 'Unauthorized',
  },

  // admin/upload — inline checks → 401 unauth, 403 non-admin
  {
    label: 'POST   /api/admin/upload',
    url: '/api/admin/upload',
    handler: uploadPOST as HandlerFn,
    init: { method: 'POST', body: JSON.stringify({}) },
    unauthStatus: 401,
    unauthError: 'Unauthorized',
  },

  // admin/respect-import — inline checks → 401 unauth, 403 non-admin
  {
    label: 'POST   /api/admin/respect-import',
    url: '/api/admin/respect-import',
    handler: respectImportPOST as HandlerFn,
    unauthStatus: 401,
    unauthError: 'Unauthorized',
  },

  // admin/backfill — uses !session?.isAdmin → 403 for both unauth and non-admin
  {
    label: 'POST   /api/admin/backfill',
    url: '/api/admin/backfill',
    handler: backfillPOST as HandlerFn,
    unauthStatus: 403,
    unauthError: 'Admin access required',
  },

  // admin/search-users — uses !session?.isAdmin → 403 for both unauth and non-admin
  {
    label: 'GET    /api/admin/search-users',
    url: '/api/admin/search-users?q=test',
    handler: searchUsersGET as HandlerFn,
    unauthStatus: 403,
    unauthError: 'Admin access required',
  },

  // admin/quick-stats — !session?.isAdmin → 403 "Admin required" for both
  {
    label: 'GET    /api/admin/quick-stats',
    url: '/api/admin/quick-stats',
    handler: quickStatsGET as HandlerFn,
    unauthStatus: 403,
    unauthError: 'Admin required',
    nonAdminError: 'Admin required',
  },

  // admin/member-health — !session?.isAdmin → 403 "Admin required" for both
  {
    label: 'GET    /api/admin/member-health',
    url: '/api/admin/member-health',
    handler: memberHealthGET as HandlerFn,
    unauthStatus: 403,
    unauthError: 'Admin required',
    nonAdminError: 'Admin required',
  },

  // admin/ens-subnames — !session?.isAdmin → 403 "Admin access required" for both
  {
    label: 'GET    /api/admin/ens-subnames',
    url: '/api/admin/ens-subnames',
    handler: ensSubnamesGET as HandlerFn,
    unauthStatus: 403,
    unauthError: 'Admin access required',
  },

  // admin/discord-link — split checks → 401 unauth, 403 non-admin
  {
    label: 'GET    /api/admin/discord-link',
    url: '/api/admin/discord-link',
    handler: discordLinkGET as HandlerFn,
    unauthStatus: 401,
    unauthError: 'Unauthorized',
  },

  // admin/spaces — split checks → 401 unauth, 403 non-admin
  {
    label: 'GET    /api/admin/spaces',
    url: '/api/admin/spaces',
    handler: spacesGET as HandlerFn,
    unauthStatus: 401,
    unauthError: 'Unauthorized',
  },

  // admin/spaces/[id] — split checks; handler takes a params promise
  {
    label: 'DELETE /api/admin/spaces/[id]',
    url: '/api/admin/spaces/550e8400-e29b-41d4-a716-446655440000',
    handler: ((req?: NextRequest) =>
      spacesIdDELETE(req as NextRequest, {
        params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }),
      })) as HandlerFn,
    init: { method: 'DELETE' },
    unauthStatus: 401,
    unauthError: 'Unauthorized',
  },

  // admin/onboarding-funnel — split checks → 401 unauth, 403 non-admin
  {
    label: 'GET    /api/admin/onboarding-funnel',
    url: '/api/admin/onboarding-funnel',
    handler: onboardingFunnelGET as HandlerFn,
    unauthStatus: 401,
    unauthError: 'Unauthorized',
  },

  // admin/broadcast — split checks → 401 unauth, 403 non-admin
  {
    label: 'POST   /api/admin/broadcast',
    url: '/api/admin/broadcast',
    handler: broadcastPOST as HandlerFn,
    init: { method: 'POST', body: JSON.stringify({ message: 'hi' }) },
    unauthStatus: 401,
    unauthError: 'Unauthorized',
  },

  // admin/export — split checks; non-admin error is "Forbidden"
  {
    label: 'GET    /api/admin/export',
    url: '/api/admin/export?type=members',
    handler: exportGET as HandlerFn,
    unauthStatus: 401,
    unauthError: 'Unauthorized',
    nonAdminError: 'Forbidden',
  },

  // admin/member-fid — split checks → 401 unauth, 403 non-admin
  {
    label: 'GET    /api/admin/member-fid',
    url: '/api/admin/member-fid',
    handler: memberFidGET as HandlerFn,
    unauthStatus: 401,
    unauthError: 'Unauthorized',
  },
  {
    label: 'PATCH  /api/admin/member-fid',
    url: '/api/admin/member-fid',
    handler: memberFidPATCH as HandlerFn,
    init: { method: 'PATCH', body: JSON.stringify({ updates: [] }) },
    unauthStatus: 401,
    unauthError: 'Unauthorized',
  },

  // admin/dormant — !session?.isAdmin → 403 "Admin required" for both
  {
    label: 'GET    /api/admin/dormant',
    url: '/api/admin/dormant',
    handler: dormantGET as HandlerFn,
    unauthStatus: 403,
    unauthError: 'Admin required',
    nonAdminError: 'Admin required',
  },
];

// ── Tests: unauthenticated → 401 or 403 ─────────────────────────────────────
describe('Admin guards — unauthenticated requests are rejected', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(null);
  });

  describe.each(adminRoutes)('$label', ({ url, handler, init, unauthStatus, unauthError }) => {
    it(`returns ${unauthStatus} with error "${unauthError}"`, async () => {
      const req = makeRequest(url, init);
      const res = await handler(req);
      expect(res.status).toBe(unauthStatus);
      const body = await res.json();
      expect(body.error).toBe(unauthError);
    });
  });
});

// ── Tests: authenticated but non-admin → 403 ────────────────────────────────
describe('Admin guards — non-admin authenticated users get 403', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue({
      fid: 99999,
      walletAddress: '0xdeadbeef00000000000000000000000000000000',
      authMethod: 'farcaster',
      username: 'regularuser',
      displayName: 'Regular User',
      pfpUrl: '',
      signerUuid: null,
      isAdmin: false,
    });
  });

  describe.each(adminRoutes)('$label', ({ url, handler, init, nonAdminStatus, nonAdminError }) => {
    it('rejects non-admin', async () => {
      const req = makeRequest(url, init);
      const res = await handler(req);
      expect(res.status).toBe(nonAdminStatus ?? 403);
      const body = await res.json();
      expect(body.error).toBe(nonAdminError ?? 'Admin access required');
    });
  });
});
