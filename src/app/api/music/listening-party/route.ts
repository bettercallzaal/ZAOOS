import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  trackUrls: z.array(z.string().url().max(500)).min(1).max(50),
  scheduledAt: z.string().datetime().optional(),
});

/**
 * GET /api/music/listening-party — list upcoming + active listening parties
 */
export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: parties, error } = await supabaseAdmin
      .from('listening_parties')
      .select('*')
      .in('state', ['scheduled', 'live'])
      .order('scheduled_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ parties: parties || [] });
  } catch (err) {
    console.error('[listening-party] GET failed:', err);
    return NextResponse.json(
      { error: 'Failed to load listening parties' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/music/listening-party — create a new listening party
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { title, description, trackUrls, scheduledAt } = parsed.data;

    const { data: party, error } = await supabaseAdmin
      .from('listening_parties')
      .insert({
        title,
        description: description || null,
        host_fid: session.fid,
        host_name: session.displayName || session.username || null,
        track_urls: trackUrls,
        scheduled_at: scheduledAt || new Date().toISOString(),
        state: scheduledAt ? 'scheduled' : 'live',
        started_at: scheduledAt ? null : new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ party }, { status: 201 });
  } catch (err) {
    console.error('[listening-party] POST failed:', err);
    return NextResponse.json(
      { error: 'Failed to create listening party' },
      { status: 500 },
    );
  }
}
