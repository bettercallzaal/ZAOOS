import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { ENV } from '@/lib/env';
import { logger } from '@/lib/logger';
import { deriveContactSlug, type InteractionType } from '@/lib/crm/types';

// POST /api/crm/interactions
// Upserts a contact (by deterministic slug) then logs one interaction.
// Dual auth: ZOE (Telegram bot) via `Authorization: Bearer <CRM_BOT_SECRET>`,
// or an admin browser session (iron-session isAdmin). Service-role client
// bypasses RLS; the private layer is protected here at the app layer.

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().max(64).optional(),
  handle: z.string().max(120).optional(),
  farcaster_handle: z.string().max(120).optional(),
  x_handle: z.string().max(120).optional(),
  github_handle: z.string().max(120).optional(),
  telegram_handle: z.string().max(120).optional(),
  role: z.string().max(200).optional(),
  org: z.string().max(200).optional(),
  how_we_met: z.string().max(2000).optional(),
  public_summary: z.string().max(4000).optional(),
  email: z.string().email().max(320).optional(),
  phone: z.string().max(40).optional(),
  location: z.string().max(200).optional(),
  private_notes: z.string().max(8000).optional(),
  relationship_strength: z.number().int().min(0).max(5).optional(),
  is_public: z.boolean().optional(),
});

const interactionSchema = z.object({
  type: z
    .enum(['meeting', 'call', 'email', 'message', 'gcal', 'github', 'note'])
    .default('note'),
  title: z.string().max(300).optional(),
  public_summary: z.string().max(4000).optional(),
  private_notes: z.string().max(8000).optional(),
  visibility: z.enum(['public', 'private']).default('private'),
  occurred_at: z.string().datetime().optional(),
  source: z.string().max(40).optional(),
});

const bodySchema = z.object({
  contact: contactSchema,
  interaction: interactionSchema,
});

type Caller = { kind: 'bot' } | { kind: 'admin'; fid: number };

async function authenticate(req: NextRequest): Promise<Caller | null> {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (ENV.CRM_BOT_SECRET && token === ENV.CRM_BOT_SECRET) {
      return { kind: 'bot' };
    }
    return null; // a Bearer was offered but it was wrong - reject, don't fall through
  }
  const session = await getSessionData();
  if (session?.fid && session.isAdmin) {
    return { kind: 'admin', fid: session.fid };
  }
  return null;
}

/** Strip undefined so an upsert never overwrites existing columns with null. */
function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

export async function POST(req: NextRequest) {
  try {
    const caller = await authenticate(req);
    if (!caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const raw = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { contact, interaction } = parsed.data;

    const slug = deriveContactSlug(contact);
    const supabase = getSupabaseAdmin();

    // 1. Upsert the contact by slug. Only provided fields are written, so a
    // re-upsert never nulls out columns set on a prior touch.
    const contactRow = compact({
      ...contact,
      slug,
      owner_fid: caller.kind === 'admin' ? caller.fid : undefined,
    });

    const { data: upserted, error: contactErr } = await supabase
      .from('crm_contacts')
      .upsert(contactRow, { onConflict: 'slug' })
      .select('id, slug, is_public')
      .single();

    if (contactErr || !upserted) {
      logger.error('[crm/interactions] contact upsert failed:', contactErr);
      return NextResponse.json(
        { error: 'Failed to upsert contact' },
        { status: 500 },
      );
    }

    // 2. Insert the interaction linked to the contact.
    const { data: loggedInteraction, error: interactionErr } = await supabase
      .from('crm_interactions')
      .insert(
        compact({
          contact_id: upserted.id,
          type: interaction.type as InteractionType,
          title: interaction.title,
          public_summary: interaction.public_summary,
          private_notes: interaction.private_notes,
          visibility: interaction.visibility,
          occurred_at: interaction.occurred_at,
          source: interaction.source ?? (caller.kind === 'bot' ? 'zoe' : 'manual'),
          created_by:
            caller.kind === 'bot' ? 'zoe' : `admin:${caller.fid}`,
        }),
      )
      .select('id')
      .single();

    if (interactionErr || !loggedInteraction) {
      logger.error('[crm/interactions] interaction insert failed:', interactionErr);
      return NextResponse.json(
        { error: 'Contact saved but interaction failed', contact_id: upserted.id },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        contact_id: upserted.id,
        slug: upserted.slug,
        interaction_id: loggedInteraction.id,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    logger.error('[crm/interactions] unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
