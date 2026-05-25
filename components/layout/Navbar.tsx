// Navbar — Server Component. Pobiera profil, liczniki powiadomień i wiadomości.
// Faza 22b: dodano `permissions` do selecta i oblicza canPost serwerowo
// przez hasPermission — uwzględnia zarówno rolę jak i per-user grant.

import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/auth/permissions";
import NavbarClient, { type NavbarProfile } from "./NavbarClient";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: NavbarProfile = null;
  let unreadCount = 0;
  let unreadMessages = 0;
  let canPost = false;

  if (user) {
    // Profil + licznik powiadomień + licznik wiadomości — RÓWNOLEGLE.
    // permissions[] musi być w selectcie — hasPermission potrzebuje go do
    // obsługi per-user grantu (USER z ręcznie nadanym posts.create).
    const [{ data: profileData }, { count: notifCount }, { count: msgCount }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("nickname, avatar_url, email, role, permissions")
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

    // Obliczamy canPost SERWEROWO: hasPermission sprawdza rolę + permissions[].
    // NIE przekazujemy permissions do klienta — tylko gotowy boolean.
    canPost = hasPermission(
      profileData as { role: string; permissions: string[] | null } | null,
      "posts.create"
    );

    // Do NavbarProfile trafia profil bez permissions (klient ich nie potrzebuje).
    profile = profileData as NavbarProfile;
    unreadCount = notifCount ?? 0;
    unreadMessages = msgCount ?? 0;
  }

  return (
    <NavbarClient
      profile={profile}
      unreadCount={unreadCount}
      unreadMessages={unreadMessages}
      userId={user?.id ?? null}
      canPost={canPost}
    />
  );
}
