import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [
      allowlisted,
      walletConnected,
      fidLinked,
      inRespectDb,
      attendedFractal,
      earnedRespect,
    ] = await Promise.allSettled([
      supabaseAdmin
        .from('allowlist')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .not('fid', 'is', null)
        .eq('is_active', true),
      supabaseAdmin
        .from('respect_members')
        .select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('respect_members')
        .select('*', { count: 'exact', head: true })
        .gt('fractal_count', 0),
      supabaseAdmin
        .from('respect_members')
        .select('*', { count: 'exact', head: true })
        .gt('total_respect', 0),
    ]);

    function extractCount(
      result: PromiseSettledResult<{ count: number | null; error: unknown }>
    ): number {
      if (result.status === 'fulfilled' && !result.value.error) {
        return result.value.count ?? 0;
      }
      return 0;
    }

    const stages = [
      {
        stage: 'Allowlisted',
        count: extractCount(allowlisted),
        description: 'Invited to join ZAO OS',
      },
      {
        stage: 'Wallet Connected',
        count: extractCount(walletConnected),
        description: 'Connected wallet and signed in',
      },
      {
        stage: 'FID Linked',
        count: extractCount(fidLinked),
        description: 'Linked Farcaster account',
      },
      {
        stage: 'In Respect DB',
        count: extractCount(inRespectDb),
        description: 'Added to Respect system',
      },
      {
        stage: 'Attended Fractal',
        count: extractCount(attendedFractal),
        description: 'Participated in at least one fractal',
      },
      {
        stage: 'Earned Respect',
        count: extractCount(earnedRespect),
        description: 'Earned Respect from the community',
      },
    ];

    return NextResponse.json({ stages });
  } catch (error) {
    logger.error('[onboarding-funnel] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load onboarding funnel data' },
      { status: 500 }
    );
  }
}
