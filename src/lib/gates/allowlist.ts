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
      .single();

    if (data) return { allowed: true, entry: data as AllowlistEntry };
  }

  // Check by wallet address — search across all wallet fields
  if (walletAddress) {
    const addr = walletAddress.toLowerCase();

    // Check primary wallet_address
    const { data: primaryMatch } = await supabaseAdmin
      .from('allowlist')
      .select('*')
      .ilike('wallet_address', addr)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (primaryMatch) return { allowed: true, entry: primaryMatch as AllowlistEntry };

    // Check custody_address
    const { data: custodyMatch } = await supabaseAdmin
      .from('allowlist')
      .select('*')
      .ilike('custody_address', addr)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (custodyMatch) return { allowed: true, entry: custodyMatch as AllowlistEntry };

    // Check verified_addresses JSONB array
    const { data: verifiedMatch } = await supabaseAdmin
      .from('allowlist')
      .select('*')
      .contains('verified_addresses', [addr])
      .eq('is_active', true)
      .limit(1)
      .single();

    if (verifiedMatch) return { allowed: true, entry: verifiedMatch as AllowlistEntry };
  }

  return { allowed: false };
}
