import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

async function requireAdmin() {
  const session = await getSessionData();
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (!session.isAdmin) return { error: 'Admin access required', status: 403 };
  return { session };
}

const ScoreSchema = z.object({
  member_name: z.string().min(1),
  wallet_address: z.string().optional().nullable(),
  rank: z.number().int().min(1).max(6),
  score: z.number().positive(),
});

const FractalSessionSchema = z.object({
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  name: z.string().min(1),
  host_name: z.string().optional().nullable(),
  host_wallet: z.string().optional().nullable(),
  scoring_era: z.enum(['1x', '2x']).default('2x'),
  notes: z.string().optional().nullable(),
  scores: z.array(ScoreSchema).min(1).max(6),
});

/**
 * POST /api/respect/fractal — Admin only
 * Record a fractal session with scores.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = FractalSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { session_date, name, host_name, host_wallet, scoring_era, notes, scores } = parsed.data;

    // 1. Insert the fractal session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('fractal_sessions')
      .insert({
        session_date,
        name,
        host_name: host_name || null,
        host_wallet: host_wallet || null,
        scoring_era,
        participant_count: scores.length,
        notes: notes || null,
      })
      .select('id')
      .single();

    if (sessionError) {
      console.error('Failed to insert fractal session:', sessionError);
      return NextResponse.json({ error: 'Failed to create fractal session' }, { status: 500 });
    }

    const sessionId = session.id;

    // 2. Insert each score into fractal_scores
    const scoreRows = scores.map((s) => ({
      session_id: sessionId,
      member_name: s.member_name,
      wallet_address: s.wallet_address || null,
      rank: s.rank,
      score: s.score,
    }));

    const { error: scoresError } = await supabaseAdmin
      .from('fractal_scores')
      .insert(scoreRows);

    if (scoresError) {
      console.error('Failed to insert fractal scores:', scoresError);
      return NextResponse.json({ error: 'Failed to insert scores' }, { status: 500 });
    }

    // 3. Update respect_members totals for each participant
    const updateResults = await Promise.allSettled(
      scores.map(async (s) => {
        // Find or create the member
        let memberId: string | null = null;

        // Try to find by wallet first, then by name
        if (s.wallet_address) {
          const { data: existing } = await supabaseAdmin
            .from('respect_members')
            .select('id, first_respect_at')
            .eq('wallet_address', s.wallet_address)
            .single();
          if (existing) memberId = existing.id;
        }

        if (!memberId) {
          const { data: existing } = await supabaseAdmin
            .from('respect_members')
            .select('id, first_respect_at')
            .eq('name', s.member_name)
            .single();
          if (existing) memberId = existing.id;
        }

        if (memberId) {
          // Existing member: increment totals
          const { data: current } = await supabaseAdmin
            .from('respect_members')
            .select('total_respect, fractal_respect, fractal_count, first_respect_at')
            .eq('id', memberId)
            .single();

          if (current) {
            const updates: Record<string, unknown> = {
              total_respect: Number(current.total_respect) + s.score,
              fractal_respect: Number(current.fractal_respect) + s.score,
              fractal_count: Number(current.fractal_count) + 1,
              updated_at: new Date().toISOString(),
            };

            // Set first_respect_at if this is the member's first score
            if (!current.first_respect_at) {
              updates.first_respect_at = session_date;
            }

            await supabaseAdmin
              .from('respect_members')
              .update(updates)
              .eq('id', memberId);
          }
        } else {
          // New member: create row
          await supabaseAdmin
            .from('respect_members')
            .insert({
              name: s.member_name,
              wallet_address: s.wallet_address || null,
              total_respect: s.score,
              fractal_respect: s.score,
              fractal_count: 1,
              first_respect_at: session_date,
            });
        }
      })
    );

    // 4. If host provided, add a hosting event to respect_events
    if (host_name) {
      const { error: hostError } = await supabaseAdmin
        .from('respect_events')
        .insert({
          member_name: host_name,
          wallet_address: host_wallet || null,
          event_type: 'hosting',
          amount: 0,
          description: `Hosted ${name}`,
          event_date: session_date,
        });

      if (!hostError) {
        // Update hosting_count for the host member
        const hostQuery = host_wallet
          ? supabaseAdmin
              .from('respect_members')
              .select('id, hosting_count')
              .eq('wallet_address', host_wallet)
              .single()
          : supabaseAdmin
              .from('respect_members')
              .select('id, hosting_count')
              .eq('name', host_name)
              .single();

        const { data: hostMember } = await hostQuery;
        if (hostMember) {
          await supabaseAdmin
            .from('respect_members')
            .update({
              hosting_count: Number(hostMember.hosting_count) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', hostMember.id);
        }
      }
    }

    // Check for any failed updates
    const failures = updateResults.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      console.error('Some member updates failed:', failures);
    }

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      scores_recorded: scores.length,
      warnings: failures.length > 0 ? `${failures.length} member update(s) failed` : undefined,
    });
  } catch (error) {
    console.error('Record fractal session error:', error);
    return NextResponse.json({ error: 'Failed to record fractal session' }, { status: 500 });
  }
}
