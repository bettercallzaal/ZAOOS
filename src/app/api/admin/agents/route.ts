import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const patchSchema = z.object({
  name: z.string().min(1),
  trading_enabled: z.boolean().optional(),
  max_daily_spend: z.number().positive().optional(),
  enabled: z.boolean().optional(),
});

async function requireAdmin() {
  const session = await getSessionData();
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (!session.isAdmin) return { error: 'Admin access required', status: 403 };
  return { session };
}

/**
 * GET /api/admin/agents -- list all agents with recent events
 */
export async function GET(_req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [configResult, eventsResult] = await Promise.allSettled([
    supabaseAdmin.from('agent_config').select('*').order('name'),
    supabaseAdmin
      .from('agent_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const configs = configResult.status === 'fulfilled' ? (configResult.value.data ?? []) : [];
  const events = eventsResult.status === 'fulfilled' ? (eventsResult.value.data ?? []) : [];

  return NextResponse.json({ agents: configs, recentEvents: events });
}

/**
 * PATCH /api/admin/agents -- update agent config (trading_enabled, max_daily_spend, etc.)
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, ...updates } = parsed.data;

    const { data, error } = await supabaseAdmin
      .from('agent_config')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('name', name)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update agent config:', error);
      return NextResponse.json({ error: 'Failed to update agent config' }, { status: 500 });
    }

    return NextResponse.json({ agent: data });
  } catch (error) {
    logger.error('PATCH /api/admin/agents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
