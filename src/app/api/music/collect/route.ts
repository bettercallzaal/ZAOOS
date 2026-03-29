import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const CollectSchema = z.object({
  assetTxId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CollectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { assetTxId } = parsed.data;

    const { data: asset } = await supabaseAdmin
      .from('arweave_assets')
      .select('id, collected_count')
      .eq('arweave_tx_id', assetTxId)
      .single();

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const { data: existing } = await supabaseAdmin
      .from('arweave_collections')
      .select('id')
      .eq('asset_id', asset.id)
      .eq('collector_fid', session.fid)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already collected' }, { status: 409 });
    }

    await supabaseAdmin
      .from('arweave_collections')
      .insert({
        asset_id: asset.id,
        collector_fid: session.fid,
        collector_address: '',
      });

    await supabaseAdmin
      .from('arweave_assets')
      .update({ collected_count: (asset.collected_count || 0) + 1 })
      .eq('id', asset.id);

    return NextResponse.json({
      success: true,
      collectedCount: (asset.collected_count || 0) + 1,
    });
  } catch (error) {
    console.error('[music/collect] Error:', error);
    return NextResponse.json({ error: 'Collection failed' }, { status: 500 });
  }
}
