import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/db/supabase';

const applySchema = z.object({
  name: z.string().trim().min(1, 'Name required').max(200),
  email: z.string().trim().email('Valid email required').max(200),
  phone: z.string().trim().max(50).optional(),
  role_interest: z
    .enum(['setup', 'checkin', 'water', 'safety', 'teardown', 'floater', 'content', 'unassigned'])
    .optional(),
  shift_interest: z
    .enum(['early', 'block1', 'block2', 'teardown', 'allday'])
    .optional(),
  message: z.string().trim().max(1000).optional(),
  hp: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = applySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 },
      );
    }

    // Honeypot - silently accept but do nothing if bots fill this field
    if (parsed.data.hp && parsed.data.hp.trim().length > 0) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const notes = [
      parsed.data.email ? `email: ${parsed.data.email}` : null,
      parsed.data.message ? `message: ${parsed.data.message}` : null,
      'submitted via /stock/apply',
    ]
      .filter(Boolean)
      .join('\n');

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('stock_volunteers').insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || '',
      role: parsed.data.role_interest || 'unassigned',
      shift: parsed.data.shift_interest || 'allday',
      confirmed: false,
      notes,
    });

    if (error) {
      return NextResponse.json({ error: 'Could not submit right now' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
