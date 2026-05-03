"use server";
// Server Actions dla postów: tworzenie, edycja, usuwanie.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, extractStoragePath } from "@/lib/supabase/admin";
import { POST_EDIT_WINDOW_MS } from "./permissions";
import { hasPermission, type Role } from "@/lib/auth/permissions";

export type PostFormState = { error?: string } | null;

// ─── Walidacja podstawowa pól formularza ─────────────────────
function validatePostFields(title: string, content: string): string | null {
  if (!title || !content) return "Tytuł i treść są wymagane.";
  if (title.length > 200) return "Tytuł może mieć maksymalnie 200 znaków.";
  if (content.length > 50000) return "Treść jest zbyt długa (max 50 000 znaków).";
  return null;
}

// ════════════════════════════════════════════════════════════════
//  CREATE
// ════════════════════════════════════════════════════════════════
export async function createPost(
  _prev: PostFormState,
  formData: FormData
): Promise<PostFormState> {
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const imageUrlRaw = (formData.get("imageUrl") as string)?.trim();
  const imageUrl = imageUrlRaw && imageUrlRaw.length > 0 ? imageUrlRaw : null;

  const validationError = validatePostFields(title, content);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const { data: post, error } = await supabase
    .from("posts")
    .insert({ title, content, image_url: imageUrl, author_id: user.id })
    .select("id")
    .single();

  if (error || !post) {
    return { error: error?.message ?? "Nie udało się zapisać posta." };
  }

  revalidatePath("/");
  redirect(`/posty/${post.id}`);
}

// ════════════════════════════════════════════════════════════════
//  UPDATE — tylko autor, tylko w oknie 30 min
// ════════════════════════════════════════════════════════════════
export async function updatePost(
  _prev: PostFormState,
  formData: FormData
): Promise<PostFormState> {
  const id = formData.get("id") as string;
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const imageUrlRaw = (formData.get("imageUrl") as string)?.trim();
  const imageUrl = imageUrlRaw && imageUrlRaw.length > 0 ? imageUrlRaw : null;

  if (!id) return { error: "Brak ID posta." };
  const validationError = validatePostFields(title, content);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Musisz być zalogowany." };

  // Sprawdzamy istnienie + autorstwo + czas
  const { data: existing, error: fetchErr } = await supabase
    .from("posts")
    .select("id, author_id, created_at, image_url")
    .eq("id", id)
    .single();

  if (fetchErr || !existing) return { error: "Post nie istnieje." };
  if (existing.author_id !== user.id) {
    return { error: "Możesz edytować tylko swoje posty." };
  }
  const ageMs = Date.now() - new Date(existing.created_at).getTime();
  if (ageMs > POST_EDIT_WINDOW_MS) {
    return { error: "Czas na edycję upłynął (30 minut od publikacji)." };
  }

  // Update — RLS i tak by sprawdziło autorstwo, ale walidujemy w kodzie dla
  // czytelnego komunikatu błędu i sprawdzenia okna czasowego.
  const { error: updateErr } = await supabase
    .from("posts")
    .update({
      title,
      content,
      image_url: imageUrl,
      edited_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) return { error: updateErr.message };

  // Jeśli zmieniliśmy zdjęcie, usuwamy stare z Storage (opcjonalne sprzątanie)
  if (existing.image_url && existing.image_url !== imageUrl) {
    const path = extractStoragePath(existing.image_url, "post-images");
    if (path) {
      const admin = createAdminClient();
      await admin.storage.from("post-images").remove([path]);
    }
  }

  revalidatePath("/");
  revalidatePath(`/posty/${id}`);
  redirect(`/posty/${id}`);
}

// ════════════════════════════════════════════════════════════════
//  DELETE — autor zawsze, admin/master moderacyjnie
// ════════════════════════════════════════════════════════════════
export async function deletePost(
  postId: string
): Promise<{ error?: string } | undefined> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Musisz być zalogowany." };

  // Pobieramy post + profil zalogowanego usera (rola, permissions)
  const [{ data: post }, { data: profile }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, author_id, image_url")
      .eq("id", postId)
      .single(),
    supabase
      .from("profiles")
      .select("id, role, permissions")
      .eq("id", user.id)
      .single<{ id: string; role: Role; permissions: string[] | null }>(),
  ]);

  if (!post) return { error: "Post nie istnieje." };
  if (!profile) return { error: "Profil nie znaleziony." };

  const isAuthor = post.author_id === user.id;
  const isModerator = hasPermission(profile, "posts.delete");
  if (!isAuthor && !isModerator) {
    return { error: "Nie masz uprawnień do usunięcia tego posta." };
  }

  // Używamy admin clienta (bypass RLS) — bezpiecznie, bo właśnie sprawdziliśmy
  // uprawnienia w kodzie. RLS by zablokowała admin/master (polityka pozwala
  // tylko autorowi), więc nie da się tego zrobić przez zwykły client.
  const admin = createAdminClient();

  // Usuń zdjęcie z Storage jeśli istniało
  if (post.image_url) {
    const path = extractStoragePath(post.image_url, "post-images");
    if (path) await admin.storage.from("post-images").remove([path]);
  }

  // Usuń wpis posta
  const { error } = await admin.from("posts").delete().eq("id", postId);
  if (error) return { error: error.message };

  revalidatePath("/");
  redirect("/");
}
