import { supabaseAdmin } from '@/lib/db/supabase';
import { AllowlistEntry } from '@/types';

export async function checkAllowlist(
  fid?: number,
  walletAddress?: string
): Promise<{ allowed: boolean; entry?: AllowlistEntry }> {
  if (!fid && !walletAddress) {
    return { allowed: false };
  }

  // Check by FID first (fastest, most reliable)
  if (fid) {
    const { data } = await supabaseAdmin
      .from('allowlist')
      .select('*')
      .eq('fid', fid)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (data) return { allowed: true, entry: data as AllowlistEntry };
  }

  // Check by wallet address — search across all wallet fields
  if (walletAddress) {
    const addr = walletAddress.toLowerCase();

    // Check primary wallet_address
    const { data: primaryMatch } = await supabaseAdmin
      .from('allowlist')
      .select('*')
      .eq('wallet_address', addr)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (primaryMatch) return { allowed: true, entry: primaryMatch as AllowlistEntry };

    // Check custody_address
    const { data: custodyMatch } = await supabaseAdmin
      .from('allowlist')
      .select('*')
      .eq('custody_address', addr)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (custodyMatch) return { allowed: true, entry: custodyMatch as AllowlistEntry };

    // Check verified_addresses JSONB array
    const { data: verifiedMatch } = await supabaseAdmin
      .from('allowlist')
      .select('*')
      .contains('verified_addresses', [addr])
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (verifiedMatch) return { allowed: true, entry: verifiedMatch as AllowlistEntry };
  }

  // Fallback: check users table (for users added via admin panel)
  if (fid) {
    const { data: userByFid } = await supabaseAdmin
      .from('users')
      .select('id, primary_wallet')
      .eq('fid', fid)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (userByFid) return { allowed: true };
  }

  if (walletAddress) {
    const addr = walletAddress.toLowerCase();
    const { data: userByWallet } = await supabaseAdmin
      .from('users')
      .select('id, primary_wallet')
      .eq('primary_wallet', addr)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (userByWallet) return { allowed: true };
  }

  return { allowed: false };
}
