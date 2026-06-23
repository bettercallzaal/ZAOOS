import { describe, it, expect } from 'vitest';
import { classifyClaudeError } from '../claude-cli';

describe('classifyClaudeError', () => {
  it('detects auth/OAuth expiry (the 2026-06-23 fleet outage)', () => {
    expect(classifyClaudeError('API Error: 401 Invalid authentication credentials').kind).toBe('auth');
    expect(classifyClaudeError('Failed to authenticate. Please run /login').kind).toBe('auth');
    expect(classifyClaudeError('oauth token expired').kind).toBe('auth');
  });

  it('detects usage/quota limits before generic rate limits', () => {
    expect(classifyClaudeError('You have reached your usage limit').kind).toBe('usage_limit');
    expect(classifyClaudeError('quota exceeded for this plan').kind).toBe('usage_limit');
  });

  it('detects rate limiting / overload', () => {
    expect(classifyClaudeError('HTTP 429 Too Many Requests').kind).toBe('rate_limit');
    expect(classifyClaudeError('529 overloaded, try again').kind).toBe('rate_limit');
  });

  it('detects timeouts', () => {
    expect(classifyClaudeError('request timed out').kind).toBe('timeout');
    expect(classifyClaudeError('ETIMEDOUT').kind).toBe('timeout');
  });

  it('falls back to unknown for unrecognized output', () => {
    expect(classifyClaudeError('some random parse error').kind).toBe('unknown');
    expect(classifyClaudeError('').kind).toBe('unknown');
  });

  it('always returns a non-empty actionable hint', () => {
    for (const s of ['401', 'usage limit', '429', 'timeout', 'weird']) {
      expect(classifyClaudeError(s).hint.length).toBeGreaterThan(0);
    }
  });
});
