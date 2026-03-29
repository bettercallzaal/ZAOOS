import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runWeeklyReflection, TASTE_REFLECT_PROMPT } from '@/lib/memory-recall';

const CRON_SECRET = process.env.CRON_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all active ZAO members
    const { data: members, error: membersError } = await supabase
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
        const { error: insertError } = await supabase
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
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ status: 'ok', schedule: 'Sunday 18:00 UTC' });
}
