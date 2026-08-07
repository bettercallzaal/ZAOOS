/**
 * whop-bridge.test.ts - Unlock -> Whop grant-on-key bridge (doc 2233).
 * Unlock is the source of truth; Whop is a gated, replaceable downstream.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { grantOnKey, grantWhopMembership, syncGrant, whopEnabled } from '../whop-bridge';

const LOCK = '0x1111111111111111111111111111111111111111';
const WALLET = '0x2222222222222222222222222222222222222222';

describe('grantOnKey', () => {
  const origKey = process.env.WHOP_API_KEY;
  const origPlan = process.env.WHOP_PLAN_ID;
  afterEach(() => {
    process.env.WHOP_API_KEY = origKey;
    process.env.WHOP_PLAN_ID = origPlan;
    if (origKey === undefined) delete process.env.WHOP_API_KEY;
    if (origPlan === undefined) delete process.env.WHOP_PLAN_ID;
    vi.restoreAllMocks();
  });

  it('no key on-chain -> nothing granted, reason no-key', async () => {
    const res = await grantOnKey(
      { lockAddress: LOCK, wallets: [WALLET], whopUser: 'user_1' },
      { findHolder: vi.fn().mockResolvedValue(null) },
    );
    expect(res).toEqual({ keyHolder: null, granted: false, reason: 'no-key' });
  });

  it('key held but Whop disabled -> Unlock-only grant, LOUD log, never silent', async () => {
    delete process.env.WHOP_API_KEY;
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await grantOnKey(
      { lockAddress: LOCK, wallets: [WALLET], whopUser: 'user_1' },
      { findHolder: vi.fn().mockResolvedValue(WALLET) },
    );
    expect(res.keyHolder).toBe(WALLET);
    expect(res.granted).toBe(false);
    expect(res.reason).toBe('whop-disabled');
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Whop side disabled'));
  });

  it('key held, Whop enabled, grant succeeds', async () => {
    process.env.WHOP_API_KEY = 'test-key';
    process.env.WHOP_PLAN_ID = 'plan_1';
    const grantWhop = vi.fn().mockResolvedValue({ ok: true, detail: 'ok' });
    const res = await grantOnKey(
      { lockAddress: LOCK, wallets: [WALLET], whopUser: 'user_1' },
      { findHolder: vi.fn().mockResolvedValue(WALLET), grantWhop },
    );
    expect(res).toEqual({ keyHolder: WALLET, granted: true, reason: 'ok' });
    expect(grantWhop).toHaveBeenCalledWith('user_1');
  });

  it('key held, Whop enabled, grant fails -> granted false with the Whop reason', async () => {
    process.env.WHOP_API_KEY = 'test-key';
    process.env.WHOP_PLAN_ID = 'plan_1';
    const res = await grantOnKey(
      { lockAddress: LOCK, wallets: [WALLET], whopUser: 'user_1' },
      {
        findHolder: vi.fn().mockResolvedValue(WALLET),
        grantWhop: vi.fn().mockResolvedValue({ ok: false, detail: 'whop-http-401' }),
      },
    );
    expect(res.granted).toBe(false);
    expect(res.reason).toBe('whop-http-401');
  });

  it('no whopUser given -> verification still runs, Unlock-only result', async () => {
    const res = await grantOnKey(
      { lockAddress: LOCK, wallets: [WALLET] },
      { findHolder: vi.fn().mockResolvedValue(WALLET) },
    );
    expect(res.keyHolder).toBe(WALLET);
    expect(res.granted).toBe(false);
  });
});

describe('grantWhopMembership (gated)', () => {
  beforeEach(() => {
    delete process.env.WHOP_API_KEY;
    delete process.env.WHOP_PLAN_ID;
  });
  afterEach(() => vi.restoreAllMocks());

  it('absent keys -> loud no-op, never a network call', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const res = await grantWhopMembership('user_1');
    expect(res).toEqual({ ok: false, detail: 'whop-disabled' });
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('SKIPPED'));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(whopEnabled()).toBe(false);
  });
});

describe('syncGrant (expiry sync - Unlock is source of truth)', () => {
  it('valid key -> keep', async () => {
    await expect(
      syncGrant(
        { lockAddress: LOCK, keyHolder: WALLET },
        { hasKey: vi.fn().mockResolvedValue(true) },
      ),
    ).resolves.toBe('keep');
  });

  it('lapsed key -> revoke (caller deactivates the Whop side)', async () => {
    await expect(
      syncGrant(
        { lockAddress: LOCK, keyHolder: WALLET },
        { hasKey: vi.fn().mockResolvedValue(false) },
      ),
    ).resolves.toBe('revoke');
  });
});
