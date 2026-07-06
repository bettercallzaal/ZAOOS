import { describe, expect, it } from 'vitest';
import { timingSafeEqual } from '@/lib/security/timingSafeEqual';

describe('timingSafeEqual', () => {
  it('returns true for identical strings', () => {
    expect(timingSafeEqual('secret-token', 'secret-token')).toBe(true);
  });

  it('returns true for two empty strings', () => {
    expect(timingSafeEqual('', '')).toBe(true);
  });

  it('returns false for different strings of equal length', () => {
    expect(timingSafeEqual('aaaa', 'aaab')).toBe(false);
  });

  it('returns false when only the first byte differs', () => {
    expect(timingSafeEqual('Xbcd', 'abcd')).toBe(false);
  });

  it('returns false when only the last byte differs', () => {
    expect(timingSafeEqual('abcd', 'abcX')).toBe(false);
  });

  it('returns false for different lengths (shorter vs longer)', () => {
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
    expect(timingSafeEqual('abcd', 'abc')).toBe(false);
  });

  it('returns false when one side is empty', () => {
    expect(timingSafeEqual('', 'a')).toBe(false);
    expect(timingSafeEqual('a', '')).toBe(false);
  });

  it('distinguishes the Bearer-prefixed form from the bare secret', () => {
    const secret = 's3cr3t';
    expect(timingSafeEqual('Bearer s3cr3t', `Bearer ${secret}`)).toBe(true);
    expect(timingSafeEqual('s3cr3t', `Bearer ${secret}`)).toBe(false);
  });

  it('handles unicode / multi-byte chars by code unit', () => {
    expect(timingSafeEqual('café', 'café')).toBe(true);
    expect(timingSafeEqual('café', 'cafe')).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(timingSafeEqual('Secret', 'secret')).toBe(false);
  });
});
