// Navbar — Server Component (async).
// Pobiera stan zalogowania z Supabase i przekazuje do klienckiego NavbarClient.
// Dzięki temu informacja o userze jest dostępna od razu przy renderingu strony,
// bez "miganiu" stanu niezalogowanego → zalogowanego.

import { createClient } from "@/lib/supabase/server";
import NavbarClient, { type NavbarProfile } from "./NavbarClient";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: NavbarProfile = null;

  if (user) {
    // Pobieramy profil zalogowanego usera (ksywka, avatar, rola)
    const { data } = await supabase
      .from("profiles")
      .select("nickname, avatar_url, email, role")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return <NavbarClient profile={profile} />;
}
