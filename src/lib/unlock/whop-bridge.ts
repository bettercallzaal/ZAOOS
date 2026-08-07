/**
 * Unlock -> Whop crypto-access bridge (doc 2233, Zaal-greenlit build).
 *
 * The flow: a person pays in crypto by buying an Unlock key (an on-chain membership
 * NFT on Base, a lock ZAO owns). This module verifies key-holding on-chain (reusing
 * `hasValidKey`/`findKeyHolder` - the same reads that gate event tickets, doc 863)
 * and grants the downstream surface - a Whop membership - keeping the money door
 * ZAO-owned and on-chain while Whop is only the community/clipper backend.
 *
 * GATING (doc 2233 + silent-failure-guard rule 6): the Whop side needs credentials
 * Zaal holds. Absent WHOP_API_KEY, the grant is a NO-OP that returns
 * `granted: false, reason: 'whop-disabled'` and logs LOUDLY - never a silent pass,
 * and verification still runs so callers can gate on `keyHolder` alone (Unlock is
 * the source of truth; Whop is a replaceable downstream).
 *
 * Expiry sync design: Unlock is canonical. `syncGrant` re-verifies the key on-chain
 * and reports `revoke` when the key lapsed - the caller deactivates the Whop side.
 * Mapping storage is the caller's (Supabase table or file); this module is pure
 * logic + the (gated) Whop call, so it stays testable with no I/O of its own.
 *
 * Credit: Unlock Protocol (MIT) - on-chain memberships; Whop - memberships API.
 */
import { findKeyHolder, hasValidKey } from './lock';

export interface GrantRequest {
  /** The ZAO-owned membership lock on Base. */
  lockAddress: string;
  /** Candidate wallets (e.g. a Farcaster user's custody + verified addresses). */
  wallets: string[];
  /** The Whop identifier to grant to (user id or email), when Whop is enabled. */
  whopUser?: string;
}

export interface GrantResult {
  /** The wallet that holds a valid key, or null (no key = nothing granted). */
  keyHolder: string | null;
  /** True only when a Whop membership grant actually succeeded. */
  granted: boolean;
  /** 'ok' | 'no-key' | 'whop-disabled' | 'whop-error' */
  reason: string;
}

/** A stored key<->membership mapping row (persistence is the caller's). */
export interface GrantMapping {
  lockAddress: string;
  keyHolder: string;
  whopUser: string;
  grantedAt: string;
}

export function whopEnabled(): boolean {
  return Boolean(process.env.WHOP_API_KEY);
}

/**
 * The (gated) Whop membership grant. Exported for test mocking; real call only
 * runs with WHOP_API_KEY present. Uses the public v1 API shape (docs.whop.com).
 */
export async function grantWhopMembership(
  whopUser: string,
): Promise<{ ok: boolean; detail: string }> {
  const apiKey = process.env.WHOP_API_KEY;
  const planId = process.env.WHOP_PLAN_ID;
  if (!apiKey || !planId) {
    // LOUD no-op: the bridge is configured off. Never silent (rule 6).
    console.error(
      `[unlock-whop] Whop grant SKIPPED for ${whopUser}: ${!apiKey ? 'WHOP_API_KEY' : 'WHOP_PLAN_ID'} not set - bridge is Unlock-only until Zaal enables Whop`,
    );
    return { ok: false, detail: 'whop-disabled' };
  }
  try {
    const res = await fetch('https://api.whop.com/api/v1/memberships', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: planId,
        user: whopUser,
        metadata: { source: 'unlock-bridge' },
      }),
    });
    if (!res.ok) {
      console.error(`[unlock-whop] Whop grant FAILED for ${whopUser}: HTTP ${res.status}`);
      return { ok: false, detail: `whop-http-${res.status}` };
    }
    return { ok: true, detail: 'ok' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error(`[unlock-whop] Whop grant ERROR for ${whopUser}: ${msg}`);
    return { ok: false, detail: 'whop-error' };
  }
}

/**
 * Grant-on-key: verify on-chain key-holding, then grant the Whop side (when enabled).
 * The on-chain verification ALWAYS runs - callers can gate on `keyHolder` alone.
 */
export async function grantOnKey(
  req: GrantRequest,
  deps: {
    findHolder?: typeof findKeyHolder;
    grantWhop?: typeof grantWhopMembership;
  } = {},
): Promise<GrantResult> {
  const findHolder = deps.findHolder ?? findKeyHolder;
  const grantWhop = deps.grantWhop ?? grantWhopMembership;

  const keyHolder = await findHolder(req.lockAddress, req.wallets);
  if (!keyHolder) {
    return { keyHolder: null, granted: false, reason: 'no-key' };
  }
  if (!req.whopUser || !whopEnabled()) {
    if (req.whopUser && !whopEnabled()) {
      console.error(
        '[unlock-whop] key verified but Whop side disabled (no WHOP_API_KEY) - Unlock-only grant',
      );
    }
    return { keyHolder, granted: false, reason: 'whop-disabled' };
  }
  const whop = await grantWhop(req.whopUser);
  return { keyHolder, granted: whop.ok, reason: whop.detail };
}

/**
 * Expiry sync: Unlock is the source of truth. Re-verify a stored mapping's key
 * on-chain; 'keep' while valid, 'revoke' when lapsed (caller deactivates Whop).
 */
export async function syncGrant(
  mapping: Pick<GrantMapping, 'lockAddress' | 'keyHolder'>,
  deps: { hasKey?: typeof hasValidKey } = {},
): Promise<'keep' | 'revoke'> {
  const hasKey = deps.hasKey ?? hasValidKey;
  return (await hasKey(mapping.lockAddress, mapping.keyHolder)) ? 'keep' : 'revoke';
}
