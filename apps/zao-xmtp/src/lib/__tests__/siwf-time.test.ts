import { createSiweMessage } from 'viem/siwe';
import { describe, expect, it } from 'vitest';
import { checkSiwfTimes } from '@/lib/siwf-time';

const NOW = new Date('2026-10-17T20:00:00Z');
const base = {
  address: '0x1111111111111111111111111111111111111111',
  chainId: 10,
  domain: 'localhost:3000',
  nonce: 'abcdef0123456789',
  uri: 'http://localhost:3000',
  version: '1',
} as const;

const at = (ms: number) => new Date(NOW.getTime() + ms);
const MIN = 60 * 1000;

describe('checkSiwfTimes', () => {
  it('accepts a message issued a minute ago', () => {
    expect(checkSiwfTimes(createSiweMessage({ ...base, issuedAt: at(-MIN) }), NOW)).toEqual({ ok: true });
  });

  it('rejects a message older than the nonce lifetime (no expirationTime needed)', () => {
    const r = checkSiwfTimes(createSiweMessage({ ...base, issuedAt: at(-11 * MIN) }), NOW);
    expect(r).toEqual({ ok: false, reason: 'message too old' });
  });

  it('rejects a message issued in the future beyond clock skew', () => {
    const r = checkSiwfTimes(createSiweMessage({ ...base, issuedAt: at(5 * MIN) }), NOW);
    expect(r).toEqual({ ok: false, reason: 'issuedAt in the future' });
  });

  it('rejects a passed expirationTime even when issuedAt is recent', () => {
    const r = checkSiwfTimes(
      createSiweMessage({ ...base, issuedAt: at(-MIN), expirationTime: at(-1000) }),
      NOW,
    );
    expect(r).toEqual({ ok: false, reason: 'message expired' });
  });

  it('rejects a notBefore still in the future', () => {
    const r = checkSiwfTimes(
      createSiweMessage({ ...base, issuedAt: at(-MIN), notBefore: at(10 * MIN) }),
      NOW,
    );
    expect(r).toEqual({ ok: false, reason: 'message not yet valid' });
  });
});
