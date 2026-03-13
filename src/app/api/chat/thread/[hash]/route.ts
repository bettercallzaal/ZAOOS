import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getCastThread } from '@/lib/farcaster/neynar';
import { castHashSchema } from '@/lib/validation/schemas';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { hash } = await params;
    const parsed = castHashSchema.safeParse(hash);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid cast hash' }, { status: 400 });
    }

    const thread = await getCastThread(parsed.data);
    return NextResponse.json(thread);
  } catch (error) {
    console.error('Thread fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 });
  }
}
