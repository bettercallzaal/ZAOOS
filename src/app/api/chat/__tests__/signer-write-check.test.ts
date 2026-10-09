// @vitest-environment node
// The fresh signer check, seen from the routes: a refused check means nothing
// is posted, and a scheduled cast is re-checked when it runs.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chainMock, makePostRequest, mockAuthenticatedSession } from '@/test-utils/api-helpers';

const { mockGetSessionData, mockGetSession, mockGetSignerStatus, mockPostCast, mockFrom } =
  vi.hoisted(() => ({
    mockGetSessionData: vi.fn(),
    mockGetSession: vi.fn(),
    mockGetSignerStatus: vi.fn(),
    mockPostCast: vi.fn(),
    mockFrom: vi.fn(),
  }));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: mockGetSessionData,
  getSession: mockGetSession,
}));
vi.mock('@/lib/farcaster/neynar', () => ({
  postCast: mockPostCast,
  getSignerStatus: mockGetSignerStatus,
}));
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));
vi.mock('@/lib/db/activity', () => ({ touchActivity: vi.fn() }));
vi.mock('@/lib/music/library', () => ({
  extractAndSaveSongs: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/notifications', () => ({
  createInAppNotification: vi.fn().mockResolvedValue(undefined),
  sendNotification: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import { resetWriteBarrierForTests } from '@/lib/farcaster/write-authority';
import { PATCH } from '../schedule/route';
import { POST as SEND } from '../send/route';

const session = mockAuthenticatedSession({ signerUuid: 'signer-1' });
const signer = (status: string) => ({
  signer_uuid: 'signer-1',
  public_key: '0x',
  status,
  fid: session.fid,
});

beforeEach(() => {
  resetWriteBarrierForTests();
  mockGetSessionData.mockResolvedValue(session);
  mockGetSession.mockResolvedValue({ signerUuid: 'signer-1', save: vi.fn() });
  mockPostCast.mockResolvedValue({ cast: { hash: '0xabc', embeds: [] } });
  mockFrom.mockReturnValue(chainMock({ data: [], error: null }).chain);
});
afterEach(() => {
  vi.clearAllMocks();
  delete process.env.FARCASTER_WRITE_SIGNER_CHECK;
});

describe('POST /api/chat/send with the signer check', () => {
  const req = () => makePostRequest('/api/chat/send', { text: 'hello' });

  it('flag off: posts exactly as before, with no signer lookup', async () => {
    const res = await SEND(req());
    expect(res.status).toBe(200);
    expect(mockGetSignerStatus).not.toHaveBeenCalled();
    expect(mockPostCast).toHaveBeenCalled();
  });

  it('flag on: a revoked signer posts nothing (403)', async () => {
    process.env.FARCASTER_WRITE_SIGNER_CHECK = '1';
    mockGetSignerStatus.mockResolvedValue(signer('revoked'));
    const res = await SEND(req());
    expect(res.status).toBe(403);
    expect(mockPostCast).not.toHaveBeenCalled();
  });

  it('flag on: an unreachable check posts nothing (503)', async () => {
    process.env.FARCASTER_WRITE_SIGNER_CHECK = '1';
    mockGetSignerStatus.mockRejectedValue(new Error('Neynar signer status error: 429'));
    const res = await SEND(req());
    expect(res.status).toBe(503);
    expect(mockPostCast).not.toHaveBeenCalled();
  });

  it('flag on: an approved signer posts', async () => {
    process.env.FARCASTER_WRITE_SIGNER_CHECK = '1';
    mockGetSignerStatus.mockResolvedValue(signer('approved'));
    expect((await SEND(req())).status).toBe(200);
    expect(mockPostCast).toHaveBeenCalled();
  });
});

describe('PATCH /api/chat/schedule re-checks at execution', () => {
  it('flag on: a signer revoked since scheduling posts nothing, and due casts are not read', async () => {
    process.env.FARCASTER_WRITE_SIGNER_CHECK = '1';
    mockGetSignerStatus.mockResolvedValue(signer('revoked'));
    const res = await PATCH();
    expect(res.status).toBe(403);
    expect(mockPostCast).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
