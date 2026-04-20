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
export async function GET() {
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

  // Don't silently hide DB failures as empty arrays — admin can't distinguish
  // "no agents configured" from "DB down" otherwise. Surface the error.
  if (configResult.status === 'rejected') {
    logger.error('GET /api/admin/agents: agent_config query failed:', configResult.reason);
    return NextResponse.json({ error: 'Failed to fetch agent configs' }, { status: 500 });
  }
  if (eventsResult.status === 'rejected') {
    logger.error('GET /api/admin/agents: agent_events query failed:', eventsResult.reason);
    return NextResponse.json({ error: 'Failed to fetch agent events' }, { status: 500 });
  }
  if (configResult.value.error) {
    logger.error('GET /api/admin/agents: agent_config returned error:', configResult.value.error);
    return NextResponse.json({ error: 'Failed to fetch agent configs' }, { status: 500 });
  }
  if (eventsResult.value.error) {
    logger.error('GET /api/admin/agents: agent_events returned error:', eventsResult.value.error);
    return NextResponse.json({ error: 'Failed to fetch agent events' }, { status: 500 });
  }

  return NextResponse.json({
    agents: configResult.value.data ?? [],
    recentEvents: eventsResult.value.data ?? [],
  });
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
