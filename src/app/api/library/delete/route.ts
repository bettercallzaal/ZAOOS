import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { libraryDeleteSchema } from '@/lib/validation/library-schemas';
import { logger } from '@/lib/logger';

export async function DELETE(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = libraryDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { entry_id } = parsed.data;

    const { error } = await supabaseAdmin
      .from('research_entries')
      .delete()
      .eq('id', entry_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[library/delete] Error:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
