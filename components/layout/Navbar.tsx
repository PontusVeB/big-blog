// Navbar — Server Component. Pobiera profil, liczbę nieprzeczytanych
// powiadomień oraz liczbę nieprzeczytanych wiadomości.

import { createClient } from "@/lib/supabase/server";
import NavbarClient, { type NavbarProfile } from "./NavbarClient";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: NavbarProfile = null;
  let unreadCount = 0;
  let unreadMessages = 0;

  if (user) {
    // Profil + licznik powiadomień + licznik wiadomości — RÓWNOLEGLE.
    const [{ data: profileData }, { count: notifCount }, { count: msgCount }] =
      await Promise.all([
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
        supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("recipient_id", user.id)
          .is("read_at", null),
      ]);

    profile = profileData as NavbarProfile;
    unreadCount = notifCount ?? 0;
    unreadMessages = msgCount ?? 0;
  }

  return (
    <NavbarClient
      profile={profile}
      unreadCount={unreadCount}
      unreadMessages={unreadMessages}
    />
  );
}
