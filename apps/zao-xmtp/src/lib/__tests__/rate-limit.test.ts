import { describe, expect, it } from 'vitest';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';

describe('createRateLimiter', () => {
  it('allows up to the limit, then refuses with a retry time', () => {
    const check = createRateLimiter(3, 60_000);
    expect([check('a', 0), check('a', 1), check('a', 2)].every((r) => r.ok)).toBe(true);
    expect(check('a', 3)).toEqual({ ok: false, retryAfterSeconds: 60 });
  });

  it('counts keys separately', () => {
    const check = createRateLimiter(1, 60_000);
    expect(check('a', 0).ok).toBe(true);
    expect(check('b', 0).ok).toBe(true);
    expect(check('a', 0).ok).toBe(false);
  });

  it('opens again after the window', () => {
    const check = createRateLimiter(1, 1000);
    check('a', 0);
    expect(check('a', 500).ok).toBe(false);
    expect(check('a', 1000).ok).toBe(true);
  });
});

describe('clientIp', () => {
  it('takes the first x-forwarded-for entry', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' }))).toBe('1.2.3.4');
  });
  it('falls back to x-real-ip, then a shared bucket', () => {
    expect(clientIp(new Headers({ 'x-real-ip': '5.6.7.8' }))).toBe('5.6.7.8');
    expect(clientIp(new Headers())).toBe('unknown');
  });
});
