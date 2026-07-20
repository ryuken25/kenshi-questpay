import "server-only";
import { getDb, getSupabase as getNeonCompat } from "@/lib/db";

/** Back-compat export: returns Neon-backed query builder. */
export function getSupabase() {
  return getNeonCompat();
}

export function getNeon() {
  if (!process.env.DATABASE_URL) return null;
  return getDb();
}
