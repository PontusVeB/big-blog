// Navbar — Server Component. Pobiera profil + liczbę nieprzeczytanych powiadomień.

import { createClient } from "@/lib/supabase/server";
import NavbarClient, { type NavbarProfile } from "./NavbarClient";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: NavbarProfile = null;
  let unreadCount = 0;

  if (user) {
    // Pobieramy profil i licznik nieprzeczytanych powiadomień RÓWNOLEGLE
    const [{ data: profileData }, { count }] = await Promise.all([
      supabase
        .from("profiles")
        .select("nickname, avatar_url, email, role")
        .eq("id", user.id)
        .single(),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false),
    ]);
    profile = profileData as NavbarProfile;
    unreadCount = count ?? 0;
  }

  return <NavbarClient profile={profile} unreadCount={unreadCount} />;
}
