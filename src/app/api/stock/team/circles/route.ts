import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const postSchema = z.object({
  action: z.enum(['join', 'leave']),
  slug: z.string().min(1).max(40),
});

interface CircleRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  coordinator_member_id: string | null;
  coordinator_rotation_ends_at: string | null;
}

interface CircleListResponse {
  circles: Array<{
    id: string;
    slug: string;
    name: string;
    description: string;
    coordinator: { id: string; name: string } | null;
    coordinator_rotation_ends_at: string | null;
    members: Array<{ id: string; name: string }>;
    member_count: number;
    is_member: boolean;
    is_coordinator: boolean;
  }>;
  current_member_id: string | null;
}

export async function GET(): Promise<NextResponse<CircleListResponse | { error: string }>> {
  try {
    const session = await getStockTeamMember();
    const supabase = getSupabaseAdmin();

    const { data: circles, error: cErr } = await supabase
      .from('stock_circles')
      .select('id, slug, name, description, coordinator_member_id, coordinator_rotation_ends_at')
      .order('name');
    if (cErr) {
      logger.error({ error: cErr }, 'stock circles list failed');
      return NextResponse.json({ error: 'Failed to load circles' }, { status: 500 });
    }

    const { data: memberships, error: mErr } = await supabase
      .from('stock_circle_members')
      .select('circle_id, member_id, stock_team_members:member_id (id, name, active)');
    if (mErr) {
      logger.error({ error: mErr }, 'stock circles memberships failed');
      return NextResponse.json({ error: 'Failed to load circle members' }, { status: 500 });
    }

    const { data: coordinators, error: coordErr } = await supabase
      .from('stock_team_members')
      .select('id, name')
      .in(
        'id',
        (circles ?? []).map((c) => c.coordinator_member_id).filter((v): v is string => Boolean(v)),
      );
    if (coordErr) {
      logger.error({ error: coordErr }, 'stock circles coordinator lookup failed');
    }

    const coordById = new Map<string, { id: string; name: string }>();
    for (const c of coordinators ?? []) coordById.set(c.id as string, { id: c.id as string, name: c.name as string });

    const membersByCircle = new Map<string, Array<{ id: string; name: string }>>();
    type MembershipRow = {
      circle_id: string;
      member_id: string;
      stock_team_members: { id: string; name: string; active: boolean | null } | { id: string; name: string; active: boolean | null }[] | null;
    };
    for (const row of (memberships ?? []) as unknown as MembershipRow[]) {
      const tm = Array.isArray(row.stock_team_members) ? row.stock_team_members[0] : row.stock_team_members;
      if (!tm || tm.active === false) continue;
      const list = membersByCircle.get(row.circle_id) ?? [];
      list.push({ id: tm.id, name: tm.name });
      membersByCircle.set(row.circle_id, list);
    }

    const meId = session?.memberId ?? null;
    const out: CircleListResponse['circles'] = (circles as CircleRow[] | null ?? []).map((c) => {
      const members = (membersByCircle.get(c.id) ?? []).sort((a, b) => a.name.localeCompare(b.name));
      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        coordinator: c.coordinator_member_id ? coordById.get(c.coordinator_member_id) ?? null : null,
        coordinator_rotation_ends_at: c.coordinator_rotation_ends_at,
        members,
        member_count: members.length,
        is_member: meId ? members.some((m) => m.id === meId) : false,
        is_coordinator: meId ? c.coordinator_member_id === meId : false,
      };
    });

    return NextResponse.json({ circles: out, current_member_id: meId });
  } catch (err) {
    logger.error({ err }, 'stock circles GET unhandled');
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getStockTeamMember();
    if (!session) {
      return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: circle, error: cErr } = await supabase
      .from('stock_circles')
      .select('id, slug, name')
      .eq('slug', parsed.data.slug)
      .maybeSingle();
    if (cErr || !circle) {
      return NextResponse.json({ error: `Circle "${parsed.data.slug}" not found` }, { status: 404 });
    }

    if (parsed.data.action === 'join') {
      const { error } = await supabase
        .from('stock_circle_members')
        .upsert({ circle_id: circle.id, member_id: session.memberId }, { onConflict: 'member_id,circle_id' });
      if (error) {
        logger.error({ error, slug: parsed.data.slug }, 'stock circles join failed');
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, action: 'joined', circle: circle.name });
    }

    const { error } = await supabase
      .from('stock_circle_members')
      .delete()
      .eq('circle_id', circle.id)
      .eq('member_id', session.memberId);
    if (error) {
      logger.error({ error, slug: parsed.data.slug }, 'stock circles leave failed');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, action: 'left', circle: circle.name });
  } catch (err) {
    logger.error({ err }, 'stock circles POST unhandled');
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
