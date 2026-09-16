import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";

function isAdminLoginPath(pathname: string) {
  return pathname === "/admin/logowanie";
}

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/");
}

function isProtectedPath(pathname: string) {
  return (
    pathname === "/zamowienie" ||
    pathname.startsWith("/zamowienie/") ||
    pathname === "/moje-zamowienia" ||
    pathname.startsWith("/moje-zamowienia/") ||
    pathname === "/konto" ||
    pathname.startsWith("/konto/") ||
    pathname === "/zamow-jak-zwykle" ||
    pathname.startsWith("/zamow-jak-zwykle/") ||
    (isAdminPath(pathname) && !isAdminLoginPath(pathname))
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const env = getSupabasePublicEnv();
  if (!env) {
    return supabaseResponse;
  }
  const { url, anonKey } = env;

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = isAdminPath(pathname) ? "/admin/logowanie" : "/logowanie";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    const redirectResponse = NextResponse.redirect(loginUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}
