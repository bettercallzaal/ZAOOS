import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('hidden_messages')
      .select('*')
      .order('hidden_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    return NextResponse.json({ messages: data });
  } catch (err) {
    console.error('Hidden messages fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch hidden messages' }, { status: 500 });
  }
}
