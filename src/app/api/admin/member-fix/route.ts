import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const actionSchema = z.object({
  action: z.enum(['link-fids', 'enrich-profiles', 'import-socials', 'sync-tiers', 'link-profiles', 'all']),
});

/**
 * POST /api/admin/member-fix — Auto-fix member data issues
 * Actions:
 * - link-fids: Search Neynar for wallet-only users, auto-link FIDs
 * - enrich-profiles: Backfill missing display_name/pfp/bio from Neynar
 * - sync-tiers: Set member_tier=respect_holder for anyone with respect > 0
 * - all: Run all three
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Admin required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { action } = parsed.data;
    const results: { action: string; fixed: number; errors: number; details: string[] }[] = [];

    // ── 1. Link FIDs for wallet-only users ────────────────────────
    if (action === 'link-fids' || action === 'all') {
      const { data: noFidUsers } = await supabaseAdmin
        .from('users')
        .select('id, primary_wallet, display_name')
        .is('fid', null)
        .eq('is_active', true);

      let linked = 0;
      let errors = 0;
      const details: string[] = [];

      for (const user of noFidUsers || []) {
        if (!user.primary_wallet) continue;
        try {
          // Search Neynar for this wallet address
          const response = await fetch(
            `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${user.primary_wallet}`,
            { headers: { 'api_key': process.env.NEYNAR_API_KEY || '' } }
          );
          if (!response.ok) continue;

          const data = await response.json();
          const walletKey = Object.keys(data || {})[0];
          const fcUser = walletKey ? data[walletKey]?.[0] : null;

          if (fcUser?.fid) {
            await supabaseAdmin
              .from('users')
              .update({
                fid: fcUser.fid,
                username: fcUser.username || null,
                display_name: fcUser.display_name || user.display_name,
                pfp_url: fcUser.pfp_url || null,
                bio: fcUser.profile?.bio?.text || null,
                custody_address: fcUser.custody_address || null,
                verified_addresses: fcUser.verified_addresses?.eth_addresses || [],
              })
              .eq('id', user.id);

            details.push(`${user.display_name || user.primary_wallet} → FID ${fcUser.fid} (@${fcUser.username})`);
            linked++;
          }
        } catch {
          errors++;
        }

        // Rate limit: 100ms between Neynar calls
        await new Promise(r => setTimeout(r, 100));
      }

      results.push({ action: 'link-fids', fixed: linked, errors, details });
    }

    // ── 2. Enrich profiles from Neynar ────────────────────────────
    if (action === 'enrich-profiles' || action === 'all') {
      const { data: incompleteUsers } = await supabaseAdmin
        .from('users')
        .select('id, fid, display_name, pfp_url, bio, username, custody_address, verified_addresses')
        .not('fid', 'is', null)
        .eq('is_active', true);

      let enriched = 0;
      let errors = 0;
      const details: string[] = [];

      // Batch FIDs in groups of 100 (Neynar bulk limit)
      const needsEnrich = (incompleteUsers || []).filter(u =>
        !u.pfp_url || !u.display_name || !u.bio || !u.custody_address
      );

      for (let i = 0; i < needsEnrich.length; i += 100) {
        const batch = needsEnrich.slice(i, i + 100);
        const fids = batch.map(u => u.fid).filter(Boolean);
        if (fids.length === 0) continue;

        try {
          const response = await fetch(
            `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fids.join(',')}`,
            { headers: { 'api_key': process.env.NEYNAR_API_KEY || '' } }
          );
          if (!response.ok) continue;

          const data = await response.json();

          for (const fcUser of data.users || []) {
            const dbUser = batch.find(u => u.fid === fcUser.fid);
            if (!dbUser) continue;

            const updates: Record<string, unknown> = {};
            if (!dbUser.display_name && fcUser.display_name) updates.display_name = fcUser.display_name;
            if (!dbUser.pfp_url && fcUser.pfp_url) updates.pfp_url = fcUser.pfp_url;
            if (!dbUser.bio && fcUser.profile?.bio?.text) updates.bio = fcUser.profile.bio.text;
            if (!dbUser.username && fcUser.username) updates.username = fcUser.username;
            if (!dbUser.custody_address && fcUser.custody_address) updates.custody_address = fcUser.custody_address;
            if ((!dbUser.verified_addresses || dbUser.verified_addresses.length === 0) && fcUser.verified_addresses?.eth_addresses?.length > 0) {
              updates.verified_addresses = fcUser.verified_addresses.eth_addresses;
            }

            if (Object.keys(updates).length > 0) {
              await supabaseAdmin.from('users').update(updates).eq('id', dbUser.id);
              details.push(`${fcUser.display_name || fcUser.username}: +${Object.keys(updates).join(', ')}`);
              enriched++;
            }
          }
        } catch {
          errors++;
        }
      }

      results.push({ action: 'enrich-profiles', fixed: enriched, errors, details });
    }

    // ── 3. Import social handles from Farcaster profiles ──────────
    if (action === 'import-socials' || action === 'all') {
      const { data: usersWithFid } = await supabaseAdmin
        .from('users')
        .select('id, fid, display_name, x_handle, instagram_handle, bio')
        .not('fid', 'is', null)
        .eq('is_active', true);

      let imported = 0;
      let errors = 0;
      const details: string[] = [];

      // Batch in groups of 100
      for (let i = 0; i < (usersWithFid || []).length; i += 100) {
        const batch = (usersWithFid || []).slice(i, i + 100);
        const fids = batch.map(u => u.fid).filter(Boolean);
        if (fids.length === 0) continue;

        try {
          const response = await fetch(
            `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fids.join(',')}`,
            { headers: { 'api_key': process.env.NEYNAR_API_KEY || '' } }
          );
          if (!response.ok) continue;
          const data = await response.json();

          for (const fcUser of data.users || []) {
            const dbUser = batch.find(u => u.fid === fcUser.fid);
            if (!dbUser) continue;

            const updates: Record<string, unknown> = {};

            // Import bio if missing
            if (!dbUser.bio && fcUser.profile?.bio?.text) {
              updates.bio = fcUser.profile.bio.text;
            }

            // Import connected accounts from Farcaster profile
            // Neynar returns connected accounts in the user object
            const connectedAccounts = fcUser.verified_accounts || [];
            for (const account of connectedAccounts) {
              if (account.platform === 'x' && !dbUser.x_handle) {
                updates.x_handle = account.username;
              }
              if (account.platform === 'instagram' && !dbUser.instagram_handle) {
                updates.instagram_handle = account.username;
              }
            }

            // Also check profile bio for common patterns
            const bioText = fcUser.profile?.bio?.text || '';
            if (!dbUser.x_handle && !updates.x_handle) {
              const xMatch = bioText.match(/(?:twitter|x)\.com\/(@?\w+)/i) || bioText.match(/(?:^|\s)@(\w{1,15})(?:\s|$)/);
              if (xMatch) updates.x_handle = xMatch[1].replace('@', '');
            }

            if (Object.keys(updates).length > 0) {
              await supabaseAdmin.from('users').update(updates).eq('id', dbUser.id);
              details.push(`${fcUser.display_name || fcUser.username}: +${Object.keys(updates).join(', ')}`);
              imported++;
            }
          }
        } catch {
          errors++;
        }
      }

      results.push({ action: 'import-socials', fixed: imported, errors, details });
    }

    // ── 4. Link community_profiles to users ─────────────────────────
    if (action === 'link-profiles' || action === 'all') {
      let linked = 0;
      const details: string[] = [];

      // Link by FID
      const { data: unlinkedByFid } = await supabaseAdmin
        .from('users')
        .select('id, fid, display_name, community_profile_id')
        .not('fid', 'is', null)
        .is('community_profile_id', null)
        .eq('is_active', true);

      for (const user of unlinkedByFid || []) {
        const { data: profile } = await supabaseAdmin
          .from('community_profiles')
          .select('id, name')
          .eq('fid', user.fid)
          .maybeSingle();

        if (profile) {
          await supabaseAdmin.from('users').update({ community_profile_id: profile.id }).eq('id', user.id);
          details.push(`${user.display_name}: linked to profile "${profile.name}"`);
          linked++;
        }
      }

      // Link by name match (fuzzy)
      const { data: stillUnlinked } = await supabaseAdmin
        .from('users')
        .select('id, display_name, username, community_profile_id')
        .is('community_profile_id', null)
        .eq('is_active', true);

      for (const user of stillUnlinked || []) {
        const name = user.display_name || user.username;
        if (!name) continue;

        const { data: profile } = await supabaseAdmin
          .from('community_profiles')
          .select('id, name')
          .ilike('name', name)
          .maybeSingle();

        if (profile) {
          await supabaseAdmin.from('users').update({ community_profile_id: profile.id }).eq('id', user.id);
          details.push(`${name}: linked to profile "${profile.name}" (name match)`);
          linked++;
        }
      }

      results.push({ action: 'link-profiles', fixed: linked, errors: 0, details });
    }

    // ── 5. Sync member tiers ──────────────────────────────────────
    if (action === 'sync-tiers' || action === 'all') {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, fid, primary_wallet, member_tier')
        .eq('is_active', true);

      const { data: respectMembers } = await supabaseAdmin
        .from('respect_members')
        .select('fid, wallet_address, total_respect, onchain_og, onchain_zor');

      let upgraded = 0;
      let linked = 0;
      const details: string[] = [];

      for (const user of users || []) {
        const respect = (respectMembers || []).find(r =>
          (user.fid && r.fid === user.fid) ||
          (user.primary_wallet && r.wallet_address === user.primary_wallet.toLowerCase())
        );

        if (respect) {
          const hasRespect = (Number(respect.total_respect) > 0) ||
            (Number(respect.onchain_og) > 0) ||
            (Number(respect.onchain_zor) > 0);

          const updates: Record<string, unknown> = {};

          // Link respect_member_id if not set
          if (respect) {
            // Get the respect_member id
            const { data: rm } = await supabaseAdmin
              .from('respect_members')
              .select('id')
              .or(`fid.eq.${user.fid || 0},wallet_address.ilike.${(user.primary_wallet || '').toLowerCase()}`)
              .limit(1)
              .maybeSingle();
            if (rm) updates.respect_member_id = rm.id;
          }

          if (hasRespect && user.member_tier !== 'respect_holder') {
            updates.member_tier = 'respect_holder';
            upgraded++;
            details.push(`${user.fid || user.primary_wallet} → respect_holder`);
          }

          if (Object.keys(updates).length > 0) {
            await supabaseAdmin.from('users').update(updates).eq('id', user.id);
            if (updates.respect_member_id) linked++;
          }
        }
      }

      results.push({ action: 'sync-tiers', fixed: upgraded, errors: 0, details: [...details, `${linked} respect records linked`] });
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error('[member-fix] error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
