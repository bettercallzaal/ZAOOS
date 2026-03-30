import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { runWeeklyReflection } from '@/lib/memory-recall';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Require CRON_SECRET to be configured
    if (!CRON_SECRET) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      );
    }

    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active ZAO members
    const { data: members, error: membersError } = await supabaseAdmin
      .from('members')
      .select('fid, username')
      .eq('status', 'active');

    if (membersError) {
      console.error('Failed to fetch members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const member of members ?? []) {
      try {
        const reflection = await runWeeklyReflection(String(member.fid));

        // Store in Supabase taste_profiles table
        const { error: insertError } = await supabaseAdmin
          .from('taste_profiles')
          .insert({
            user_fid: member.fid,
            reflection_text: reflection,
            reflected_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error(`Failed to store reflection for ${member.fid}:`, insertError);
          results.errors.push(`User ${member.fid}: failed to store reflection`);
          results.failed++;
        } else {
          results.processed++;
        }
      } catch (err) {
        console.error(`Reflection failed for ${member.fid}:`, err);
        results.errors.push(`User ${member.fid}: ${err instanceof Error ? err.message : 'unknown error'}`);
        results.failed++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Weekly reflection cron failed:', error);
    return NextResponse.json(
      { error: 'Weekly reflection cron failed' },
      { status: 500 }
    );
  }
}

// Also support GET for simple cron health checks
export async function GET(request: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ status: 'ok', schedule: 'Sunday 18:00 UTC' });
}
