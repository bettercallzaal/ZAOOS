import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * GET — Return referral stats for current user
 * Response: { totalInvited, joined, activeD30, pending, expired, codes }
 */
export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all referrals where this user is the referrer
    const { data: referrals, error: refsError } = await supabaseAdmin
      .from('referrals')
      .select('status')
      .eq('referrer_fid', session.fid);

    if (refsError) {
      console.error('Fetch referral stats error:', refsError);
      return NextResponse.json({ error: 'Failed to fetch referral stats' }, { status: 500 });
    }

    const allRefs = referrals || [];
    const stats = {
      totalInvited: allRefs.length,
      pending: allRefs.filter((r) => r.status === 'pending').length,
      joined: allRefs.filter((r) => r.status === 'joined').length,
      activeD30: allRefs.filter((r) => r.status === 'active_d30').length,
      expired: allRefs.filter((r) => r.status === 'expired').length,
    };

    // Also fetch code count
    const { count: activeCodesCount } = await supabaseAdmin
      .from('referral_codes')
      .select('id', { count: 'exact', head: true })
      .eq('creator_fid', session.fid)
      .eq('is_active', true);

    const { count: totalCodesCount } = await supabaseAdmin
      .from('referral_codes')
      .select('id', { count: 'exact', head: true })
      .eq('creator_fid', session.fid);

    return NextResponse.json({
      ...stats,
      activeCodes: activeCodesCount ?? 0,
      totalCodes: totalCodesCount ?? 0,
    });
  } catch (err) {
    console.error('Referral stats error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
