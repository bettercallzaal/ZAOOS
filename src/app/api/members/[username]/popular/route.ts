import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getPopularCasts } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('fid')
      .ilike('username', decodeURIComponent(username).toLowerCase())
      .eq('is_active', true)
      .maybeSingle();

    if (!user?.fid) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await getPopularCasts(user.fid);
    return NextResponse.json(data);
  } catch (err) {
    logger.error('[members/popular] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch popular casts' }, { status: 500 });
  }
}
