import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";

export async function createServerClient() {
  await connection();

  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error("Brak NEXT_PUBLIC_SUPABASE_URL albo NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  const { url, anonKey } = env;

  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll is called from a Server Component; middleware refreshes the session.
        }
      },
    },
  });
}
