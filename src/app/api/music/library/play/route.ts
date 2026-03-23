import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { incrementPlayCount } from '@/lib/music/library';

const schema = z.object({ songId: z.string().uuid() });

/**
 * POST /api/music/library/play — increment play count for a song
 * Fire-and-forget from client on each play.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    await incrementPlayCount(parsed.data.songId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[library] play count failed:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
