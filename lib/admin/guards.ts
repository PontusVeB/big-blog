// Helper zabezpieczający strony /admin — sprawdza uprawnienia, redirectuje.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission, type Role } from "@/lib/auth/permissions";

export type AdminViewerProfile = {
  id: string;
  email: string;
  role: Role;
  permissions: string[] | null;
};

/**
 * Sprawdza czy bieżący user może wejść w /admin (wymagane: users.view).
 * Niezalogowany → /logowanie. Zalogowany bez uprawnień → /.
 * Zalogowany z uprawnieniami → zwraca profil.
 */
export async function requireAdminAccess(): Promise<AdminViewerProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/logowanie?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role, permissions")
    .eq("id", user.id)
    .single<AdminViewerProfile>();

  if (!profile || !hasPermission(profile, "users.view")) {
    redirect("/");
  }

  return profile;
}
