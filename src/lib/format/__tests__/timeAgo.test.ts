import { describe, expect, it } from 'vitest';
import {
  formatNumber,
  formatTimeRemaining,
  isDeadlinePassed,
  shortAddr,
  timeAgo,
  timeAgoCompact,
  timeAgoSimple,
} from '../timeAgo';

// All time-based tests compute offsets from Date.now() at test execution time
// so they don't depend on fixed absolute timestamps.

// ---------------------------------------------------------------------------
// timeAgo
// ---------------------------------------------------------------------------
describe('timeAgo', () => {
  it('returns empty string for undefined', () => {
    expect(timeAgo(undefined)).toBe('');
  });

  it('returns "just now" for timestamps within the last 60 seconds', () => {
    const date = new Date(Date.now() - 30 * 1000);
    expect(timeAgo(date)).toBe('just now');
  });

  it('returns "Xm ago" for timestamps within the last hour', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000);
    expect(timeAgo(date)).toBe('5m ago');
  });

  it('returns "Xh ago" for timestamps within the last 24 hours', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(timeAgo(date)).toBe('3h ago');
  });

  it('returns a date string for timestamps older than 24 hours', () => {
    const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const result = timeAgo(date);
    // Should include the month abbreviation and day
    expect(result).toMatch(/[A-Z][a-z]+ \d+,/);
  });

  it('accepts a date string', () => {
    const date = new Date(Date.now() - 10 * 60 * 1000);
    expect(timeAgo(date.toISOString())).toBe('10m ago');
  });
});

// ---------------------------------------------------------------------------
// timeAgoCompact
// ---------------------------------------------------------------------------
describe('timeAgoCompact', () => {
  it('returns empty string for undefined', () => {
    expect(timeAgoCompact(undefined)).toBe('');
  });

  it('returns "now" for timestamps within the last 60 seconds', () => {
    const date = new Date(Date.now() - 45 * 1000);
    expect(timeAgoCompact(date)).toBe('now');
  });

  it('returns "Xm" for timestamps within the last hour', () => {
    const date = new Date(Date.now() - 7 * 60 * 1000);
    expect(timeAgoCompact(date)).toBe('7m');
  });

  it('returns "Xh" for timestamps within the last 24 hours', () => {
    const date = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(timeAgoCompact(date)).toBe('2h');
  });

  it('returns "Xd" for timestamps older than 24 hours', () => {
    const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(timeAgoCompact(date)).toBe('3d');
  });
});

// ---------------------------------------------------------------------------
// timeAgoSimple
// ---------------------------------------------------------------------------
describe('timeAgoSimple', () => {
  it('returns empty string for undefined', () => {
    expect(timeAgoSimple(undefined)).toBe('');
  });

  it('returns "just now" for recent timestamps', () => {
    const date = new Date(Date.now() - 10 * 1000);
    expect(timeAgoSimple(date)).toBe('just now');
  });

  it('returns "Xm ago" for timestamps within the last hour', () => {
    const date = new Date(Date.now() - 15 * 60 * 1000);
    expect(timeAgoSimple(date)).toBe('15m ago');
  });

  it('returns "Xh ago" for timestamps within the last 24 hours', () => {
    const date = new Date(Date.now() - 6 * 60 * 60 * 1000);
    expect(timeAgoSimple(date)).toBe('6h ago');
  });

  it('returns "Xd ago" for timestamps older than 24 hours (not a full date)', () => {
    const date = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    expect(timeAgoSimple(date)).toBe('4d ago');
  });
});

// ---------------------------------------------------------------------------
// formatTimeRemaining
// ---------------------------------------------------------------------------
describe('formatTimeRemaining', () => {
  it('returns "Voting closed" for past deadlines', () => {
    const past = new Date(Date.now() - 60 * 1000);
    expect(formatTimeRemaining(past)).toBe('Voting closed');
  });

  it('returns "Xm remaining" for deadlines within the next hour', () => {
    const future = new Date(Date.now() + 20 * 60 * 1000);
    expect(formatTimeRemaining(future)).toBe('20m remaining');
  });

  it('returns "Xh remaining" for deadlines within the next day', () => {
    const future = new Date(Date.now() + 5 * 60 * 60 * 1000);
    expect(formatTimeRemaining(future)).toBe('5h remaining');
  });

  it('returns "Xd Xh remaining" for deadlines more than a day away', () => {
    const future = new Date(Date.now() + (2 * 24 + 3) * 60 * 60 * 1000);
    expect(formatTimeRemaining(future)).toBe('2d 3h remaining');
  });

  it('accepts a date string', () => {
    const future = new Date(Date.now() + 10 * 60 * 1000);
    expect(formatTimeRemaining(future.toISOString())).toBe('10m remaining');
  });

  it('returns at least "1m remaining" for imminent deadlines', () => {
    const future = new Date(Date.now() + 30 * 1000); // 30 seconds
    expect(formatTimeRemaining(future)).toBe('1m remaining');
  });
});

// ---------------------------------------------------------------------------
// isDeadlinePassed
// ---------------------------------------------------------------------------
describe('isDeadlinePassed', () => {
  it('returns true for past dates', () => {
    const past = new Date(Date.now() - 60 * 1000);
    expect(isDeadlinePassed(past)).toBe(true);
  });

  it('returns false for future dates', () => {
    const future = new Date(Date.now() + 60 * 1000);
    expect(isDeadlinePassed(future)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isDeadlinePassed(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isDeadlinePassed(undefined)).toBe(false);
  });

  it('accepts a date string', () => {
    const past = new Date(Date.now() - 60 * 1000);
    expect(isDeadlinePassed(past.toISOString())).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// shortAddr
// ---------------------------------------------------------------------------
describe('shortAddr', () => {
  it('truncates a full wallet address to first 6 + last 4 chars', () => {
    const addr = '0xabcdef1234567890abcdef1234567890abcdef12';
    expect(shortAddr(addr)).toBe('0xabcd...ef12');
  });

  it('uses the ...  separator', () => {
    const addr = '0x1234567890abcdef1234567890abcdef12345678';
    const result = shortAddr(addr);
    expect(result).toContain('...');
    expect(result.split('...').length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// formatNumber
// ---------------------------------------------------------------------------
describe('formatNumber', () => {
  it('formats numbers below 1000 as plain integers', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(42)).toBe('42');
  });

  it('formats numbers in the thousands with K suffix', () => {
    expect(formatNumber(1000)).toBe('1.0K');
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(5000)).toBe('5.0K');
  });

  it('formats numbers in the millions with M suffix', () => {
    expect(formatNumber(1_000_000)).toBe('1.0M');
    expect(formatNumber(2_500_000)).toBe('2.5M');
  });
});
