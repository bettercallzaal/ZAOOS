import { describe, expect, it } from 'vitest';
import { decideMembership, RESPECT_RECHECK_MS, UNKNOWN_GRACE_MS } from '@/lib/membership';

const NOW = 1_800_000_000_000;
const member = { status: 'member', address: '0x1111111111111111111111111111111111111111' } as const;
const notMember = { status: 'not-member', checked: 2 } as const;
const unknown = { status: 'unknown', reason: 'rpc down' } as const;

describe('decideMembership', () => {
  it('trusts a check younger than the re-check interval without a new read', () => {
    expect(decideMembership(NOW - RESPECT_RECHECK_MS + 1, NOW, null)).toEqual({ action: 'allow', refresh: false });
  });

  it('refreshes when a stale session re-checks as a member', () => {
    expect(decideMembership(NOW - RESPECT_RECHECK_MS, NOW, member)).toEqual({ action: 'allow', refresh: true });
  });

  it('revokes a session whose holder no longer has Respect', () => {
    expect(decideMembership(NOW - RESPECT_RECHECK_MS, NOW, notMember)).toEqual({ action: 'deny', revoke: true });
  });

  it('keeps access through an outage while the last good check is inside the grace window', () => {
    expect(decideMembership(NOW - UNKNOWN_GRACE_MS + 1, NOW, unknown)).toEqual({ action: 'allow', refresh: false });
  });

  it('refuses once the outage outlasts the grace window, without revoking', () => {
    expect(decideMembership(NOW - UNKNOWN_GRACE_MS, NOW, unknown)).toEqual({ action: 'deny', revoke: false });
  });

  it('refuses a session with no check time at all', () => {
    expect(decideMembership(null, NOW, null)).toEqual({ action: 'deny', revoke: true });
  });

  it('refuses a stale session if no fresh check was supplied', () => {
    expect(decideMembership(NOW - RESPECT_RECHECK_MS, NOW, null)).toEqual({ action: 'deny', revoke: false });
  });
});
