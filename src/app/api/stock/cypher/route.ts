import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { generateClaimToken, slugify } from '@/lib/stock/artists';

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

    const notesBlob = [
      parsed.data.email ? `email: ${parsed.data.email}` : null,
      parsed.data.notes ? `notes: ${parsed.data.notes}` : null,
      'cypher signup via /stock/cypher',
    ]
      .filter(Boolean)
      .join('\n');

    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from('stock_artists')
      .select('id, name, claim_token')
      .ilike('name', parsed.data.name)
      .maybeSingle();

    let claim_token: string;
    let name: string;

    if (existing) {
      claim_token = existing.claim_token || generateClaimToken();
      name = existing.name;
      const updates: Record<string, unknown> = {
        cypher_interested: true,
        cypher_role: parsed.data.cypher_role,
        notes: notesBlob,
      };
      if (parsed.data.socials) updates.socials = parsed.data.socials;
      if (!existing.claim_token) updates.claim_token = claim_token;
      const { error: updateError } = await supabase
        .from('stock_artists')
        .update(updates)
        .eq('id', existing.id);
      if (updateError) {
        return NextResponse.json({ error: 'Could not update signup' }, { status: 500 });
      }
    } else {
      claim_token = generateClaimToken();
      name = parsed.data.name;
      const { error: insertError } = await supabase.from('stock_artists').insert({
        name: parsed.data.name,
        status: 'wishlist',
        socials: parsed.data.socials || '',
        cypher_interested: true,
        cypher_role: parsed.data.cypher_role,
        notes: notesBlob,
        claim_token,
      });
      if (insertError) {
        return NextResponse.json({ error: 'Could not save signup' }, { status: 500 });
      }
    }

    const slug = slugify(name);
    const editUrl = `/stock/artist/${slug}?token=${claim_token}`;
    const publicUrl = `/stock/artist/${slug}`;

    return NextResponse.json({ success: true, slug, editUrl, publicUrl, claim_token }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
