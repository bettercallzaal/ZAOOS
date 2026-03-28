import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET() {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await supabaseAdmin
      .from('user_settings')
      .select('listenbrainz_token')
      .eq('fid', session.fid)
      .single();

    return NextResponse.json({ connected: !!data?.listenbrainz_token });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
