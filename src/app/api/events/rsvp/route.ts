import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const rsvpSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  eventSlug: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();

    const body = await req.json();
    const parsed = rsvpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, eventSlug } = parsed.data;
    const supabase = getSupabaseAdmin();

    // Check for duplicate RSVP
    const { data: existing } = await supabase
      .from('event_rsvps')
      .select('id')
      .eq('email', email)
      .eq('event_slug', eventSlug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'You have already RSVPed for this event' },
        { status: 409 }
      );
    }

    const { error: insertError } = await supabase.from('event_rsvps').insert({
      name,
      email,
      event_slug: eventSlug,
      fid: session?.fid || null,
    });

    if (insertError) {
      logger.error('[events/rsvp] Insert failed:', insertError);
      return NextResponse.json({ error: 'Failed to save RSVP' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[events/rsvp] Unexpected error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
