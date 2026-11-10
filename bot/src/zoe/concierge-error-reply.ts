/**
 * concierge-error-reply.ts - the one line ZOE sends when a concierge turn fails.
 *
 * Before this file the catch in index.ts dispatchConcierge replied
 * `(concierge error - <raw message>)` in every scope. On 2026-11-10 at 13:37
 * UTC that put the claude CLI's raw result JSON ("api_error_status 401 ...
 * Failed to authenticate") into the ZAO Devz group, when Zaal asked for a
 * weekly recap. The cause, read from the VPS journal the same day, was "401
 * OAuth access token has expired": the Max-plan login under ~/.claude on the
 * host had lapsed, and the hourly auth probe had already logged it.
 *
 * An auth failure is not something a group member can act on, and the raw text
 * reads as a crash. So an auth failure becomes one plain sentence:
 *   - in a group: says ZOE cannot answer and that Zaal has to sign her back in;
 *   - in Zaal's DM: names his fix step (run `claude`, then /login, on the host).
 * Every other failure keeps the old raw line, unchanged, so nothing else moves.
 *
 * Pure, so it is tested without importing index.ts (agent-loops.md rule 21).
 */

import { CliAuthError, CliError } from '../hermes/claude-cli';

export const AUTH_FAIL_GROUP_LINE =
  "I can't answer right now: my Claude login on the server has expired. Zaal needs to sign me back in.";

export const AUTH_FAIL_DM_LINE =
  "I can't reach Claude: my login on the server has expired. Fix: open a terminal on the VPS, run `claude`, then /login.";

export function isAuthFailure(err: unknown): boolean {
  if (err instanceof CliAuthError) return true;
  return err instanceof CliError && err.kind === 'auth';
}

export function conciergeErrorReply(err: unknown, scope: 'private' | string): string {
  if (isAuthFailure(err)) return scope === 'private' ? AUTH_FAIL_DM_LINE : AUTH_FAIL_GROUP_LINE;
  const msg = err instanceof Error ? err.message : String(err);
  return `(concierge error - ${msg.slice(0, 200)})`;
}
