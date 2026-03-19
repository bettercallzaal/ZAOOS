import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { fetchHatTree } from '@/lib/hats/tree';

export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tree = await fetchHatTree();
    return NextResponse.json(tree);
  } catch (err) {
    console.error('[hats/tree] Error:', err);
    return NextResponse.json({ error: 'Failed to load hat tree' }, { status: 500 });
  }
}
