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


  it("classifies weekly limit and extracts reset time (measured VPS failure)", () => {
    const r1 = classifyClaudeError("You've hit your weekly limit · resets 10am (UTC)");
    expect(r1.kind).toBe("usage_limit");
    expect(r1.resetTime).toBe("10am (UTC)");
    expect(r1.hint).toBe("Claude capped until 10am (UTC)");

    const r2 = classifyClaudeError("You've hit your weekly limit · resets Sep 17, 10am (UTC)");
    expect(r2.kind).toBe("usage_limit");
    expect(r2.resetTime).toBe("Sep 17, 10am (UTC)");
    expect(r2.hint).toBe("Claude capped until Sep 17, 10am (UTC)");
  });

  it("classifies api_error_status 429 usage limit with reset time", () => {
    const r = classifyClaudeError('api_error_status: 429 "You\'ve hit your usage limit" · resets 10am (UTC)');
    expect(r.kind).toBe("usage_limit");
    expect(r.resetTime).toBe("10am (UTC)");
    expect(r.hint).toBe("Claude capped until 10am (UTC)");
  });

  it('always returns a non-empty actionable hint', () => {
    for (const s of ['401', 'usage limit', '429', 'timeout', 'weird']) {
      expect(classifyClaudeError(s).hint.length).toBeGreaterThan(0);
    }
  });
});
