import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logAuditEvent, getClientIp } from '@/lib/db/audit-log';
import { logger } from '@/lib/logger';

/**
 * DELETE — Permanently delete a room (admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Admin delete space error:', error);
      return NextResponse.json({ error: 'Failed to delete space' }, { status: 500 });
    }

    logAuditEvent({
      actorFid: session.fid,
      action: 'admin.space.delete',
      targetType: 'room',
      targetId: id,
      details: { roomId: id },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('DELETE /api/admin/spaces/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
