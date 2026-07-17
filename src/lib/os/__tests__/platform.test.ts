// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { getPlatform, isAndroid, isIOS, isNative } from '../platform';

// In the node test environment, typeof window === 'undefined', so getPlatform()
// returns 'web' via the early-return path and never sets the module-level cache.
// All four functions are therefore deterministic here.

// ---------------------------------------------------------------------------
// getPlatform (node / SSR path)
// ---------------------------------------------------------------------------

describe('getPlatform (node env)', () => {
  it('returns "web" when window is undefined (SSR / node)', () => {
    expect(getPlatform()).toBe('web');
  });

  it('returns "web" on a second call (consistent, no stale cache)', () => {
    expect(getPlatform()).toBe('web');
    expect(getPlatform()).toBe('web');
  });

  it('return value is one of the valid Platform literals', () => {
    const result = getPlatform();
    expect(['web', 'ios', 'android']).toContain(result);
  });
});

// ---------------------------------------------------------------------------
// isNative
// ---------------------------------------------------------------------------

describe('isNative (node env)', () => {
  it('returns false when platform is "web"', () => {
    expect(isNative()).toBe(false);
  });

  it('result is consistent with getPlatform() !== "ios" && !== "android"', () => {
    const platform = getPlatform();
    const expected = platform === 'ios' || platform === 'android';
    expect(isNative()).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// isIOS
// ---------------------------------------------------------------------------

describe('isIOS (node env)', () => {
  it('returns false when platform is "web"', () => {
    expect(isIOS()).toBe(false);
  });

  it('result is consistent with getPlatform() === "ios"', () => {
    expect(isIOS()).toBe(getPlatform() === 'ios');
  });
});

// ---------------------------------------------------------------------------
// isAndroid
// ---------------------------------------------------------------------------

describe('isAndroid (node env)', () => {
  it('returns false when platform is "web"', () => {
    expect(isAndroid()).toBe(false);
  });

  it('result is consistent with getPlatform() === "android"', () => {
    expect(isAndroid()).toBe(getPlatform() === 'android');
  });
});

// ---------------------------------------------------------------------------
// Mutual exclusion guard
// ---------------------------------------------------------------------------

describe('platform mutual exclusion', () => {
  it('isIOS and isAndroid are not both true', () => {
    expect(isIOS() && isAndroid()).toBe(false);
  });

  it('isNative is true iff at least one of isIOS or isAndroid is true', () => {
    expect(isNative()).toBe(isIOS() || isAndroid());
  });
});
