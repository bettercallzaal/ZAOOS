import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchMembers } from '@/lib/directory';
import { requireMember } from '@/lib/membership';

const querySchema = z.object({ q: z.string().trim().min(1).max(32) });

/** GET ?q= - search the member directory. Members only; non-members are not searchable. */
export async function GET(req: NextRequest) {
  try {
    const session = await requireMember({ persist: true });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = querySchema.safeParse({ q: req.nextUrl.searchParams.get('q') ?? '' });
    if (!parsed.success) return NextResponse.json({ error: 'Invalid query' }, { status: 400 });

    const rows = await searchMembers(parsed.data.q);
    const users = rows.map((m) => ({
      fid: m.fid,
      username: m.username ?? '',
      display_name: m.display_name ?? '',
      pfp_url: m.pfp_url ?? '',
    }));
    return NextResponse.json({ users });
  } catch (error: unknown) {
    console.error('[search/users]', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
