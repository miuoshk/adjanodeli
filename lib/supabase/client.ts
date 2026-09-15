import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";

export function createBrowserClient() {
  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error("Brak NEXT_PUBLIC_SUPABASE_URL albo NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  const { url, anonKey } = env;

  return createSupabaseBrowserClient<Database>(url, anonKey);
}
