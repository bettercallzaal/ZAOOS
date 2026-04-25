import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import {
  getOnePager,
  updateOnePager,
  appendBodySection,
  appendActivityNote,
  listActivity,
} from '@/lib/stock/onepagers';
import { logger } from '@/lib/logger';

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  audience: z.string().max(500).optional(),
  purpose: z.string().max(1000).optional(),
  body: z.string().max(50000).optional(),
  status: z.enum(['draft', 'review', 'final', 'sent', 'archived']).optional(),
  visibility: z.enum(['internal', 'public']).optional(),
  meeting_date: z.string().max(40).nullable().optional(),
  meeting_location: z.string().max(200).nullable().optional(),
  authors: z.string().max(200).nullable().optional(),
  reviewers: z.string().max(500).nullable().optional(),
  append: z.string().max(10000).optional(),
  note: z.string().max(2000).optional(),
  share_to: z.string().max(200).optional(),
  bumpVersion: z.boolean().optional(),
});

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const session = await getStockTeamMember();
    const pager = await getOnePager(slug);
    if (!pager) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (pager.visibility !== 'public' && !session) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }
    const activity = await listActivity(slug, 30);
    return NextResponse.json({ onepager: pager, activity, can_edit: session !== null });
  } catch (err) {
    logger.error({ err }, 'onepager GET failed');
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const session = await getStockTeamMember();
    if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const data = parsed.data;
    let result = await getOnePager(slug);
    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // append text to body
    if (data.append) {
      result = (await appendBodySection(slug, data.append, session.memberId)) ?? result;
    }

    // log a note to activity (no body change)
    if (data.note) {
      await appendActivityNote(slug, data.note, 'note', session.memberId);
    }

    // log a share event
    if (data.share_to) {
      await appendActivityNote(slug, `Shared to ${data.share_to}`, 'share', session.memberId, {
        recipient: data.share_to,
      });
    }

    // edit fields
    const fieldUpdates: Parameters<typeof updateOnePager>[1] = { last_edited_by: session.memberId };
    let touched = false;
    for (const k of [
      'title',
      'audience',
      'purpose',
      'body',
      'status',
      'visibility',
      'meeting_date',
      'meeting_location',
      'authors',
      'reviewers',
    ] as const) {
      if (data[k] !== undefined) {
        (fieldUpdates as Record<string, unknown>)[k] = data[k];
        touched = true;
      }
    }
    if (touched) {
      if (data.bumpVersion !== false) fieldUpdates.bumpVersion = true;
      result = (await updateOnePager(slug, fieldUpdates)) ?? result;
    }

    const activity = await listActivity(slug, 30);
    return NextResponse.json({ onepager: result, activity });
  } catch (err) {
    logger.error({ err }, 'onepager PATCH failed');
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
