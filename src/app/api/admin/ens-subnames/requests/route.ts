import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import {
  updateSubname,
  buildMemberTextRecords,
  isValidSubname,
  sanitizeSubname,
} from '@/lib/ens/namestone';

const reviewSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(['approve', 'deny']),
});

/**
 * GET /api/admin/ens-subnames/requests — List pending name change requests
 */
export async function GET() {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { data: requests } = await supabaseAdmin
      .from('subname_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({ requests: requests || [] });
  } catch (err) {
    console.error('[admin/ens-subnames/requests] list error:', err);
    return NextResponse.json({ error: 'Failed to list requests' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/ens-subnames/requests — Approve or deny a request
 */
export async function PATCH(req: NextRequest) {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { requestId, action } = parsed.data;

    // Get the request
    const { data: request } = await supabaseAdmin
      .from('subname_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single();

    if (!request) {
      return NextResponse.json({ error: 'Request not found or already reviewed' }, { status: 404 });
    }

    if (action === 'deny') {
      await supabaseAdmin
        .from('subname_requests')
        .update({ status: 'denied', reviewed_at: new Date().toISOString(), reviewed_by: session.fid })
        .eq('id', requestId);

      return NextResponse.json({ success: true, message: 'Request denied' });
    }

    // Approve: validate + update NameStone + update DB
    const newName = sanitizeSubname(request.requested_name);
    if (!isValidSubname(newName)) {
      return NextResponse.json({ error: `Invalid name: "${request.requested_name}"` }, { status: 400 });
    }

    // Get member data for text records
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('primary_wallet, username, pfp_url, bio')
      .eq('fid', request.fid)
      .single();

    if (!user || !user.primary_wallet) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const textRecords = buildMemberTextRecords({ username: user.username, pfpUrl: user.pfp_url, bio: user.bio });

    // Update in NameStone (delete old + create new)
    const oldName = request.current_name?.replace('.thezao.eth', '') || '';
    const result = oldName
      ? await updateSubname(oldName, newName, user.primary_wallet, textRecords)
      : await (await import('@/lib/ens/namestone')).createSubname(newName, user.primary_wallet, textRecords);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Update DB
    await Promise.all([
      supabaseAdmin
        .from('users')
        .update({ zao_subname: result.fullName })
        .eq('fid', request.fid),
      supabaseAdmin
        .from('subname_requests')
        .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: session.fid })
        .eq('id', requestId),
    ]);

    return NextResponse.json({ success: true, subname: result.fullName });
  } catch (err) {
    console.error('[admin/ens-subnames/requests] review error:', err);
    return NextResponse.json({ error: 'Failed to review request' }, { status: 500 });
  }
}
