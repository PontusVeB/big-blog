"use server";
// Server Actions dla profilu.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, extractStoragePath } from "@/lib/supabase/admin";
import { validateNickname } from "./utils";

export type ProfileFormState = {
  error?: string;
  success?: boolean;
} | null;

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const nickname = (formData.get("nickname") as string)?.trim();
  const bio = (formData.get("bio") as string)?.trim();
  const avatarUrlRaw = (formData.get("avatarUrl") as string)?.trim();
  const avatarUrl = avatarUrlRaw && avatarUrlRaw.length > 0 ? avatarUrlRaw : null;

  // Walidacja ksywki
  const nickError = validateNickname(nickname);
  if (nickError) return { error: nickError };

  if (bio && bio.length > 500) {
    return { error: "Opis może mieć maksymalnie 500 znaków." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Musisz być zalogowany." };

  // Pobieramy aktualny profil — potrzebne do sprzątania starego avatara
  // gdy user zmienia zdjęcie.
  const { data: existing } = await supabase
    .from("profiles")
    .select("nickname, avatar_url")
    .eq("id", user.id)
    .single<{ nickname: string | null; avatar_url: string | null }>();

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({
      nickname,
      bio: bio && bio.length > 0 ? bio : null,
      avatar_url: avatarUrl,
    })
    .eq("id", user.id);

  if (updateErr) {
    // 23505 = unique_violation w Postgresie. Sprawdzamy czy chodzi o ksywkę.
    if (
      updateErr.code === "23505" ||
      updateErr.message?.toLowerCase().includes("nickname") ||
      updateErr.message?.toLowerCase().includes("unique")
    ) {
      return { error: "Ta ksywka jest już zajęta. Spróbuj innej." };
    }
    return { error: updateErr.message };
  }

  // Sprzątanie starego avatara w Storage gdy zmienił się
  if (existing?.avatar_url && existing.avatar_url !== avatarUrl) {
    const path = extractStoragePath(existing.avatar_url, "avatars");
    if (path) {
      const admin = createAdminClient();
      await admin.storage.from("avatars").remove([path]);
    }
  }

  // Revalidate layout (Navbar pokazuje avatar/ksywkę) i samą stronę edycji
  revalidatePath("/", "layout");
  revalidatePath("/profil/edycja");

  return { success: true };
}
