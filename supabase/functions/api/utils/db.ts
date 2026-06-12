import { createClient } from "npm:@supabase/supabase-js@2"

let _db: ReturnType<typeof createClient> | null = null

export function getDb() {
  if (!_db) {
    _db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    )
  }
  return _db
}
