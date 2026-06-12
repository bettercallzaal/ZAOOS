import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const VALID_SORT_FIELDS = ['score', 'name', 'first_met', 'last_interaction'] as const;
type SortField = (typeof VALID_SORT_FIELDS)[number];

// Strict contact field schema - bounds every field and rejects unknown keys so
// arbitrary attacker-supplied columns can't reach the DB write.
const str = (max: number) => z.string().trim().max(max);
const contactFields = {
  name: str(200),
  handle: str(200),
  category: str(64),
  met_at: str(200),
  organization: str(200),
  location: str(200),
  location_2: str(200),
  notes: str(5000),
  can_support: z.boolean(),
  background: str(5000),
  extra: z.record(z.string(), z.unknown()),
  score: z.number().int().min(0).max(1000),
  first_met: str(64),
  source: str(120),
};
// POST: name required, everything else optional, no unknown keys.
const createContactSchema = z
  .object({ ...contactFields, name: contactFields.name.min(1) })
  .partial()
  .required({ name: true })
  .strict();
// PATCH: id required, any subset of the known fields, no unknown keys.
const updateContactSchema = z
  .object({ id: z.string().trim().min(1), ...contactFields })
  .partial()
  .required({ id: true })
  .strict();

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
    const raw = await req.json().catch(() => null);
    const parsed = createContactSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid contact', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('contacts')
      .insert(parsed.data)
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
    const raw = await req.json().catch(() => null);
    const parsed = updateContactSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid update', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { id, ...fields } = parsed.data;
    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
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
