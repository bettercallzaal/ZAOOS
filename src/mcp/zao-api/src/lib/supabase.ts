import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing required env var: SUPABASE_URL");
}
if (!supabaseServiceKey) {
  throw new Error("Missing required env var: SUPABASE_SERVICE_ROLE_KEY");
}

// Service role client — server-side ONLY. Never expose to clients.
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});
