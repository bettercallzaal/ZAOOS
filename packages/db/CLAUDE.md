# @zaoos/db

Supabase client + helpers. PostgreSQL with Row Level Security.

## Key Files
- `supabase.ts` - getSupabaseAdmin() (server), getSupabaseBrowser() (client)

## Boundaries
- ALWAYS: use RLS, service role server-side only
- NEVER: expose SUPABASE_SERVICE_ROLE_KEY to browser, bypass RLS
