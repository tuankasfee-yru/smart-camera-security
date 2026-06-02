import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _public: SupabaseClient | null = null;
let _admin: SupabaseClient | null = null;

function getPublic(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!_public) _public = createClient(url, key);
  return _public;
}

function getAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!_admin) _admin = createClient(url, key);
  return _admin;
}

export { getPublic, getAdmin };
