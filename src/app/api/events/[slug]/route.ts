import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEventBySlug } from '@/lib/unlock/events';
import { logger } from '@/lib/logger';

const slugSchema = z.string().min(1).max(100);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const parsed = slugSchema.safeParse(slug);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid event slug' }, { status: 400 });
    }

    const event = await getEventBySlug(parsed.data);
    if (!event || !event.is_published) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (err) {
    logger.error('[events/[slug]] Unexpected error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
