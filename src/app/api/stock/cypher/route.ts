import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/db/supabase';

const cypherSchema = z.object({
  name: z.string().trim().min(1, 'Name required').max(200),
  email: z.string().trim().email('Valid email required').max(200).optional(),
  socials: z.string().trim().max(500).optional(),
  cypher_role: z.string().trim().min(1, 'Tell us what you bring').max(300),
  notes: z.string().trim().max(1000).optional(),
  hp: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = cypherSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 },
      );
    }

    if (parsed.data.hp && parsed.data.hp.trim().length > 0) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const notes = [
      parsed.data.email ? `email: ${parsed.data.email}` : null,
      parsed.data.notes ? `notes: ${parsed.data.notes}` : null,
      'cypher signup via /stock/cypher',
    ]
      .filter(Boolean)
      .join('\n');

    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from('stock_artists')
      .select('id')
      .ilike('name', parsed.data.name)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await supabase
        .from('stock_artists')
        .update({
          cypher_interested: true,
          cypher_role: parsed.data.cypher_role,
          socials: parsed.data.socials || undefined,
          notes: notes,
        })
        .eq('id', existing.id);
      if (updateError) {
        return NextResponse.json({ error: 'Could not update signup' }, { status: 500 });
      }
    } else {
      const { error: insertError } = await supabase.from('stock_artists').insert({
        name: parsed.data.name,
        status: 'wishlist',
        socials: parsed.data.socials || '',
        cypher_interested: true,
        cypher_role: parsed.data.cypher_role,
        notes,
      });
      if (insertError) {
        return NextResponse.json({ error: 'Could not save signup' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
