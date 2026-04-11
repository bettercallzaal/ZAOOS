'use client';

/**
 * Portal gate utilities.
 * Wraps existing gate checks for use in the portal hub.
 *
 * Note: The actual allowlist/token checks happen server-side via API calls.
 * This client component provides the check functions that call those APIs.
 */

export async function checkAllowlistGate(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/session');
    if (!res.ok) return false;
    const data = await res.json();
    return !!data?.session?.fid;
  } catch {
    return false;
  }
}

export async function checkTokenGate(_contractAddress: string, _chainId: number): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/session');
    if (!res.ok) return false;
    // If user has a session, they passed the allowlist
    // Token gating would need wallet connection - for now, session = access
    const data = await res.json();
    return !!data?.session?.fid;
  } catch {
    return false;
  }
}
