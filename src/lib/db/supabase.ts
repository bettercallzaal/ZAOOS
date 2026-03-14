import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV } from '@/lib/env';

let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      ENV.NEXT_PUBLIC_SUPABASE_URL,
      ENV.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return _supabaseAdmin;
}

// Convenience getter - lazy proxy so module can be imported at build time
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
