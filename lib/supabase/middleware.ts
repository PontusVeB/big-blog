// Helper do middleware Next.js — odświeża sesję Supabase + aktualizuje
// last_seen_at zalogowanego usera (throttle 1 min przez SQL function).

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

  // WAŻNE: getUser() musi być wywołane TUTAJ
  const { data: { user } } = await supabase.auth.getUser();

  // Aktualizujemy last_seen_at zalogowanego usera. Funkcja SQL ma wewnątrz
  // throttle — robi UPDATE tylko jeśli ostatnia aktywność była >1 min temu.
  // Dzięki temu nie hamerujemy bazy przy każdym przejściu między stronami.
  // Błąd cicho ignorujemy — to nie krytyczna operacja.
  if (user) {
    try {
      await supabase.rpc("update_last_seen_throttled", { uid: user.id });
    } catch {
      // ignore — nie blokujemy nawigacji
    }
  }

  return supabaseResponse;
}
