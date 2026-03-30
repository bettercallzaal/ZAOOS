import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/member-health — Data quality report for member CRM
 * Admin only. Shows: missing fields, unlinked records, tier mismatches.
 */
export async function GET() {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Admin required' }, { status: 403 });
  }

  try {
    // Fetch all users
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, fid, username, display_name, primary_wallet, member_tier, respect_member_id, community_profile_id, discord_id, zid, real_name, ens_name, bluesky_handle, x_handle, preferred_wallet, last_login_at, last_active_at, role, is_active')
      .eq('is_active', true);

    // Fetch all respect_members
    const { data: respectMembers } = await supabaseAdmin
      .from('respect_members')
      .select('id, name, wallet_address, fid, total_respect, onchain_og, onchain_zor, fractal_count');

    // Fetch all allowlist entries
    const { data: allowlist } = await supabaseAdmin
      .from('allowlist')
      .select('id, fid, wallet_address, real_name, is_active')
      .eq('is_active', true);

    const allUsers = users || [];
    const allRespect = respectMembers || [];
    const allAllowlist = allowlist || [];

    // Build issue lists
    const issues: { severity: 'high' | 'medium' | 'low'; member: string; issue: string; fix?: string }[] = [];

    // 1. Users with no FID
    for (const u of allUsers) {
      if (!u.fid) {
        issues.push({ severity: 'high', member: u.display_name || u.primary_wallet || u.id, issue: 'No Farcaster FID linked', fix: 'Link Farcaster account in admin panel' });
      }
    }

    // 2. Users with no respect_member_id link
    for (const u of allUsers) {
      if (!u.respect_member_id) {
        // Check if there's a match we can make
        const match = allRespect.find(r =>
          (u.fid && r.fid === u.fid) ||
          (u.primary_wallet && r.wallet_address === u.primary_wallet.toLowerCase())
        );
        if (match) {
          issues.push({ severity: 'medium', member: u.display_name || u.username || '?', issue: 'Respect data exists but not linked', fix: `Link respect_member_id = ${match.id}` });
        }
      }
    }

    // 3. Respect members with no user account
    for (const r of allRespect) {
      const hasUser = allUsers.some(u =>
        (u.fid && r.fid === u.fid) ||
        (u.primary_wallet && r.wallet_address === u.primary_wallet.toLowerCase())
      );
      if (!hasUser && (r.total_respect || 0) > 0) {
        issues.push({ severity: 'medium', member: r.name, issue: `Has ${r.total_respect} respect but no ZAO OS account`, fix: 'Add to allowlist or invite to sign up' });
      }
    }

    // 4. Tier mismatches — has respect but tier is 'community'
    for (const u of allUsers) {
      if (u.member_tier === 'community') {
        const respect = allRespect.find(r =>
          (u.fid && r.fid === u.fid) ||
          (u.primary_wallet && r.wallet_address === u.primary_wallet.toLowerCase())
        );
        if (respect && ((respect.onchain_og || 0) > 0 || (respect.onchain_zor || 0) > 0 || (respect.total_respect || 0) > 0)) {
          issues.push({ severity: 'high', member: u.display_name || u.username || '?', issue: `Has ${respect.total_respect} respect but tier is "community"`, fix: 'Update to respect_holder' });
        }
      }
    }

    // 5. Missing profile fields
    for (const u of allUsers) {
      const missing: string[] = [];
      if (!u.display_name) missing.push('display_name');
      if (!u.real_name) missing.push('real_name');
      if (!u.zid) missing.push('zid');
      if (!u.discord_id) missing.push('discord_id');
      if (missing.length >= 3) {
        issues.push({ severity: 'low', member: u.display_name || u.username || u.primary_wallet || '?', issue: `Missing: ${missing.join(', ')}` });
      }
    }

    // 6. Allowlist entries with no user account
    for (const a of allAllowlist) {
      const hasUser = allUsers.some(u =>
        (a.fid && u.fid === a.fid) ||
        (a.wallet_address && u.primary_wallet?.toLowerCase() === a.wallet_address.toLowerCase())
      );
      if (!hasUser) {
        issues.push({ severity: 'low', member: a.real_name || a.wallet_address || '?', issue: 'On allowlist but never logged in' });
      }
    }

    // Sort: high first, then medium, then low
    const severityOrder = { high: 0, medium: 1, low: 2 };
    issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Summary stats
    const stats = {
      totalUsers: allUsers.length,
      respectHolders: allUsers.filter(u => u.member_tier === 'respect_holder').length,
      communityMembers: allUsers.filter(u => u.member_tier === 'community').length,
      totalRespectMembers: allRespect.length,
      unlinkedRespect: allRespect.filter(r => !allUsers.some(u => (u.fid && r.fid === u.fid) || (u.primary_wallet && r.wallet_address === u.primary_wallet.toLowerCase()))).length,
      allowlistNotLoggedIn: allAllowlist.filter(a => !allUsers.some(u => (a.fid && u.fid === a.fid) || (a.wallet_address && u.primary_wallet?.toLowerCase() === a.wallet_address.toLowerCase()))).length,
      missingZid: allUsers.filter(u => !u.zid).length,
      missingDiscord: allUsers.filter(u => !u.discord_id).length,
      missingRealName: allUsers.filter(u => !u.real_name).length,
      neverActive: allUsers.filter(u => !u.last_active_at).length,
      issueCount: { high: issues.filter(i => i.severity === 'high').length, medium: issues.filter(i => i.severity === 'medium').length, low: issues.filter(i => i.severity === 'low').length },
    };

    return NextResponse.json({ stats, issues });
  } catch (err) {
    logger.error('[member-health] error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
