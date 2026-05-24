"use server";
// Server Actions dla panelu admina.
// Faza 22: updateUser obsługuje teraz również rolę BLOGER.
// Zasady ochrony (3 warstwy):
//   1. UI (panel pokazuje "Edytuj" tylko MASTEROWI)
//   2. Server Action (sprawdza role caller + target)
//   3. RLS w bazie (UPDATE profiles tylko swój — admin client bypass dla moderacji)

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AVAILABLE_PERMISSIONS,
  type Role,
} from "@/lib/auth/permissions";

export type UpdateUserResult = { error?: string };

/**
 * Aktualizuje rolę i listę uprawnień jakiegoś usera.
 * MASTER nie może być nadany ani odebrany przez panel — tylko przez bazę.
 * Caller musi być MASTER. Nie można edytować siebie ani innego MASTERA.
 */
export async function updateUser(
  userId: string,
  newRole: "USER" | "BLOGER" | "ADMIN",
  newPermissions: string[]
): Promise<UpdateUserResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Musisz być zalogowany." };

  // Pobieramy profile sprawcy i celu (równolegle)
  const [{ data: actor }, { data: target }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single<{ id: string; role: Role }>(),
    supabase
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .single<{ id: string; role: Role }>(),
  ]);

  if (!actor) return { error: "Profil sprawcy nie znaleziony." };
  if (!target) return { error: "Profil użytkownika nie znaleziony." };

  // Caller MUSI być MASTER
  if (actor.role !== "MASTER") {
    return { error: "Tylko MASTER może edytować role i uprawnienia." };
  }

  // Nie można edytować siebie przez panel
  if (target.id === actor.id) {
    return {
      error: "Nie możesz edytować swojego konta przez panel admina. Użyj bazy danych.",
    };
  }

  // Nie można edytować innego MASTERA
  if (target.role === "MASTER") {
    return {
      error: "Nie można edytować innego MASTERA przez panel. Użyj bazy danych.",
    };
  }

  // Walidacja roli — MASTER excluded (nadawany tylko przez bazę)
  if (newRole !== "USER" && newRole !== "BLOGER" && newRole !== "ADMIN") {
    return { error: "Nowa rola musi być USER, BLOGER lub ADMIN." };
  }

  // Filtruj permissions — tylko te z whitelisty
  const validPermissions = newPermissions.filter((p) =>
    (AVAILABLE_PERMISSIONS as readonly string[]).includes(p)
  );

  // Admin client — bypass RLS, bezpieczne bo właśnie sprawdziliśmy uprawnienia
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      role: newRole,
      permissions: validPermissions,
    })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin/uzytkownicy");
  revalidatePath(`/profil/${userId}`);
  return {};
}
