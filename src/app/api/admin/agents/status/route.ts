import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { AGENTS } from '@/components/admin/agents/constants';
import type { AgentEvent, AgentStatus } from '@/components/admin/agents/constants';
import { deriveStatus } from '@/components/admin/agents/constants';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view') || 'squad';
  const agentFilter = searchParams.get('agent');
  const typeFilter = searchParams.get('event_type');
  const limit = Math.min(Number(searchParams.get('limit') || '50'), 200);
  const since = searchParams.get('since');

  try {
    if (view === 'squad') {
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const [latestResult, countsResult] = await Promise.all([
        supabaseAdmin
          .from('agent_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabaseAdmin
          .from('agent_events')
          .select('agent_name')
          .gte('created_at', dayAgo),
      ]);

      const latestEvents = (latestResult.data || []) as AgentEvent[];
      const countEvents = countsResult.data || [];

      const agents: AgentStatus[] = AGENTS.map((agent) => {
        const agentEvents = latestEvents.filter((e) => e.agent_name === agent.name);
        const lastEvent = agentEvents[0] || null;
        const events24h = countEvents.filter((e) => e.agent_name === agent.name).length;

        return {
          ...agent,
          status: deriveStatus(lastEvent),
          current_task: lastEvent?.event_type === 'task_started' ? lastEvent.summary : null,
          last_event: lastEvent,
          events_24h: events24h,
        };
      });

      return NextResponse.json({ agents });
    }

    let query = supabaseAdmin
      .from('agent_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (agentFilter) {
      query = query.eq('agent_name', agentFilter);
    }
    if (typeFilter) {
      query = query.eq('event_type', typeFilter);
    }
    if (since) {
      query = query.gte('created_at', since);
    }

    const { data, error } = await query;
    if (error) {
      logger.error('Agent events query error:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    return NextResponse.json({ events: data || [] });
  } catch (err) {
    logger.error('Agent status error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
