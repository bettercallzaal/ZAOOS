import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('community_profiles')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Enrich with WaveWarZ stats if user has linked Solana wallet
    let wavewarzStats = null;
    if (profile.fid) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('solana_wallet')
        .eq('fid', profile.fid)
        .maybeSingle();

      if (userData?.solana_wallet) {
        const { data: warz } = await supabaseAdmin
          .from('wavewarz_artists')
          .select('wins, losses, total_volume_sol')
          .eq('solana_wallet', userData.solana_wallet)
          .maybeSingle();
        if (warz) wavewarzStats = warz;
      }
    }

    return NextResponse.json({ profile, wavewarzStats });
  } catch (err) {
    console.error('[directory/slug] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
