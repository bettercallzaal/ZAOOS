import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const CreateScheduledSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(''),
  scheduledAt: z.string().refine((v) => new Date(v) > new Date(), {
    message: 'Scheduled time must be in the future',
  }),
  category: z.enum(['general', 'music', 'podcast', 'ama', 'chill', 'dj-set']).default('general'),
  theme: z.string().max(50).optional().default('default'),
});

export async function GET() {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('scheduled_rooms')
      .select('*')
      .in('state', ['scheduled', 'live'])
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ rooms: data ?? [] });
  } catch (error) {
    logger.error('Fetch scheduled rooms error:', error);
    return NextResponse.json({ error: 'Failed to fetch scheduled rooms' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateScheduledSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('scheduled_rooms')
      .insert({
        title: parsed.data.title,
        description: parsed.data.description || null,
        host_fid: session.fid,
        host_name: session.displayName,
        host_pfp: session.pfpUrl || null,
        scheduled_at: parsed.data.scheduledAt,
        category: parsed.data.category,
        theme: parsed.data.theme,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ room: data });
  } catch (error) {
    logger.error('Create scheduled room error:', error);
    return NextResponse.json({ error: 'Failed to schedule room' }, { status: 500 });
  }
}
