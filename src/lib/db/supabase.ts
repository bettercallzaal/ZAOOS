import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    // Lazy-import ENV to avoid triggering server-only env validation
    // when client components import getSupabaseBrowser from this module.
    const { ENV } = require('@/lib/env');
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

// ---------- Browser-safe client (Realtime, public queries) ----------
// Uses only NEXT_PUBLIC_* env vars — safe for client components.
// Reads process.env directly to avoid importing ENV (which requires server secrets).
let _browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (_browserClient) return _browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  _browserClient = createClient(url, key);
  return _browserClient;
}
