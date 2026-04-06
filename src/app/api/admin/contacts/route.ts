import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const VALID_SORT_FIELDS = ['score', 'name', 'first_met', 'last_interaction'] as const;
type SortField = (typeof VALID_SORT_FIELDS)[number];

async function requireAdmin() {
  const session = await getSessionData();
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (!session.isAdmin) return { error: 'Admin access required', status: 403 };
  return { session };
}

/**
 * GET — List contacts with optional search, category filter, sort, and pagination
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const params = req.nextUrl.searchParams;

    const q = params.get('q')?.trim() || null;
    const category = params.get('category')?.trim() || null;

    const sortParam = params.get('sort') ?? 'score';
    const sort: SortField = (VALID_SORT_FIELDS as readonly string[]).includes(sortParam)
      ? (sortParam as SortField)
      : 'score';

    const orderParam = params.get('order') ?? 'desc';
    const ascending = orderParam === 'asc';

    const limitRaw = parseInt(params.get('limit') ?? '50', 10);
    const limit = isNaN(limitRaw) || limitRaw < 1 ? 50 : Math.min(limitRaw, 200);

    const offsetRaw = parseInt(params.get('offset') ?? '0', 10);
    const offset = isNaN(offsetRaw) || offsetRaw < 0 ? 0 : offsetRaw;

    const safeQ = q ? q.slice(0, 100).replace(/[%_\\]/g, '\\$&') : null;

    // Count query (no range)
    let countQuery = supabaseAdmin
      .from('contacts')
      .select('*', { count: 'exact', head: true });

    if (safeQ) {
      countQuery = countQuery.or(
        `name.ilike.%${safeQ}%,handle.ilike.%${safeQ}%,organization.ilike.%${safeQ}%,notes.ilike.%${safeQ}%`,
      );
    }
    if (category) {
      countQuery = countQuery.eq('category', category);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      logger.error('Contacts count error:', countError);
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }

    // Data query
    let dataQuery = supabaseAdmin
      .from('contacts')
      .select('*')
      .order(sort, { ascending, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (safeQ) {
      dataQuery = dataQuery.or(
        `name.ilike.%${safeQ}%,handle.ilike.%${safeQ}%,organization.ilike.%${safeQ}%,notes.ilike.%${safeQ}%`,
      );
    }
    if (category) {
      dataQuery = dataQuery.eq('category', category);
    }

    const { data, error } = await dataQuery;

    if (error) {
      logger.error('Contacts fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }

    return NextResponse.json({ contacts: data ?? [], total: count ?? 0 });
  } catch (err) {
    logger.error('GET /api/admin/contacts error:', err);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

/**
 * POST — Create a new contact
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();

    const { name, handle, category, met_at, organization, location, location_2, notes,
      can_support, background, extra, score, first_met, source } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const record: Record<string, unknown> = {
      name: name.trim(),
    };
    if (handle !== undefined) record.handle = handle;
    if (category !== undefined) record.category = category;
    if (met_at !== undefined) record.met_at = met_at;
    if (organization !== undefined) record.organization = organization;
    if (location !== undefined) record.location = location;
    if (location_2 !== undefined) record.location_2 = location_2;
    if (notes !== undefined) record.notes = notes;
    if (can_support !== undefined) record.can_support = can_support;
    if (background !== undefined) record.background = background;
    if (extra !== undefined) record.extra = extra;
    if (score !== undefined) record.score = score;
    if (first_met !== undefined) record.first_met = first_met;
    if (source !== undefined) record.source = source;

    const { data, error } = await supabaseAdmin
      .from('contacts')
      .insert(record)
      .select()
      .single();

    if (error) {
      logger.error('Create contact error:', error);
      return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
    }

    return NextResponse.json({ contact: data });
  } catch (err) {
    logger.error('POST /api/admin/contacts error:', err);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}

/**
 * PATCH — Update an existing contact
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id || typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { ...fields, updated_at: new Date().toISOString() };

    const { data, error } = await supabaseAdmin
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Update contact error:', error);
      return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
    }

    return NextResponse.json({ contact: data });
  } catch (err) {
    logger.error('PATCH /api/admin/contacts error:', err);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}
