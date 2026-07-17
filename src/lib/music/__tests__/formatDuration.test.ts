// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { formatDuration } from '../formatDuration';

describe('formatDuration', () => {
  it('formats a round minute', () => {
    expect(formatDuration(60_000)).toBe('1:00');
  });

  it('formats seconds with zero-padding', () => {
    expect(formatDuration(65_000)).toBe('1:05');
    expect(formatDuration(9_000)).toBe('0:09');
  });

  it('formats a typical song duration (3:45)', () => {
    expect(formatDuration(225_000)).toBe('3:45');
  });

  it('formats a long track (>60 minutes)', () => {
    expect(formatDuration(3_720_000)).toBe('62:00');
  });

  it('formats exactly 0ms as 0:00', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('returns 0:00 for negative values', () => {
    expect(formatDuration(-1000)).toBe('0:00');
  });

  it('returns 0:00 for NaN', () => {
    expect(formatDuration(NaN)).toBe('0:00');
  });

  it('returns 0:00 for Infinity', () => {
    expect(formatDuration(Infinity)).toBe('0:00');
  });

  it('truncates millisecond remainder (floors to seconds)', () => {
    // 61 999ms → 1 minute 1 second → 1:01, NOT 1:02
    expect(formatDuration(61_999)).toBe('1:01');
  });

  it('seconds always two digits', () => {
    expect(formatDuration(10_000)).toBe('0:10');
    expect(formatDuration(59_000)).toBe('0:59');
  });
});
