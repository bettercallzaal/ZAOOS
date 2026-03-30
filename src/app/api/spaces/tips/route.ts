import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const TipSchema = z.object({
  roomId: z.string().uuid().optional(),
  amount: z.string().min(1),
  txHash: z.string().min(1),
  chain: z.string().default('base'),
  recipientFid: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = TipSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('tips')
      .insert({
        room_id: parsed.data.roomId || null,
        sender_fid: session.fid,
        recipient_fid: parsed.data.recipientFid || 0,
        amount: parsed.data.amount,
        currency: 'ETH',
        chain: parsed.data.chain,
        tx_hash: parsed.data.txHash,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to log tip:', error);
      return NextResponse.json({ error: 'Failed to log tip' }, { status: 500 });
    }

    return NextResponse.json({ tip: data });
  } catch (err) {
    console.error('Tip API error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const roomId = req.nextUrl.searchParams.get('roomId');
    if (!roomId) {
      return NextResponse.json({ error: 'roomId required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('tips')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to fetch tips:', error);
      return NextResponse.json({ error: 'Failed to fetch tips' }, { status: 500 });
    }

    return NextResponse.json({ tips: data || [] });
  } catch (err) {
    console.error('Tips GET error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
