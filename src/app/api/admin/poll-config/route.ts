import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { communityConfig } from '@/../community.config';

const POLL_CONFIG_ID = 'weekly-priority';

const updateSchema = z.object({
  choices: z.array(z.string().max(200)).min(2).max(20),
  pollTitleTemplate: z.string().max(500).optional(),
  pollBodyTemplate: z.string().max(2000).optional(),
  votingDurationDays: z.number().int().min(1).max(30).optional(),
});

/** GET — public read of poll config */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('poll_config')
      .select('*')
      .eq('id', POLL_CONFIG_ID)
      .single();

    if (error || !data) {
      // Return defaults from community.config.ts
      return NextResponse.json({
        id: POLL_CONFIG_ID,
        choices: [...communityConfig.snapshot.weeklyPollChoices],
        pollTitleTemplate: 'ZAO Weekly Priority Vote — Week of {date}',
        pollBodyTemplate: null,
        votingDurationDays: 7,
        updatedAt: null,
        updatedByFid: null,
      });
    }

    return NextResponse.json({
      id: data.id,
      choices: data.choices,
      pollTitleTemplate: data.poll_title_template,
      pollBodyTemplate: data.poll_body_template,
      votingDurationDays: data.voting_duration_days,
      updatedAt: data.updated_at,
      updatedByFid: data.updated_by_fid,
    });
  } catch (err) {
    console.error('[poll-config] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch poll config' }, { status: 500 });
  }
}

/** PUT — admin-only update of poll config */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { choices, pollTitleTemplate, pollBodyTemplate, votingDurationDays } = parsed.data;

    const { data, error } = await supabaseAdmin
      .from('poll_config')
      .upsert(
        {
          id: POLL_CONFIG_ID,
          choices: JSON.stringify(choices),
          poll_title_template: pollTitleTemplate ?? 'ZAO Weekly Priority Vote — Week of {date}',
          poll_body_template: pollBodyTemplate ?? null,
          voting_duration_days: votingDurationDays ?? 7,
          updated_at: new Date().toISOString(),
          updated_by_fid: session.fid,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) {
      console.error('[poll-config] Upsert error:', error);
      return NextResponse.json({ error: 'Failed to save poll config' }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      choices: data.choices,
      pollTitleTemplate: data.poll_title_template,
      pollBodyTemplate: data.poll_body_template,
      votingDurationDays: data.voting_duration_days,
      updatedAt: data.updated_at,
      updatedByFid: data.updated_by_fid,
    });
  } catch (err) {
    console.error('[poll-config] PUT error:', err);
    return NextResponse.json({ error: 'Failed to update poll config' }, { status: 500 });
  }
}
