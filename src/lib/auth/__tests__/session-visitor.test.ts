// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// One mutable cookie-session object per test, standing in for iron-session.
const store = vi.hoisted(() => ({ session: {} as Record<string, unknown> }));

vi.mock('iron-session', () => ({
  getIronSession: vi.fn(async () => store.session),
}));
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({})) }));
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  cache: <T>(fn: T) => fn,
}));
vi.mock('@/lib/env', () => ({ ENV: { SESSION_SECRET: 'x'.repeat(32) } }));

import {
  getReaderSession,
  getSessionData,
  isMemberSession,
  saveSession,
  saveVisitorSession,
} from '../session';

const ADMIN_FID = 19640; // community.config.ts adminFids

function freshSession(fields: Record<string, unknown> = {}) {
  store.session = { save: vi.fn(async () => {}), destroy: vi.fn(), ...fields };
  return store.session;
}

beforeEach(() => freshSession());
afterEach(() => vi.unstubAllEnvs());

describe('isMemberSession', () => {
  it.each([
    [{}, true],
    [{ isMember: true }, true],
    [{ isMember: false }, false],
  ])('%o -> %s', (s, expected) => {
    expect(isMemberSession(s)).toBe(expected);
  });
});

describe('getSessionData keeps every member route closed to visitors', () => {
  it('returns the member for a session created before isMember existed', async () => {
    freshSession({ fid: 7, username: 'old', isAdmin: false });
    expect(await getSessionData()).toMatchObject({ fid: 7, username: 'old' });
  });

  it('returns null for a visitor session, even with the front door open', async () => {
    vi.stubEnv('FARCASTER_OPEN_FRONT_DOOR', '1');
    freshSession({ fid: 7, username: 'v', isMember: false });
    expect(await getSessionData()).toBeNull();
  });
});

describe('saveVisitorSession', () => {
  it('never grants admin, a signer or a wallet, even for an admin FID', async () => {
    const s = freshSession({ signerUuid: 'old-signer', walletAddress: '0xabc', isAdmin: true });
    await saveVisitorSession({ fid: ADMIN_FID, username: 'a', displayName: 'A', pfpUrl: 'p' });
    expect(s).toMatchObject({
      fid: ADMIN_FID,
      isMember: false,
      isAdmin: false,
      signerUuid: null,
      walletAddress: undefined,
    });
    expect(s.save).toHaveBeenCalledTimes(1);
  });
});

describe('saveSession', () => {
  it('marks the session a member, so a member signing in over a visitor cookie is let in', async () => {
    freshSession({ fid: 9, isMember: false });
    await saveSession({ fid: 9, username: 'm', displayName: 'M', pfpUrl: 'p' });
    expect(store.session.isMember).toBe(true);
    expect(await getSessionData()).toMatchObject({ fid: 9 });
  });
});

describe('getReaderSession', () => {
  it('returns null without a FID', async () => {
    freshSession({ walletAddress: '0xabc' });
    expect(await getReaderSession()).toBeNull();
  });

  it('returns a member reader regardless of the flag', async () => {
    freshSession({ fid: 3, username: 'm' });
    expect(await getReaderSession()).toMatchObject({ fid: 3, role: 'member' });
  });

  it('shuts visitors out while the front door is closed', async () => {
    freshSession({ fid: 4, username: 'v', isMember: false });
    expect(await getReaderSession()).toBeNull();
  });

  it('returns a visitor reader while the front door is open', async () => {
    vi.stubEnv('FARCASTER_OPEN_FRONT_DOOR', '1');
    freshSession({ fid: 4, username: 'v', isMember: false });
    expect(await getReaderSession()).toEqual({
      fid: 4,
      username: 'v',
      displayName: '',
      pfpUrl: '',
      role: 'visitor',
    });
  });
});
