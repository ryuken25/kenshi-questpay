import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, hasSupabase } from "./server-config";

let _client: SupabaseClient | null = null;

/**
 * Returns a Supabase client using the **service role** key.
 * This bypasses RLS and must only be used server-side.
 *
 * If Supabase env vars are not configured, returns null — callers
 * should handle the "unavailable" case gracefully.
 */
export function getSupabase(): SupabaseClient | null {
  if (!hasSupabase) return null;
  if (_client) return _client;
  _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}
