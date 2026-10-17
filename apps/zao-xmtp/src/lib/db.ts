import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseServiceRoleKey, supabaseUrl } from '@/lib/env';

let _client: SupabaseClient | null = null;

/** Service-role Supabase client. Server-side only; never import from a client component. */
export function db(): SupabaseClient {
  if (!_client) {
    _client = createClient(supabaseUrl(), supabaseServiceRoleKey(), {
      auth: { persistSession: false },
    });
  }
  return _client;
}
