import { supabaseAdmin } from '@/lib/db/supabase';
import { AllowlistEntry } from '@/types';

export async function checkAllowlist(
  fid?: number,
  walletAddress?: string
): Promise<{ allowed: boolean; entry?: AllowlistEntry }> {
  if (!fid && !walletAddress) {
    return { allowed: false };
  }

  // Check by FID first
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

  // Check by wallet address
  if (walletAddress) {
    const { data } = await supabaseAdmin
      .from('allowlist')
      .select('*')
      .ilike('wallet_address', walletAddress)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (data) return { allowed: true, entry: data as AllowlistEntry };
  }

  return { allowed: false };
}
