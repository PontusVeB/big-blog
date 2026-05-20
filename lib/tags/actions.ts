"use server";
// Server Actions dla tagów: tworzenie i usuwanie.
// Tworzyć może user z uprawnieniem `tags.create` (default: ADMIN, MASTER).
// Usuwać może user z `tags.delete` (default: MASTER).

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasPermission, type Role } from "@/lib/auth/permissions";
import { slugify, randomTagColor } from "./utils";
import type { TagInfo } from "./types";

export async function createTag(
  rawName: string
): Promise<{ tag?: TagInfo; error?: string }> {
  const name = rawName.trim();

  // Walidacja
  if (name.length < 2) return { error: "Tag musi mieć minimum 2 znaki." };
  if (name.length > 50) return { error: "Tag może mieć max 50 znaków." };

  const slug = slugify(name);
  if (!slug || slug.length < 2) {
    return { error: "Nazwa tagu nie nadaje się do generowania slug-u (zbyt dużo znaków specjalnych)." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Musisz być zalogowany." };

  // Sprawdzamy uprawnienie
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, permissions")
    .eq("id", user.id)
    .single<{ role: Role; permissions: string[] | null }>();

  if (!hasPermission(profile, "tags.create")) {
    return { error: "Nie masz uprawnień do tworzenia tagów. Skontaktuj się z adminem." };
  }

  const color = randomTagColor();

  const { data: tag, error } = await supabase
    .from("tags")
    .insert({
      name,
      slug,
      color,
      created_by_id: user.id,
    })
    .select("id, name, slug, color")
    .single<TagInfo>();

  if (error) {
    if (error.code === "23505") {
      return { error: "Tag o tej nazwie już istnieje." };
    }
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { tag };
}

export async function deleteTag(
  tagId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, permissions")
    .eq("id", user.id)
    .single<{ role: Role; permissions: string[] | null }>();

  if (!hasPermission(profile, "tags.delete")) {
    return { error: "Nie masz uprawnień do usuwania tagów." };
  }

  // Admin client — bypass RLS po sprawdzeniu uprawnień
  const admin = createAdminClient();
  const { error } = await admin.from("tags").delete().eq("id", tagId);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}
