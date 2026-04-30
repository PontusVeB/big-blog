// Helper do middleware Next.js — odświeża sesję Supabase przy każdym requeście.
// Bez tego sesja po zalogowaniu/wylogowaniu nie aktualizuje się i widzisz
// stare dane. Wywoływane w pliku /middleware.ts w korzeniu projektu.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // WAŻNE: getUser() musi być wywołane w tym miejscu, między createServerClient
  // a return. Bez tego sesja nie odświeża się przy zmianach stanu logowania.
  await supabase.auth.getUser();

  return supabaseResponse;
}
