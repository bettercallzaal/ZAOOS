import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getCastThread } from '@/lib/farcaster/neynar';
import { castHashSchema } from '@/lib/validation/schemas';
import { Cast } from '@/types';

function mapCast(raw: Record<string, unknown>): Cast {
  const author = raw.author as Record<string, unknown>;
  const replies = raw.replies as Record<string, unknown> | undefined;
  return {
    hash: raw.hash as string,
    author: {
      fid: author.fid as number,
      username: (author.username as string) || '',
      display_name: (author.display_name as string) || '',
      pfp_url: (author.pfp_url as string) || '',
    },
    text: (raw.text as string) || '',
    timestamp: (raw.timestamp as string) || '',
    replies: { count: (replies?.count as number) || 0 },
    parent_hash: (raw.parent_hash as string) || null,
  };
}

function flattenThread(cast: Record<string, unknown>): Cast[] {
  const result: Cast[] = [mapCast(cast)];
  const directReplies = cast.direct_replies as Record<string, unknown>[] | undefined;
  if (directReplies && Array.isArray(directReplies)) {
    for (const reply of directReplies) {
      result.push(...flattenThread(reply));
    }
  }
  return result;
}

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

    const data = await getCastThread(parsed.data);

    // Neynar returns { conversation: { cast: { ...parent, direct_replies: [...] } } }
    const rootCast = data?.conversation?.cast;
    if (!rootCast) {
      return NextResponse.json({ casts: [] });
    }

    const casts = flattenThread(rootCast);
    return NextResponse.json({ casts });
  } catch (error) {
    console.error('Thread fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 });
  }
}
