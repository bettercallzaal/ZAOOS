import { supabaseAdmin } from '@/lib/db/supabase';
import type { AllowlistEntry } from '@/types';

/** The membership lookup could not complete. Callers must not read this as "not a member". */
export class AllowlistLookupError extends Error {
  constructor(lookup: string) {
    super(`allowlist lookup failed: ${lookup}`);
    this.name = 'AllowlistLookupError';
  }
}

/**
 * supabase-js RESOLVES with `{ data: null, error }` on a database error instead
 * of throwing, so `data: null` alone cannot tell "no row" from "lookup failed".
 */
function unwrap<T>(result: { data: T | null; error: unknown }, lookup: string): T | null {
  if (result.error) throw new AllowlistLookupError(lookup);
  return result.data;
}

/**
 * Three outcomes:
 * - resolves `{ allowed: true }`: a member;
 * - resolves `{ allowed: false }`: every lookup COMPLETED and none matched;
 * - throws `AllowlistLookupError`: unknown. Never treat this as not-a-member
 *   (that would downgrade a member to a visitor on a database error).
 */
export async function checkAllowlist(
  fid?: number,
  walletAddress?: string,
): Promise<{ allowed: boolean; entry?: AllowlistEntry }> {
  if (!fid && !walletAddress) {
    return { allowed: false };
  }

  // Check by FID first (fastest, most reliable)
  if (fid) {
    const fidMatch = unwrap(
      await supabaseAdmin
        .from('allowlist')
        .select('*')
        .eq('fid', fid)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle(),
      'fidMatch',
    );

    if (fidMatch) return { allowed: true, entry: fidMatch as AllowlistEntry };
  }

  // Check by wallet address — search across all wallet fields
  if (walletAddress) {
    const addr = walletAddress.toLowerCase();

    // Check primary wallet_address
    const primaryMatch = unwrap(
      await supabaseAdmin
        .from('allowlist')
        .select('*')
        .eq('wallet_address', addr)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle(),
      'primaryMatch',
    );

    if (primaryMatch) return { allowed: true, entry: primaryMatch as AllowlistEntry };

    // Check custody_address
    const custodyMatch = unwrap(
      await supabaseAdmin
        .from('allowlist')
        .select('*')
        .eq('custody_address', addr)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle(),
      'custodyMatch',
    );

    if (custodyMatch) return { allowed: true, entry: custodyMatch as AllowlistEntry };

    // Check verified_addresses JSONB array
    const verifiedMatch = unwrap(
      await supabaseAdmin
        .from('allowlist')
        .select('*')
        .contains('verified_addresses', [addr])
        .eq('is_active', true)
        .limit(1)
        .maybeSingle(),
      'verifiedMatch',
    );

    if (verifiedMatch) return { allowed: true, entry: verifiedMatch as AllowlistEntry };
  }

  // Fallback: check users table (for users added via admin panel)
  if (fid) {
    const userByFid = unwrap(
      await supabaseAdmin
        .from('users')
        .select('id, primary_wallet')
        .eq('fid', fid)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle(),
      'userByFid',
    );

    if (userByFid) return { allowed: true };
  }

  if (walletAddress) {
    const addr = walletAddress.toLowerCase();
    const userByWallet = unwrap(
      await supabaseAdmin
        .from('users')
        .select('id, primary_wallet')
        .eq('primary_wallet', addr)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle(),
      'userByWallet',
    );

    if (userByWallet) return { allowed: true };
  }

  return { allowed: false };
}
