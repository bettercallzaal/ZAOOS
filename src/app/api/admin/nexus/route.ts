import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logAuditEvent, getClientIp } from '@/lib/db/audit-log';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const nexusLinkSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  category: z.string().min(1).max(100),
  subcategory: z.string().min(1).max(100),
  portal_group: z.enum(['MUSIC', 'SOCIAL', 'BUILD', 'EARN', 'GOVERN', 'VIP']).optional(),
  sort_order: z.number().int().min(0).default(0),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  is_gated: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

const updateSchema = nexusLinkSchema.partial().extend({
  id: z.string().uuid(),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

const reorderSchema = z.object({
  updates: z.array(z.object({
    id: z.string().uuid(),
    sort_order: z.number().int().min(0),
  })),
});

async function requireAdmin() {
  const session = await getSessionData();
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (!session.isAdmin) return { error: 'Admin access required', status: 403 };
  return { session };
}

// GET all links (admin view - includes inactive)
export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('nexus_links')
      .select('*')
      .order('category')
      .order('subcategory')
      .order('sort_order');

    if (error) throw error;

    // Get unique categories and subcategories for the UI
    const categories = [...new Set((data || []).map(l => l.category))];
    const subcategories = [...new Set((data || []).map(l => l.subcategory))];

    return NextResponse.json({
      links: data || [],
      count: data?.length || 0,
      categories,
      subcategories,
    });
  } catch (err) {
    logger.error('Nexus admin fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 });
  }
}

// POST - create new link
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = nexusLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('nexus_links')
      .insert({ ...parsed.data, added_by: `fid:${auth.session.fid}` })
      .select()
      .single();

    if (error) throw error;

    logAuditEvent({
      actorFid: auth.session.fid!,
      action: 'nexus.add',
      targetType: 'nexus_link',
      targetId: data.id,
      details: { title: parsed.data.title, url: parsed.data.url },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ link: data });
  } catch (err) {
    logger.error('Nexus add error:', err);
    return NextResponse.json({ error: 'Failed to add link' }, { status: 500 });
  }
}

// PUT - update link or batch reorder
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();

    // Check if this is a reorder operation
    if (body.updates) {
      const parsed = reorderSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid reorder input', details: parsed.error.issues }, { status: 400 });
      }

      const results = await Promise.allSettled(
        parsed.data.updates.map(({ id, sort_order }) =>
          supabaseAdmin.from('nexus_links').update({ sort_order, updated_at: new Date().toISOString() }).eq('id', id)
        )
      );

      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        return NextResponse.json({ error: `${failures.length} updates failed` }, { status: 500 });
      }

      return NextResponse.json({ success: true, updated: parsed.data.updates.length });
    }

    // Single link update
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { id, ...updates } = parsed.data;
    const { data, error } = await supabaseAdmin
      .from('nexus_links')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logAuditEvent({
      actorFid: auth.session.fid!,
      action: 'nexus.update',
      targetType: 'nexus_link',
      targetId: id,
      details: updates,
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ link: data });
  } catch (err) {
    logger.error('Nexus update error:', err);
    return NextResponse.json({ error: 'Failed to update link' }, { status: 500 });
  }
}

// DELETE - remove link
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('nexus_links')
      .delete()
      .eq('id', parsed.data.id);

    if (error) throw error;

    logAuditEvent({
      actorFid: auth.session.fid!,
      action: 'nexus.delete',
      targetType: 'nexus_link',
      targetId: parsed.data.id,
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Nexus delete error:', err);
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 });
  }
}
