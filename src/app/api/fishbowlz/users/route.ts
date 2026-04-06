import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get('fid');
  const wallet = searchParams.get('wallet');
  const privyId = searchParams.get('privyId');

  if (!fid && !wallet && !privyId) {
    return NextResponse.json({ error: 'fid, wallet, or privyId required' }, { status: 400 });
  }

  let query = supabaseAdmin.from('fishbowl_users').select('*');

  if (fid) query = query.eq('fid', parseInt(fid));
  else if (wallet) query = query.eq('wallet_address', wallet);
  else if (privyId) query = query.eq('privy_id', privyId);

  const { data: user, error } = await query.single();

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}
