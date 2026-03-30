import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Insert RSVP
    const { error: rsvpError } = await supabaseAdmin
      .from('room_rsvps')
      .insert({ scheduled_room_id: id, fid: session.fid });

    if (rsvpError) {
      if (rsvpError.code === '23505') {
        return NextResponse.json({ error: 'Already RSVPed' }, { status: 409 });
      }
      throw rsvpError;
    }

    // Recount RSVPs atomically from the source-of-truth table
    const { count } = await supabaseAdmin
      .from('room_rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('scheduled_room_id', id);

    await supabaseAdmin
      .from('scheduled_rooms')
      .update({ rsvp_count: count ?? 0 })
      .eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('RSVP error:', error);
    return NextResponse.json({ error: 'Failed to RSVP' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('room_rsvps')
      .delete()
      .eq('scheduled_room_id', id)
      .eq('fid', session.fid);

    if (error) throw error;

    // Recount RSVPs atomically from the source-of-truth table
    const { count } = await supabaseAdmin
      .from('room_rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('scheduled_room_id', id);

    await supabaseAdmin
      .from('scheduled_rooms')
      .update({ rsvp_count: count ?? 0 })
      .eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Cancel RSVP error:', error);
    return NextResponse.json({ error: 'Failed to cancel RSVP' }, { status: 500 });
  }
}
