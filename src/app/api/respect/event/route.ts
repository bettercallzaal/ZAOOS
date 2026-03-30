import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { autoCastToZao } from '@/lib/publish/auto-cast';
import { logger } from '@/lib/logger';

async function requireAdmin() {
  const session = await getSessionData();
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (!session.isAdmin) return { error: 'Admin access required', status: 403 };
  return { session };
}

const EVENT_TYPES = [
  'introduction',
  'camera',
  'article',
  'hosting',
  'festival',
  'bonus',
  'listing',
  'other',
] as const;

// Map event_type to the respect_members column it should increment
const EVENT_TYPE_TO_COLUMN: Record<string, string> = {
  introduction: 'event_respect',
  camera: 'event_respect',
  article: 'event_respect',
  listing: 'event_respect',
  other: 'event_respect',
  hosting: 'hosting_respect',
  festival: 'bonus_respect',
  bonus: 'bonus_respect',
};

const RespectEventSchema = z.object({
  member_name: z.string().min(1),
  wallet_address: z.string().optional().nullable(),
  event_type: z.enum(EVENT_TYPES),
  amount: z.number().positive(),
  description: z.string().optional().nullable(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().nullable(),
});

/**
 * POST /api/respect/event — Admin only
 * Record a non-fractal respect event.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = RespectEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { member_name, wallet_address, event_type, amount, description, event_date } = parsed.data;

    // 1. Insert the event
    const { data: event, error: eventError } = await supabaseAdmin
      .from('respect_events')
      .insert({
        member_name,
        wallet_address: wallet_address || null,
        event_type,
        amount,
        description: description || null,
        event_date: event_date || null,
      })
      .select('id')
      .single();

    if (eventError) {
      logger.error('Failed to insert respect event:', eventError);
      return NextResponse.json({ error: 'Failed to create respect event' }, { status: 500 });
    }

    // 2. Update respect_members totals
    // Find the member by wallet first, then by name
    let memberId: string | null = null;
    let memberData: Record<string, unknown> | null = null;

    if (wallet_address) {
      const { data: existing } = await supabaseAdmin
        .from('respect_members')
        .select('*')
        .eq('wallet_address', wallet_address)
        .single();
      if (existing) {
        memberId = existing.id as string;
        memberData = existing;
      }
    }

    if (!memberId) {
      const { data: existing } = await supabaseAdmin
        .from('respect_members')
        .select('*')
        .eq('name', member_name)
        .single();
      if (existing) {
        memberId = existing.id as string;
        memberData = existing;
      }
    }

    const categoryColumn = EVENT_TYPE_TO_COLUMN[event_type] || 'event_respect';

    if (memberId && memberData) {
      // Existing member: increment totals
      const updates: Record<string, unknown> = {
        total_respect: Number(memberData.total_respect) + amount,
        [categoryColumn]: Number(memberData[categoryColumn] || 0) + amount,
        updated_at: new Date().toISOString(),
      };

      // Update hosting_count for hosting events
      if (event_type === 'hosting') {
        updates.hosting_count = Number(memberData.hosting_count || 0) + 1;
      }

      // Set first_respect_at if this is the member's first respect
      if (!memberData.first_respect_at && event_date) {
        updates.first_respect_at = event_date;
      }

      const { error: updateError } = await supabaseAdmin
        .from('respect_members')
        .update(updates)
        .eq('id', memberId);

      if (updateError) {
        logger.error('Failed to update member totals:', updateError);
        // Event was still recorded — return success with warning
        return NextResponse.json({
          success: true,
          event_id: event.id,
          warning: 'Event recorded but member totals failed to update',
        });
      }
    } else {
      // New member: create row
      const newMember: Record<string, unknown> = {
        name: member_name,
        wallet_address: wallet_address || null,
        total_respect: amount,
        [categoryColumn]: amount,
      };

      if (event_type === 'hosting') {
        newMember.hosting_count = 1;
      }

      if (event_date) {
        newMember.first_respect_at = event_date;
      }

      const { error: insertError } = await supabaseAdmin
        .from('respect_members')
        .insert(newMember);

      if (insertError) {
        logger.error('Failed to create member record:', insertError);
        return NextResponse.json({
          success: true,
          event_id: event.id,
          warning: 'Event recorded but member record failed to create',
        });
      }
    }

    // Fire-and-forget: check for respect milestones and auto-cast
    const newTotal = memberId && memberData
      ? Number(memberData.total_respect) + amount
      : amount;
    const oldTotal = memberId && memberData ? Number(memberData.total_respect) : 0;

    const MILESTONES = [100, 500, 1000] as const;
    for (const milestone of MILESTONES) {
      if (oldTotal < milestone && newTotal >= milestone) {
        autoCastToZao(
          `\u{1F3C6} ${member_name} just reached ${milestone} Respect!`,
        ).catch((err) => logger.error('[respect-milestone-cast]', err));
        break; // Only announce the highest crossed milestone
      }
    }

    return NextResponse.json({
      success: true,
      event_id: event.id,
    });
  } catch (error) {
    logger.error('Record respect event error:', error);
    return NextResponse.json({ error: 'Failed to record respect event' }, { status: 500 });
  }
}
