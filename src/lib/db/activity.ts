import { supabaseAdmin } from './supabase';

/**
 * Update last_active_at for a user. Fire-and-forget — never block the caller.
 */
export function touchActivity(fid: number): void {
  supabaseAdmin
    .from('users')
    .update({ last_active_at: new Date().toISOString() })
    .eq('fid', fid)
    .then(() => {}, () => {});
}
