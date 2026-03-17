import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { ENV } from '@/lib/env';

const NEYNAR_BASE = 'https://api.neynar.com/v2/farcaster';

/**
 * Returns all active ZAO allowlist members with their profile info
 * and wallet addresses (for XMTP canMessage checks).
 * Enriches members missing pfp/username from Neynar.
 */
export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('allowlist')
    .select('id, fid, username, real_name, ign, display_name, pfp_url, wallet_address, custody_address, verified_addresses')
    .eq('is_active', true)
    .order('ign', { ascending: true })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: 'Failed to load members' }, { status: 500 });
  }

  // Find members with FIDs but missing profile data
  const needsEnrich = (data || []).filter((m) => m.fid && (!m.pfp_url || !m.username));
  const enrichMap = new Map<number, { username: string; display_name: string; pfp_url: string }>();

  if (needsEnrich.length > 0) {
    // Batch fetch from Neynar (max 100 per request)
    const fids = needsEnrich.map((m) => m.fid).filter(Boolean);
    const batches = [];
    for (let i = 0; i < fids.length; i += 100) {
      batches.push(fids.slice(i, i + 100));
    }

    for (const batch of batches) {
      try {
        const res = await fetch(`${NEYNAR_BASE}/user/bulk?fids=${batch.join(',')}`, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ENV.NEYNAR_API_KEY,
          },
        });
        if (res.ok) {
          const json = await res.json();
          for (const u of json.users || []) {
            enrichMap.set(u.fid, {
              username: u.username,
              display_name: u.display_name,
              pfp_url: u.pfp_url,
            });
          }
        }
      } catch { /* continue without enrichment */ }
    }

    // Backfill DB so we don't re-fetch next time
    for (const m of needsEnrich) {
      const enriched = enrichMap.get(m.fid);
      if (enriched) {
        const { error: backfillError } = await supabaseAdmin
          .from('allowlist')
          .update({
            username: m.username || enriched.username,
            display_name: m.display_name || enriched.display_name,
            pfp_url: m.pfp_url || enriched.pfp_url,
          })
          .eq('id', m.id);
        if (backfillError) console.error('[members] backfill error for id', m.id, backfillError);
      }
    }
  }

  // Fetch last_login_at and xmtp_address from users table for all members with FIDs
  const fidsForLogin = (data || []).map((m) => m.fid).filter(Boolean);
  const loginMap = new Map<number, string>();
  const xmtpAddrMap = new Map<number, string>();
  if (fidsForLogin.length > 0) {
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('fid, last_login_at, xmtp_address')
      .in('fid', fidsForLogin)
      .not('last_login_at', 'is', null);
    for (const u of userData || []) {
      if (u.fid && u.last_login_at) loginMap.set(u.fid, u.last_login_at);
      if (u.fid && u.xmtp_address) xmtpAddrMap.set(u.fid, u.xmtp_address);
    }
  }

  const members = (data || []).map((m) => {
    const enriched = m.fid ? enrichMap.get(m.fid) : undefined;
    return {
      fid: m.fid,
      username: m.username || enriched?.username || null,
      displayName: m.display_name || enriched?.display_name || m.ign || m.real_name || (m.fid ? `FID ${m.fid}` : 'Unknown'),
      pfpUrl: m.pfp_url || enriched?.pfp_url || null,
      addresses: [
        m.fid ? xmtpAddrMap.get(m.fid) : undefined,
        m.wallet_address,
        m.custody_address,
        ...((m.verified_addresses as string[]) || []),
      ].filter(Boolean) as string[],
      storedXmtpAddress: m.fid ? (xmtpAddrMap.get(m.fid) || null) : null,
      lastLoginAt: m.fid ? (loginMap.get(m.fid) || null) : null,
    };
  });

  return NextResponse.json({ members, currentFid: session.fid });
}
