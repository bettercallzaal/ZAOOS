import { describe, expect, it } from 'vitest';
import { CliAuthError, CliError } from '../../hermes/claude-cli';
import { AUTH_FAIL_DM_LINE, AUTH_FAIL_GROUP_LINE, conciergeErrorReply, isAuthFailure } from '../concierge-error-reply';

// The verbatim shape that reached ZAO Devz General on 2026-11-10 (journal,
// 13:37 UTC), truncated as claude-cli.ts truncates it.
const VERBATIM =
  'claude CLI exited 1:  {"type":"result","subtype":"success","is_error":true,"api_error_status":401,"duration_ms":1897,"duration_api_ms":0,"num_turns":1,"result":"Failed to authenticate. API Error: 401 OAuth access token has expired. Re-authenticate to continue."}';

describe('conciergeErrorReply', () => {
  it('turns an auth failure in a group into one plain sentence with no raw JSON', () => {
    const line = conciergeErrorReply(new CliAuthError(VERBATIM), '-1001234');
    expect(line).toBe(AUTH_FAIL_GROUP_LINE);
    expect(line).not.toContain('api_error_status');
    expect(line).not.toContain('{');
  });

  it("names Zaal's fix step in his DM", () => {
    const line = conciergeErrorReply(new CliAuthError(VERBATIM), 'private');
    expect(line).toBe(AUTH_FAIL_DM_LINE);
    expect(line).toContain('/login');
  });

  it('treats a CliError of kind auth the same way', () => {
    expect(isAuthFailure(new CliError('x', 'auth'))).toBe(true);
    expect(conciergeErrorReply(new CliError('x', 'auth'), '-1001234')).toBe(AUTH_FAIL_GROUP_LINE);
  });

  it.each([
    ['rate limit', new CliError('claude CLI exited 1 [rate_limit: rate-limited/overloaded]', 'rate_limit')],
    ['plain Error', new Error('boom')],
  ])('leaves a non-auth failure (%s) on the old raw line', (_name, err) => {
    expect(isAuthFailure(err)).toBe(false);
    expect(conciergeErrorReply(err, '-1001234')).toBe(`(concierge error - ${(err as Error).message.slice(0, 200)})`);
  });

  it('handles a thrown non-Error value', () => {
    expect(conciergeErrorReply('weird', 'private')).toBe('(concierge error - weird)');
  });
});
