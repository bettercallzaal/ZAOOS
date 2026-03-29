import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabaseAdmin: SupabaseClient | null = null;
let _envModule: { ENV: { NEXT_PUBLIC_SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string } } | null = null;

/**
 * Pre-load the ENV module asynchronously. Called once at server startup
 * so that getSupabaseAdmin() can remain synchronous for all 150+ call sites.
 */
export async function preloadEnv(): Promise<void> {
  if (!_envModule) {
    _envModule = await import('@/lib/env');
  }
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    // Lazy-load ENV — preloadEnv() should have been called at server startup.
    // Falls back to process.env to avoid breaking if preload was skipped.
    const url = _envModule?.ENV.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = _envModule?.ENV.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Missing SUPABASE env vars — call preloadEnv() at startup or set process.env');
    }
    _supabaseAdmin = createClient(url, key);
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
