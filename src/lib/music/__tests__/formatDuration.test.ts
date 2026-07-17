// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { formatDuration } from '../formatDuration';

describe('formatDuration', () => {
  it('returns "0:00" for 0', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('returns "0:00" for a negative value', () => {
    expect(formatDuration(-1000)).toBe('0:00');
  });

  it('returns "0:00" for NaN', () => {
    expect(formatDuration(NaN)).toBe('0:00');
  });

  it('returns "0:00" for Infinity', () => {
    expect(formatDuration(Infinity)).toBe('0:00');
  });

  it('returns "0:30" for 30000 ms (30 seconds)', () => {
    expect(formatDuration(30000)).toBe('0:30');
  });

  it('returns "1:30" for 90000 ms (1 min 30 sec)', () => {
    expect(formatDuration(90000)).toBe('1:30');
  });

  it('returns "10:00" for 600000 ms (10 minutes)', () => {
    expect(formatDuration(600000)).toBe('10:00');
  });

  it('returns "59:59" for 3599000 ms', () => {
    expect(formatDuration(3599000)).toBe('59:59');
  });

  it('pads seconds with a leading zero: 5000 ms → "0:05"', () => {
    expect(formatDuration(5000)).toBe('0:05');
  });
});
