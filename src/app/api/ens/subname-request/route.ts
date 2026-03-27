import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { isValidSubname, sanitizeSubname } from '@/lib/ens/namestone';

const requestSchema = z.object({
  requestedName: z.string().min(1).max(63),
});

/**
 * POST /api/ens/subname-request — Member requests a name change
 *
 * Creates a pending request for admin approval.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const sanitized = sanitizeSubname(parsed.data.requestedName);
    if (!isValidSubname(sanitized)) {
      return NextResponse.json({ error: `Invalid name: "${parsed.data.requestedName}". Use lowercase letters, numbers, and hyphens only.` }, { status: 400 });
    }

    // Check for existing pending request
    const { data: existing } = await supabaseAdmin
      .from('subname_requests')
      .select('id')
      .eq('fid', session.fid)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'You already have a pending name change request' }, { status: 409 });
    }

    // Get current subname
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('zao_subname')
      .eq('fid', session.fid)
      .single();

    // Create request
    const { error: insertError } = await supabaseAdmin
      .from('subname_requests')
      .insert({
        fid: session.fid,
        current_name: user?.zao_subname || null,
        requested_name: sanitized,
        status: 'pending',
      });

    if (insertError) {
      console.error('[ens/subname-request] insert error:', insertError);
      return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Request submitted for ${sanitized}.thezao.eth. An admin will review it.`,
    });
  } catch (err) {
    console.error('[ens/subname-request] error:', err);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}
