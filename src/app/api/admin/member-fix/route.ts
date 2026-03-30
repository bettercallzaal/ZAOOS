import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const actionSchema = z.object({
  action: z.enum(['link-fids', 'enrich-profiles', 'import-socials', 'sync-tiers', 'link-profiles', 'backfill-dates', 'all']),
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

    // ── 2. Enrich profiles from Neynar (all fields) ────────────────
    if (action === 'enrich-profiles' || action === 'all') {
      const { data: allUsersWithFid } = await supabaseAdmin
        .from('users')
        .select('id, fid, display_name, pfp_url, bio, username, custody_address, verified_addresses, real_name, x_handle, solana_wallet')
        .not('fid', 'is', null)
        .eq('is_active', true);

      let enriched = 0;
      let errors = 0;
      const details: string[] = [];

      // Batch ALL users with FIDs in groups of 100
      for (let i = 0; i < (allUsersWithFid || []).length; i += 100) {
        const batch = (allUsersWithFid || []).slice(i, i + 100);
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

            // Basic fields (only fill if missing)
            if (!dbUser.display_name && fcUser.display_name) updates.display_name = fcUser.display_name;
            if (!dbUser.pfp_url && fcUser.pfp_url) updates.pfp_url = fcUser.pfp_url;
            if (!dbUser.bio && fcUser.profile?.bio?.text) updates.bio = fcUser.profile.bio.text;
            if (!dbUser.username && fcUser.username) updates.username = fcUser.username;
            if (!dbUser.custody_address && fcUser.custody_address) updates.custody_address = fcUser.custody_address;
            if ((!dbUser.verified_addresses || dbUser.verified_addresses.length === 0) && fcUser.verified_addresses?.eth_addresses?.length > 0) {
              updates.verified_addresses = fcUser.verified_addresses.eth_addresses;
            }

            // NEW: Farcaster banner as cover image (profile.banner.url)
            if (fcUser.profile?.banner?.url) {
              // Store in a field we can use as cover fallback
              updates.farcaster_banner_url = fcUser.profile.banner.url;
            }

            // NEW: Website URL
            if (fcUser.url) {
              updates.website_url = fcUser.url;
            }

            // NEW: Farcaster registration date
            if (fcUser.registered_at) {
              updates.farcaster_registered_at = fcUser.registered_at;
            }

            // NEW: Location from Farcaster profile
            if (fcUser.profile?.location?.address?.city) {
              const loc = fcUser.profile.location.address;
              updates.location = [loc.city, loc.state, loc.country].filter(Boolean).join(', ');
            }

            // NEW: Auto-detect real_name from display_name
            // Only set if not already set and display_name looks like a real name
            // (has a space, no special chars, not all caps)
            if (!dbUser.real_name && fcUser.display_name) {
              const name = fcUser.display_name.trim();
              const looksLikeRealName = /^[A-Z][a-z]+ [A-Z][a-z]+/.test(name) // "First Last"
                || /^[A-Z][a-z]+ [A-Z]\.?$/.test(name); // "First L."
              if (looksLikeRealName) {
                updates.real_name = name;
              }
            }

            // NEW: Solana wallet from Neynar verified addresses
            if (!dbUser.solana_wallet && fcUser.verified_addresses?.sol_addresses?.length > 0) {
              updates.solana_wallet = fcUser.verified_addresses.sol_addresses[0];
            }

            // NEW: Neynar score (canonical field, not experimental)
            if (fcUser.score !== undefined) {
              updates.neynar_score = fcUser.score;
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

    // ── 5. Backfill first_respect_at from earliest fractal session ──
    if (action === 'backfill-dates' || action === 'all') {
      let fixed = 0;
      const details: string[] = [];

      // Get all members missing first_respect_at
      const { data: membersNoDate } = await supabaseAdmin
        .from('respect_members')
        .select('id, name, wallet_address')
        .is('first_respect_at', null);

      for (const member of membersNoDate || []) {
        // Find their earliest fractal score
        const { data: earliest } = await supabaseAdmin
          .from('fractal_scores')
          .select('fractal_sessions(session_date)')
          .or(`member_name.eq.${member.name}${member.wallet_address ? `,wallet_address.ilike.${member.wallet_address}` : ''}`)
          .order('created_at', { ascending: true })
          .limit(1);

        if (earliest && earliest.length > 0) {
          const sess = Array.isArray(earliest[0].fractal_sessions)
            ? earliest[0].fractal_sessions[0]
            : earliest[0].fractal_sessions;
          const date = (sess as Record<string, unknown>)?.session_date;
          if (date) {
            await supabaseAdmin
              .from('respect_members')
              .update({ first_respect_at: date as string })
              .eq('id', member.id);
            details.push(`${member.name}: first respect ${date}`);
            fixed++;
          }
        }
      }

      results.push({ action: 'backfill-dates', fixed, errors: 0, details });
    }

    // ── 6. Sync member tiers ──────────────────────────────────────
    if (action === 'sync-tiers' || action === 'all') {
      // Fetch users and respect members in parallel (independent queries)
      const [usersResult, respectMembersResult] = await Promise.all([
        supabaseAdmin
          .from('users')
          .select('id, fid, primary_wallet, member_tier')
          .eq('is_active', true),
        supabaseAdmin
          .from('respect_members')
          .select('id, fid, wallet_address, total_respect, onchain_og, onchain_zor'),
      ]);

      const { data: users } = usersResult;
      const { data: respectMembers } = respectMembersResult;

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

          // Link respect_member_id using already-fetched data (no extra query needed)
          if (respect) {
            updates.respect_member_id = respect.id;
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
    logger.error('[member-fix] error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
