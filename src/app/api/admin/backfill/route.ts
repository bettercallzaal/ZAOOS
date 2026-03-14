import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const NEYNAR_BASE = 'https://api.neynar.com/v2/farcaster';
const headers = () => ({
  'Content-Type': 'application/json',
  'x-api-key': process.env.NEYNAR_API_KEY!,
});

interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  custody_address: string;
  verified_addresses: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
}

/**
 * POST /api/admin/backfill
 * Looks up each allowlist entry missing a FID by wallet address on Neynar,
 * fills in fid, username, display_name, pfp_url, custody_address, verified_addresses.
 */
export async function POST() {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  // Get all active entries missing a FID
  const { data: entries, error } = await supabaseAdmin
    .from('allowlist')
    .select('id, fid, wallet_address, ign, real_name, username, pfp_url')
    .eq('is_active', true);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch allowlist' }, { status: 500 });
  }

  // Find entries that need backfill: missing FID or missing profile data
  const needsBackfill = (entries || []).filter(
    (e) => e.wallet_address && (!e.fid || !e.pfp_url || !e.username)
  );

  if (needsBackfill.length === 0) {
    return NextResponse.json({ message: 'All entries already have FIDs and profiles', updated: 0 });
  }

  const results: { id: string; ign: string | null; status: string; fid?: number }[] = [];

  // Batch lookup by address — Neynar supports up to 350 addresses per request
  const BATCH_SIZE = 50;
  for (let i = 0; i < needsBackfill.length; i += BATCH_SIZE) {
    const batch = needsBackfill.slice(i, i + BATCH_SIZE);
    const addresses = batch.map((e) => e.wallet_address!.toLowerCase());

    try {
      const res = await fetch(
        `${NEYNAR_BASE}/user/bulk-by-address?addresses=${addresses.join(',')}`,
        { headers: headers() }
      );

      if (!res.ok) {
        console.error(`Neynar bulk-by-address error: ${res.status}`);
        for (const e of batch) {
          results.push({ id: e.id, ign: e.ign, status: `neynar_error_${res.status}` });
        }
        continue;
      }

      const data = await res.json();

      for (const entry of batch) {
        const addr = entry.wallet_address!.toLowerCase();
        const users: NeynarUser[] | undefined = data[addr];
        const user = users?.[0];

        if (!user) {
          results.push({ id: entry.id, ign: entry.ign, status: 'no_farcaster_account' });
          continue;
        }

        // Build update — only fill in missing fields, don't overwrite existing data
        const update: Record<string, unknown> = {};

        if (!entry.fid) update.fid = user.fid;
        if (!entry.username) update.username = user.username;
        if (!entry.pfp_url) update.pfp_url = user.pfp_url;
        if (!entry.ign && !entry.real_name) update.display_name = user.display_name;

        // Always update these if we have them
        update.custody_address = user.custody_address;
        update.verified_addresses = user.verified_addresses?.eth_addresses || [];
        if (user.display_name && !update.display_name) {
          update.display_name = user.display_name;
        }

        const { error: updateError } = await supabaseAdmin
          .from('allowlist')
          .update(update)
          .eq('id', entry.id);

        if (updateError) {
          results.push({ id: entry.id, ign: entry.ign, status: `db_error: ${updateError.message}` });
        } else {
          results.push({ id: entry.id, ign: entry.ign, status: 'updated', fid: user.fid });
        }
      }
    } catch (err) {
      console.error('Backfill batch error:', err);
      for (const e of batch) {
        results.push({ id: e.id, ign: e.ign, status: 'error' });
      }
    }
  }

  const updated = results.filter((r) => r.status === 'updated').length;
  const noAccount = results.filter((r) => r.status === 'no_farcaster_account').length;
  const errors = results.filter((r) => r.status !== 'updated' && r.status !== 'no_farcaster_account').length;

  return NextResponse.json({
    message: `Backfill complete: ${updated} updated, ${noAccount} no Farcaster account, ${errors} errors`,
    updated,
    noAccount,
    errors,
    details: results,
  });
}
