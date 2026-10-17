import { NextResponse } from 'next/server';
import { PREFS_DEFAULTS } from '@/contexts/xmtp/types';
import { requireMember } from '@/lib/membership';

/** GET - messaging preferences. Day one: the defaults (members-only DMs). Not stored yet. */
export async function GET() {
  try {
    const session = await requireMember({ persist: true });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json(PREFS_DEFAULTS);
  } catch (error: unknown) {
    console.error('[messaging-prefs]', error);
    return NextResponse.json({ error: 'Could not load preferences' }, { status: 500 });
  }
}
