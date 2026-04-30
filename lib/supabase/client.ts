// Klient Supabase dla komponentów klienckich (z dyrektywą "use client").
// Działa w przeglądarce użytkownika — używaj go tam, gdzie potrzebujesz interakcji
// (formularze logowania, lajki, komentarze itp.).

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
