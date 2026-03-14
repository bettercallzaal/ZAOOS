import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * Returns all active ZAO allowlist members with their profile info
 * and wallet addresses (for XMTP canMessage checks).
 */
export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('allowlist')
    .select('fid, username, real_name, ign, display_name, pfp_url, wallet_address, custody_address, verified_addresses')
    .eq('is_active', true)
    .order('ign', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to load members' }, { status: 500 });
  }

  const members = (data || []).map((m) => ({
    fid: m.fid,
    username: m.username || null,
    displayName: m.display_name || m.ign || m.real_name || (m.fid ? `FID ${m.fid}` : 'Unknown'),
    pfpUrl: m.pfp_url || null,
    // All possible addresses for XMTP canMessage check
    addresses: [
      m.wallet_address,
      m.custody_address,
      ...((m.verified_addresses as string[]) || []),
    ].filter(Boolean) as string[],
  }));

  return NextResponse.json({ members, currentFid: session.fid });
}
