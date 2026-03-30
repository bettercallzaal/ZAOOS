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

    // Increment RSVP count
    const { data: room } = await supabaseAdmin
      .from('scheduled_rooms')
      .select('rsvp_count')
      .eq('id', id)
      .single();

    if (room) {
      await supabaseAdmin
        .from('scheduled_rooms')
        .update({ rsvp_count: (room.rsvp_count || 0) + 1 })
        .eq('id', id);
    }

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

    // Decrement count
    const { data: room } = await supabaseAdmin
      .from('scheduled_rooms')
      .select('rsvp_count')
      .eq('id', id)
      .single();

    if (room && (room.rsvp_count || 0) > 0) {
      await supabaseAdmin
        .from('scheduled_rooms')
        .update({ rsvp_count: room.rsvp_count - 1 })
        .eq('id', id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Cancel RSVP error:', error);
    return NextResponse.json({ error: 'Failed to cancel RSVP' }, { status: 500 });
  }
}
