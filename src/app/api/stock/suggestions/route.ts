import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';

const createSchema = z.object({
  name: z.string().trim().max(200).optional(),
  contact: z.string().trim().max(200).optional(),
  suggestion: z.string().trim().min(1, 'Suggestion cannot be empty').max(2000),
  hp: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 },
      );
    }

    if (parsed.data.hp && parsed.data.hp.trim().length > 0) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('stock_suggestions').insert({
      name: parsed.data.name || '',
      contact: parsed.data.contact || '',
      suggestion: parsed.data.suggestion,
    });

    if (error) {
      return NextResponse.json({ error: 'Could not submit' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_suggestions')
    .select('id, name, contact, suggestion, status, created_at')
    .neq('status', 'archived')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: 'Load failed' }, { status: 500 });
  return NextResponse.json({ suggestions: data });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['new', 'reviewing', 'actioned', 'wontfix', 'archived']).optional(),
  notes: z.string().max(2000).optional(),
});

export async function PATCH(request: NextRequest) {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('stock_suggestions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  return NextResponse.json({ success: true });
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function DELETE(request: NextRequest) {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('stock_suggestions').delete().eq('id', parsed.data.id);
  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  return NextResponse.json({ success: true });
}
