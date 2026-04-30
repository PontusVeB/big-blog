// Endpoint dla callbacku autoryzacji.
// Tutaj trafia user po:
//   - kliknięciu w link potwierdzający z maila (po rejestracji)
//   - zalogowaniu przez Google / Facebook (OAuth)
// Wymieniamy "code" w URL na sesję usera i przekierowujemy gdzie trzeba.

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Sukces — przekieruj na stronę docelową (domyślnie /)
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Coś poszło nie tak — wróć do logowania z infem o błędzie
  return NextResponse.redirect(`${origin}/logowanie?error=auth_callback`);
}
