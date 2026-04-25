import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { listOnePagers, createOnePager, slugify } from '@/lib/stock/onepagers';
import { logger } from '@/lib/logger';

const postSchema = z.object({
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/i).max(60).optional(),
  title: z.string().min(1).max(200),
  audience: z.string().max(500).optional(),
  purpose: z.string().max(1000).optional(),
  body: z.string().max(50000).optional(),
  status: z.enum(['draft', 'review', 'final', 'sent', 'archived']).optional(),
  visibility: z.enum(['internal', 'public']).optional(),
  meeting_date: z.string().max(40).nullable().optional(),
  meeting_location: z.string().max(200).nullable().optional(),
  authors: z.string().max(200).nullable().optional(),
  reviewers: z.string().max(500).nullable().optional(),
});

export async function GET() {
  try {
    const session = await getStockTeamMember();
    const all = await listOnePagers();
    const visible = all.filter((p) => p.visibility === 'public' || session !== null);
    return NextResponse.json({ onepagers: visible, signed_in: session !== null });
  } catch (err) {
    logger.error({ err }, 'onepagers GET failed');
    return NextResponse.json({ error: 'Failed to load one-pagers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getStockTeamMember();
    if (!session) {
      return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
    }
    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }
    const slug = parsed.data.slug ?? slugify(parsed.data.title.replace(/^ZAOstock\s*\d{4}\s*-?\s*/i, ''));
    const created = await createOnePager({
      slug,
      title: parsed.data.title,
      audience: parsed.data.audience,
      purpose: parsed.data.purpose,
      body: parsed.data.body,
      status: parsed.data.status,
      visibility: parsed.data.visibility,
      meeting_date: parsed.data.meeting_date ?? null,
      meeting_location: parsed.data.meeting_location ?? null,
      authors: parsed.data.authors ?? null,
      reviewers: parsed.data.reviewers ?? null,
      last_edited_by: session.memberId,
    });
    return NextResponse.json({ onepager: created }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    if (message.includes('duplicate') || message.includes('unique')) {
      return NextResponse.json({ error: 'Slug already exists - pick a unique one' }, { status: 409 });
    }
    logger.error({ err }, 'onepagers POST failed');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
