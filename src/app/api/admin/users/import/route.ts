import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getUsersByFids } from '@/lib/farcaster/neynar';

/**
 * POST — Import all allowlist entries into the users table.
 * Skips entries that already exist (by wallet or FID).
 */
export async function POST() {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    // Fetch all active allowlist entries
    const { data: entries, error: fetchErr } = await supabaseAdmin
      .from('allowlist')
      .select('*')
      .eq('is_active', true);

    if (fetchErr) throw fetchErr;
    if (!entries || entries.length === 0) {
      return NextResponse.json({ imported: 0, skipped: 0, message: 'No allowlist entries to import' });
    }

    // Get existing users to avoid duplicates
    const { data: existingUsers } = await supabaseAdmin.from('users').select('primary_wallet, fid');
    const existingWallets = new Set((existingUsers || []).map((u) => u.primary_wallet?.toLowerCase()).filter(Boolean));
    const existingFids = new Set((existingUsers || []).map((u) => u.fid).filter(Boolean));

    // Batch-fetch all Farcaster profiles in one API call (instead of N+1 per entry)
    const allFids = entries.map((e) => e.fid).filter(Boolean) as number[];
    const fcUserMap = new Map<number, Record<string, unknown>>();
    if (allFids.length > 0) {
      try {
        const fcUsers = await getUsersByFids(allFids);
        for (const u of fcUsers) fcUserMap.set(u.fid, u);
      } catch (err) {
        console.warn('[import] Batch Farcaster fetch failed, using cached data:', err);
      }
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const entry of entries) {
      try {
        // Determine primary wallet
        let primaryWallet = (entry.wallet_address || entry.custody_address || '').toLowerCase();
        const verifiedAddresses: string[] = entry.verified_addresses || [];
        const fcUser = entry.fid ? fcUserMap.get(entry.fid) : undefined;

        // If no wallet but have Farcaster data, use it
        if (!primaryWallet && fcUser) {
          primaryWallet = ((fcUser.custody_address as string) || (fcUser.verified_addresses as { eth_addresses?: string[] })?.eth_addresses?.[0] || '').toLowerCase();
        }

        // If still no wallet, use a placeholder keyed on FID
        if (!primaryWallet && entry.fid) {
          primaryWallet = `fid:${entry.fid}`;
        }

        if (!primaryWallet) {
          skipped++;
          continue;
        }

        // Skip if already exists
        if (existingWallets.has(primaryWallet) || (entry.fid && existingFids.has(entry.fid))) {
          skipped++;
          continue;
        }

        // Use fresh Farcaster data if available
        let bio: string | null = null;
        let freshDisplayName = entry.display_name;
        let freshPfpUrl = entry.pfp_url;
        let freshUsername = entry.username;
        let custodyAddress = entry.custody_address;
        let freshVerified = verifiedAddresses;

        if (fcUser) {
          freshDisplayName = (fcUser.display_name as string) || freshDisplayName;
          freshPfpUrl = (fcUser.pfp_url as string) || freshPfpUrl;
          freshUsername = (fcUser.username as string) || freshUsername;
          custodyAddress = (fcUser.custody_address as string) || custodyAddress;
          freshVerified = (fcUser.verified_addresses as { eth_addresses?: string[] })?.eth_addresses || freshVerified;
          bio = (fcUser.profile as { bio?: { text?: string } })?.bio?.text || null;

          // Update primary wallet if we got a real one
          if (primaryWallet.startsWith('fid:') && fcUser.custody_address) {
            primaryWallet = (fcUser.custody_address as string).toLowerCase();
          }
        }

        const userData = {
          primary_wallet: primaryWallet,
          fid: entry.fid || null,
          username: freshUsername || null,
          display_name: freshDisplayName || entry.ign || entry.real_name || primaryWallet.slice(0, 10),
          pfp_url: freshPfpUrl || null,
          bio,
          custody_address: custodyAddress || null,
          verified_addresses: freshVerified.length > 0 ? freshVerified : [],
          ens_name: entry.ens_name || null,
          role: entry.fid ? 'member' : 'beta',
          real_name: entry.real_name || null,
          ign: entry.ign || null,
          notes: entry.notes || null,
          is_active: true,
        };

        const { error: insertErr } = await supabaseAdmin.from('users').insert(userData);

        if (insertErr) {
          if (insertErr.code === '23505') {
            skipped++;
          } else {
            errors.push(`${entry.ign || entry.fid || primaryWallet}: ${insertErr.message}`);
          }
        } else {
          imported++;
          existingWallets.add(primaryWallet);
          if (entry.fid) existingFids.add(entry.fid);
        }
      } catch (err) {
        errors.push(`${entry.ign || entry.fid}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      total: entries.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Imported ${imported} users, skipped ${skipped} duplicates${errors.length > 0 ? `, ${errors.length} errors` : ''}`,
    });
  } catch (error) {
    console.error('Import users error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
