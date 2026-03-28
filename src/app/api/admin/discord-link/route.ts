import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logAuditEvent, getClientIp } from '@/lib/db/audit-log';

async function requireAdmin() {
  const session = await getSessionData();
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (!session.isAdmin) return { error: 'Admin access required', status: 403 };
  return { session };
}

/**
 * GET /api/admin/discord-link — All users with discord link status + discord data counts
 */
export async function GET(_req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    // Fetch all active users
    const { data: users, error: usersErr } = await supabaseAdmin
      .from('users')
      .select('id, primary_wallet, fid, username, display_name, pfp_url, discord_id, role, is_active, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (usersErr) {
      console.error('[discord-link] Users query error:', usersErr);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Fetch all discord intros (for counts)
    const { data: intros, error: introsErr } = await supabaseAdmin
      .from('discord_intros')
      .select('discord_id');

    if (introsErr) {
      console.error('[discord-link] Intros query error:', introsErr);
    }

    // Fetch proposal counts per discord_id
    const { data: proposals, error: proposalsErr } = await supabaseAdmin
      .from('discord_proposals')
      .select('author_id');

    if (proposalsErr) {
      console.error('[discord-link] Proposals query error:', proposalsErr);
    }

    // Fetch vote counts per discord_id
    const { data: votes, error: votesErr } = await supabaseAdmin
      .from('discord_proposal_votes')
      .select('voter_id');

    if (votesErr) {
      console.error('[discord-link] Votes query error:', votesErr);
    }

    // Build lookup maps
    const introSet = new Set((intros || []).map(i => i.discord_id));

    const proposalCounts: Record<string, number> = {};
    for (const p of proposals || []) {
      proposalCounts[p.author_id] = (proposalCounts[p.author_id] || 0) + 1;
    }

    const voteCounts: Record<string, number> = {};
    for (const v of votes || []) {
      voteCounts[v.voter_id] = (voteCounts[v.voter_id] || 0) + 1;
    }

    // Enrich users with discord data
    const enriched = (users || []).map(u => ({
      ...u,
      has_intro: u.discord_id ? introSet.has(u.discord_id) : false,
      proposal_count: u.discord_id ? (proposalCounts[u.discord_id] || 0) : 0,
      vote_count: u.discord_id ? (voteCounts[u.discord_id] || 0) : 0,
    }));

    // Summary stats
    const linked = enriched.filter(u => u.discord_id).length;
    const unlinked = enriched.filter(u => !u.discord_id).length;
    const introCount = introSet.size;

    return NextResponse.json({
      users: enriched,
      stats: {
        linked,
        unlinked,
        introCount,
      },
    });
  } catch (err) {
    console.error('[discord-link] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch discord link data' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/discord-link — Link or unlink a user's discord_id
 * Body: { userId: string, discordId: string | null }
 */
const patchSchema = z.object({
  userId: z.string().uuid(),
  discordId: z.string().min(1).nullable(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { userId, discordId } = parsed.data;

    // If linking, check that discord_id isn't already on another user
    if (discordId) {
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id, display_name')
        .eq('discord_id', discordId)
        .neq('id', userId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({
          error: `Discord ID already linked to ${existing.display_name || existing.id}`,
        }, { status: 409 });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ discord_id: discordId })
      .eq('id', userId)
      .select('id, discord_id, display_name, username')
      .single();

    if (error) {
      console.error('[discord-link] PATCH error:', error);
      return NextResponse.json({ error: 'Failed to update discord link' }, { status: 500 });
    }

    logAuditEvent({
      actorFid: auth.session.fid!,
      action: discordId ? 'discord.link' : 'discord.unlink',
      targetType: 'user',
      targetId: userId,
      details: { discord_id: discordId },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({
      ok: true,
      action: discordId ? 'linked' : 'unlinked',
      user: data,
    });
  } catch (err) {
    console.error('[discord-link] PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update discord link' }, { status: 500 });
  }
}

/**
 * POST /api/admin/discord-link — Bulk auto-link by wallet matching
 * Body: { preview?: boolean }
 *   preview=true: return matches without executing
 *   preview=false (or omitted): execute the links
 *
 * Fetches bot wallet data from the discord_wallets concept:
 *   The bot pushes wallets via POST /api/discord/sync with type=wallets
 *   Here we query users who have wallets that match discord bot wallets.
 *   We also check discord_intros for discord_id -> discord_username mapping.
 */
const postSchema = z.object({
  preview: z.boolean().optional().default(true),
  walletMap: z.record(z.string(), z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { preview } = parsed.data;
    let walletMap = parsed.data.walletMap;

    // If no wallet map provided, try to build one from discord_intros + known data
    // The wallet map is discord_id -> wallet_address
    if (!walletMap || Object.keys(walletMap).length === 0) {
      // Try to get wallets from discord_intros (which have discord_id)
      // and cross-reference with any known wallet sources
      // For now, require the client to provide the wallet map from the bot data
      return NextResponse.json({
        error: 'walletMap is required. Provide a mapping of discord_id -> wallet_address from the bot.',
      }, { status: 400 });
    }

    // Normalize all wallet addresses to lowercase
    const normalizedMap: Record<string, string> = {};
    for (const [discordId, wallet] of Object.entries(walletMap)) {
      normalizedMap[discordId] = wallet.toLowerCase();
    }

    // Build reverse map: wallet -> discord_id
    const walletToDiscord: Record<string, string> = {};
    for (const [discordId, wallet] of Object.entries(normalizedMap)) {
      walletToDiscord[wallet] = discordId;
    }

    // Fetch all active users
    const { data: users, error: usersErr } = await supabaseAdmin
      .from('users')
      .select('id, primary_wallet, discord_id, display_name, username, verified_addresses, custody_address')
      .eq('is_active', true);

    if (usersErr) {
      console.error('[discord-link] POST users error:', usersErr);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const matches: { userId: string; displayName: string; wallet: string; discordId: string }[] = [];
    const alreadyLinked: { userId: string; displayName: string; discordId: string }[] = [];
    const noMatch: string[] = [];

    for (const user of users || []) {
      // Collect all wallet addresses for this user
      const wallets: string[] = [];
      if (user.primary_wallet) wallets.push(user.primary_wallet.toLowerCase());
      if (user.custody_address) wallets.push(user.custody_address.toLowerCase());
      if (user.verified_addresses) {
        for (const addr of user.verified_addresses) {
          wallets.push(addr.toLowerCase());
        }
      }

      // Check if already linked
      if (user.discord_id) {
        alreadyLinked.push({
          userId: user.id,
          displayName: user.display_name || user.username || user.primary_wallet,
          discordId: user.discord_id,
        });
        continue;
      }

      // Try to match any wallet
      let matched = false;
      for (const w of wallets) {
        if (walletToDiscord[w]) {
          matches.push({
            userId: user.id,
            displayName: user.display_name || user.username || user.primary_wallet,
            wallet: w,
            discordId: walletToDiscord[w],
          });
          matched = true;
          break; // one match per user
        }
      }

      if (!matched) {
        noMatch.push(user.display_name || user.username || user.primary_wallet || user.id);
      }
    }

    // Preview mode — just return the matches
    if (preview) {
      return NextResponse.json({
        preview: true,
        matches,
        alreadyLinked: alreadyLinked.length,
        noMatch: noMatch.length,
        total: (users || []).length,
      });
    }

    // Execute mode — link all matches
    let linked = 0;
    const errors: string[] = [];

    for (const match of matches) {
      // Ensure discord_id isn't already used by another user
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('discord_id', match.discordId)
        .neq('id', match.userId)
        .maybeSingle();

      if (existing) {
        errors.push(`${match.displayName}: Discord ID ${match.discordId} already on another user`);
        continue;
      }

      const { error } = await supabaseAdmin
        .from('users')
        .update({ discord_id: match.discordId })
        .eq('id', match.userId);

      if (error) {
        errors.push(`${match.displayName}: ${error.message}`);
      } else {
        linked++;
      }
    }

    logAuditEvent({
      actorFid: auth.session.fid!,
      action: 'discord.bulk_link',
      targetType: 'system',
      details: { linked, alreadyLinked: alreadyLinked.length, noMatch: noMatch.length, errors: errors.length },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({
      preview: false,
      linked,
      alreadyLinked: alreadyLinked.length,
      noMatch: noMatch.length,
      errors,
      total: (users || []).length,
    });
  } catch (err) {
    console.error('[discord-link] POST error:', err);
    return NextResponse.json({ error: 'Bulk link failed' }, { status: 500 });
  }
}
