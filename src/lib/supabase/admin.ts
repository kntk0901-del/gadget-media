import { createClient } from "@supabase/supabase-js";

/**
 * Server-only client using the service-role key.
 * NEVER import this from client code.
 */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE service role env");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "gadget-media/ingest" } },
  });
}
