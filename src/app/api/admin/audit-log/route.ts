import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  action: z.string().max(200).optional(),
  actorFid: z.coerce.number().int().positive().optional(),
});

async function requireAdmin() {
  const session = await getSessionData();
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (!session.isAdmin) return { error: 'Admin access required', status: 403 };
  return { session };
}

/**
 * GET — Fetch audit log entries with optional filters and pagination.
 * Returns { entries, total, actions } where actions is a list of distinct action values.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = querySchema.safeParse({
    limit: req.nextUrl.searchParams.get('limit') ?? undefined,
    offset: req.nextUrl.searchParams.get('offset') ?? undefined,
    action: req.nextUrl.searchParams.get('action') ?? undefined,
    actorFid: req.nextUrl.searchParams.get('actorFid') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { limit, offset, action, actorFid } = parsed.data;

  try {
    // Build the main query
    let query = supabaseAdmin
      .from('security_audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) {
      query = query.eq('action', action);
    }
    if (actorFid) {
      query = query.eq('actor_fid', actorFid);
    }

    // Fetch entries and distinct actions in parallel
    const [entriesResult, actionsResult] = await Promise.allSettled([
      query,
      supabaseAdmin
        .from('security_audit_log')
        .select('action')
        .order('action', { ascending: true }),
    ]);

    if (entriesResult.status === 'rejected') {
      throw entriesResult.reason;
    }

    const { data: entries, count, error: entriesError } = entriesResult.value;
    if (entriesError) throw entriesError;

    // Extract distinct action values
    let actions: string[] = [];
    if (actionsResult.status === 'fulfilled' && !actionsResult.value.error) {
      const seen = new Set<string>();
      for (const row of actionsResult.value.data ?? []) {
        if (row.action && !seen.has(row.action)) {
          seen.add(row.action);
          actions.push(row.action);
        }
      }
    }

    return NextResponse.json({
      entries: entries ?? [],
      total: count ?? 0,
      actions,
    });
  } catch (err) {
    console.error('[admin/audit-log] Error fetching audit log:', err);
    return NextResponse.json(
      { error: 'Failed to fetch audit log' },
      { status: 500 },
    );
  }
}
