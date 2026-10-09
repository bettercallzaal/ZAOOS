// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetSession, mockSave, mockLogger } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockSave: vi.fn(),
  mockLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
vi.mock('@/lib/auth/session', () => ({ getSession: mockGetSession }));
vi.mock('@/lib/farcaster/neynar', () => ({ getSignerStatus: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: mockLogger }));

import {
  checkWriteAuthority,
  guardSignerWrite,
  resetWriteBarrierForTests,
  writeSignerCheckEnabled,
} from '../write-authority';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const FID = 1234;
const approved = (extra: Record<string, unknown> = {}) => ({
  object: 'signer',
  signer_uuid: UUID,
  public_key: `0x${'ab'.repeat(32)}`,
  status: 'approved',
  fid: FID,
  ...extra,
});
const answer = (body: unknown) => vi.fn(() => Promise.resolve(body));

let liveSession: { signerUuid: string | null; save: typeof mockSave };

beforeEach(() => {
  resetWriteBarrierForTests();
  liveSession = { signerUuid: UUID, save: mockSave };
  mockGetSession.mockResolvedValue(liveSession);
  mockSave.mockResolvedValue(undefined);
});
afterEach(() => {
  vi.clearAllMocks();
  delete process.env.FARCASTER_WRITE_SIGNER_CHECK;
});

describe('writeSignerCheckEnabled - default off', () => {
  it.each([
    [undefined, false],
    ['', false],
    ['0', false],
    ['true', false],
    ['1', true],
  ])('FARCASTER_WRITE_SIGNER_CHECK=%s -> %s', (value, want) => {
    if (value !== undefined) process.env.FARCASTER_WRITE_SIGNER_CHECK = value;
    expect(writeSignerCheckEnabled()).toBe(want);
  });
});

describe('checkWriteAuthority', () => {
  it('allows an approved signer for the same FID', async () => {
    expect(await checkWriteAuthority(UUID, FID, 'cast', answer(approved()))).toEqual({ ok: true });
  });

  it.each([
    ['revoked', approved({ status: 'revoked' }), 'revoked'],
    ['still pending', approved({ status: 'pending_approval' }), 'status-pending_approval'],
    ['only generated', approved({ status: 'generated' }), 'status-generated'],
    ['for another FID (the cookie is not authority)', approved({ fid: 999 }), 'fid-mismatch'],
    ['with no FID', approved({ fid: undefined }), 'fid-mismatch'],
    ['read-only', approved({ permissions: ['READ_ONLY'] }), 'missing-permission-for-cast'],
    [
      'allowed reactions only, asked to cast',
      approved({ permissions: ['PUBLISH_REACTION'] }),
      'missing-permission-for-cast',
    ],
  ])('refuses DEFINITIVELY a signer %s', async (_name, body, reason) => {
    expect(await checkWriteAuthority(UUID, FID, 'cast', answer(body))).toEqual({
      ok: false,
      definitive: true,
      reason,
    });
  });

  it.each([
    ['WRITE_ALL', 'other', ['WRITE_ALL']],
    ['PUBLISH_CAST for a cast', 'cast', ['PUBLISH_CAST']],
    ['DELETE_CAST for a delete', 'delete-cast', ['DELETE_CAST']],
    ['PUBLISH_REACTION for a like', 'reaction', ['PUBLISH_REACTION']],
  ] as const)('allows a scoped signer with %s', async (_name, action, permissions) => {
    expect(
      await checkWriteAuthority(
        UUID,
        FID,
        action,
        answer(approved({ permissions: [...permissions] })),
      ),
    ).toEqual({
      ok: true,
    });
  });

  it.each([
    ['a timeout', () => Promise.reject(new Error('The operation was aborted due to timeout'))],
    ['a rate limit', () => Promise.reject(new Error('Neynar signer status error: 429'))],
    ['a server error', () => Promise.reject(new Error('Neynar signer status error: 500'))],
    ['a malformed answer', () => Promise.resolve({ status: 'approved' })],
    ['an unknown status', () => Promise.resolve(approved({ status: 'paused' }))],
    ['an answer about another signer', () => Promise.resolve(approved({ signer_uuid: 'other' }))],
  ])('on %s refuses, but NOT definitively (it is not proof of revocation)', async (_name, impl) => {
    const r = await checkWriteAuthority(UUID, FID, 'cast', vi.fn(impl));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.definitive).toBe(false);
  });

  it('after a revocation, the next write in this process is refused without asking again', async () => {
    await checkWriteAuthority(UUID, FID, 'cast', answer(approved({ status: 'revoked' })));
    const lookup = answer(approved());
    expect(await checkWriteAuthority(UUID, FID, 'cast', lookup)).toMatchObject({
      ok: false,
      definitive: true,
      reason: 'revoked-earlier',
    });
    expect(lookup).not.toHaveBeenCalled();
  });

  it('a revoked signer A does not block a different signer B', async () => {
    await checkWriteAuthority(UUID, FID, 'cast', answer(approved({ status: 'revoked' })));
    const other = '660e8400-e29b-41d4-a716-446655440000';
    expect(
      await checkWriteAuthority(other, FID, 'cast', answer(approved({ signer_uuid: other }))),
    ).toEqual({ ok: true });
  });
});

describe('guardSignerWrite', () => {
  const session = { fid: FID, signerUuid: UUID };

  it('flag off: does nothing and asks nobody', async () => {
    const lookup = answer(approved({ status: 'revoked' }));
    expect(await guardSignerWrite(session, 'cast', lookup)).toBeNull();
    expect(lookup).not.toHaveBeenCalled();
  });

  it('flag on: an approved signer goes ahead', async () => {
    process.env.FARCASTER_WRITE_SIGNER_CHECK = '1';
    expect(await guardSignerWrite(session, 'cast', answer(approved()))).toBeNull();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('flag on: a revoked signer is a 403 and the binding is cleared', async () => {
    process.env.FARCASTER_WRITE_SIGNER_CHECK = '1';
    const res = await guardSignerWrite(session, 'cast', answer(approved({ status: 'revoked' })));
    expect(res?.status).toBe(403);
    expect(liveSession.signerUuid).toBeNull();
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it('flag on: a failed check is a 503 and the binding is KEPT', async () => {
    process.env.FARCASTER_WRITE_SIGNER_CHECK = '1';
    const res = await guardSignerWrite(
      session,
      'cast',
      vi.fn(() => Promise.reject(new Error('timeout'))),
    );
    expect(res?.status).toBe(503);
    expect(liveSession.signerUuid).toBe(UUID);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('flag on: still refuses when clearing the binding fails', async () => {
    process.env.FARCASTER_WRITE_SIGNER_CHECK = '1';
    mockSave.mockRejectedValueOnce(new Error('cookie write failed'));
    const res = await guardSignerWrite(session, 'cast', answer(approved({ status: 'revoked' })));
    expect(res?.status).toBe(403);
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
