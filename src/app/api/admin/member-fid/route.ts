import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const updateSchema = z.object({
  updates: z.array(z.object({
    memberId: z.string().uuid(),
    fid: z.number().int().positive(),
  })).min(1).max(100),
});

/**
 * GET /api/admin/member-fid
 * Returns all respect_members missing a FID, grouped by priority.
 */
export async function GET() {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  try {
    const { data: members } = await supabaseAdmin
      .from('respect_members')
      .select('id, name, wallet_address, fid, total_respect, fractal_count, onchain_og')
      .is('fid', null)
      .order('total_respect', { ascending: false });

    const { count: totalWithFid } = await supabaseAdmin
      .from('respect_members')
      .select('id', { count: 'exact' })
      .not('fid', 'is', null);

    const { count: totalMembers } = await supabaseAdmin
      .from('respect_members')
      .select('id', { count: 'exact' });

    // Group by priority
    const active = (members || []).filter(m => Number(m.fractal_count) > 0);
    const onchainOnly = (members || []).filter(m => Number(m.fractal_count) === 0 && Number(m.onchain_og) > 0);
    const inactive = (members || []).filter(m => Number(m.fractal_count) === 0 && Number(m.onchain_og) === 0);

    return NextResponse.json({
      active,
      onchainOnly,
      inactive,
      stats: {
        totalMembers: totalMembers || 0,
        withFid: totalWithFid || 0,
        missingFid: (members || []).length,
      },
    });
  } catch (err) {
    logger.error('Member FID list error:', err);
    return NextResponse.json({ error: 'Failed to load members' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/member-fid
 * Batch update FIDs for members.
 */
export async function PATCH(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    let updated = 0;
    const errors: string[] = [];

    for (const { memberId, fid } of parsed.data.updates) {
      const { error } = await supabaseAdmin
        .from('respect_members')
        .update({ fid, updated_at: new Date().toISOString() })
        .eq('id', memberId);

      if (error) {
        errors.push(`${memberId}: ${error.message}`);
      } else {
        updated++;
      }
    }

    return NextResponse.json({ updated, errors });
  } catch (err) {
    logger.error('Member FID update error:', err);
    return NextResponse.json({ error: 'Failed to update FIDs' }, { status: 500 });
  }
}
