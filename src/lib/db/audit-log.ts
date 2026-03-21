import { supabaseAdmin } from '@/lib/db/supabase';

interface AuditLogEntry {
  actorFid: number;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Log an admin action to the security_audit_log table.
 * Fire-and-forget — errors are logged but never block the caller.
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await supabaseAdmin
      .from('security_audit_log')
      .insert({
        actor_fid: entry.actorFid,
        action: entry.action,
        target_type: entry.targetType,
        target_id: entry.targetId ?? null,
        details: entry.details ?? {},
        ip_address: entry.ipAddress ?? null,
      });
  } catch (err) {
    console.error('[audit-log] Failed to write audit entry:', err);
  }
}

/** Extract client IP from request headers (works behind Vercel/proxy). */
export function getClientIp(req: Request): string | undefined {
  const headers = new Headers(req.headers);
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    undefined
  );
}
