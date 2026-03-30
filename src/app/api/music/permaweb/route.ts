import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const artist = req.nextUrl.searchParams.get('artist');
    const fid = req.nextUrl.searchParams.get('fid');
    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || '50'), 100);
    const offset = Number(req.nextUrl.searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('arweave_assets')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (artist) query = query.ilike('artist', `%${artist}%`);
    if (fid) query = query.eq('fid', Number(fid));

    const { data: assets, error } = await query;

    if (error) {
      logger.error('[music/permaweb] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    const assetIds = (assets || []).map(a => a.id);
    let collectedIds = new Set<string>();
    if (assetIds.length > 0) {
      const { data: collections } = await supabaseAdmin
        .from('arweave_collections')
        .select('asset_id')
        .eq('collector_fid', session.fid)
        .in('asset_id', assetIds);
      collectedIds = new Set((collections || []).map(c => c.asset_id));
    }

    const enriched = (assets || []).map(a => ({
      ...a,
      coverUrl: a.cover_tx_id ? `https://arweave.net/${a.cover_tx_id}` : null,
      audioUrl: `https://arweave.net/${a.arweave_tx_id}`,
      bazarUrl: `https://bazar.arweave.net/#/asset/${a.arweave_tx_id}`,
      collected: collectedIds.has(a.id),
    }));

    return NextResponse.json({ assets: enriched, total: enriched.length }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch (error) {
    logger.error('[music/permaweb] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
