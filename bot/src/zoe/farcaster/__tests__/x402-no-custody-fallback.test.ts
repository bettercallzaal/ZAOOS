import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { buildX402Header, X402_KEY_MISSING } from '../x402';

// Seat rulings 2026-11-07 item 2.5 (from Iman's finding in iman-desk #168): the x402 payment
// signer must never fall back to CUSTODY_PRIVATE_KEY. Keys are generated per run, never written.

const VARS = ['X402_PAYMENT_PRIVATE_KEY', 'CUSTODY_PRIVATE_KEY'] as const;

function decode(header: string): { payload: { authorization: { from: string } } } {
  return JSON.parse(Buffer.from(header, 'base64').toString('utf8'));
}

describe('buildX402Header has no CUSTODY_PRIVATE_KEY fallback', () => {
  const saved: Record<string, string | undefined> = {};
  let errSpy: MockInstance<typeof console.error>;

  beforeEach(() => {
    for (const k of VARS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errSpy.mockRestore();
    for (const k of VARS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('refuses when only CUSTODY_PRIVATE_KEY is set, and says why once', async () => {
    process.env.CUSTODY_PRIVATE_KEY = generatePrivateKey();
    await expect(buildX402Header()).rejects.toThrow(X402_KEY_MISSING);
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(String(errSpy.mock.calls[0][0])).toContain('[zoe/x402] refused');
  });

  it('refuses when neither key is set', async () => {
    await expect(buildX402Header()).rejects.toThrow(/no CUSTODY_PRIVATE_KEY fallback/);
  });

  it('signs with X402_PAYMENT_PRIVATE_KEY, never the custody key, when both are set', async () => {
    const payKey = generatePrivateKey();
    process.env.X402_PAYMENT_PRIVATE_KEY = payKey;
    process.env.CUSTODY_PRIVATE_KEY = generatePrivateKey();
    const from = decode(await buildX402Header()).payload.authorization.from;
    expect(from).toBe(privateKeyToAccount(payKey).address);
    expect(errSpy).not.toHaveBeenCalled();
  });
});
