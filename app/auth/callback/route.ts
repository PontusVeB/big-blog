// Endpoint dla callbacku autoryzacji.
// Tutaj trafia user po:
//   - kliknięciu w link potwierdzający z maila (po rejestracji email/hasło)
//   - zalogowaniu przez Google / Facebook (OAuth)
// Wymieniamy "code" w URL na sesję usera i przekierowujemy z toastem powitalnym.

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Sukces — przekierowanie na home z flashem
      return NextResponse.redirect(`${origin}/?flash=logged_in`);
    }
  }

  // Coś poszło nie tak — wróć do logowania z informacją
  return NextResponse.redirect(`${origin}/logowanie?error=auth_callback`);
}
