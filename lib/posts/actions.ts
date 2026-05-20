"use server";
// Server Actions dla postów: tworzenie, edycja, usuwanie, lajkowanie + obsługa tagów.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, extractStoragePath } from "@/lib/supabase/admin";
import { POST_EDIT_WINDOW_MS } from "./permissions";
import { hasPermission, type Role } from "@/lib/auth/permissions";

export type PostFormState = { error?: string } | null;

function validatePostFields(title: string, content: string): string | null {
  if (!title || !content) return "Tytuł i treść są wymagane.";
  if (title.length > 200) return "Tytuł może mieć maksymalnie 200 znaków.";
  if (content.length > 50000) return "Treść jest zbyt długa (max 50 000 znaków).";
  return null;
}

// Parsuje JSON string z formData (array tag IDs). Bezpiecznie zwraca [] w razie błędu.
function parseTagIds(raw: FormDataEntryValue | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string")) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return [];
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
  const tagIds = parseTagIds(formData.get("tags"));

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

  // Podpinamy tagi (jeśli wybrane). RLS post_tags pozwala bo jesteśmy autorem posta.
  if (tagIds.length > 0) {
    const tagInserts = tagIds.map((tagId) => ({
      post_id: post.id,
      tag_id: tagId,
    }));
    await supabase.from("post_tags").insert(tagInserts);
  }

  revalidatePath("/");
  redirect(`/posty/${post.id}?flash=post_created`);
}

// ════════════════════════════════════════════════════════════════
//  UPDATE
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
  const tagIds = parseTagIds(formData.get("tags"));

  if (!id) return { error: "Brak ID posta." };
  const validationError = validatePostFields(title, content);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Musisz być zalogowany." };

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

  // Aktualizacja tagów — wipe & reinsert. Proste i niezawodne.
  await supabase.from("post_tags").delete().eq("post_id", id);
  if (tagIds.length > 0) {
    const tagInserts = tagIds.map((tagId) => ({ post_id: id, tag_id: tagId }));
    await supabase.from("post_tags").insert(tagInserts);
  }

  if (existing.image_url && existing.image_url !== imageUrl) {
    const path = extractStoragePath(existing.image_url, "post-images");
    if (path) {
      const admin = createAdminClient();
      await admin.storage.from("post-images").remove([path]);
    }
  }

  revalidatePath("/");
  revalidatePath(`/posty/${id}`);
  redirect(`/posty/${id}?flash=post_updated`);
}

// ════════════════════════════════════════════════════════════════
//  DELETE
// ════════════════════════════════════════════════════════════════
export async function deletePost(
  postId: string
): Promise<{ error?: string } | undefined> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Musisz być zalogowany." };

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

  const admin = createAdminClient();
  if (post.image_url) {
    const path = extractStoragePath(post.image_url, "post-images");
    if (path) await admin.storage.from("post-images").remove([path]);
  }

  const { error } = await admin.from("posts").delete().eq("id", postId);
  if (error) return { error: error.message };

  revalidatePath("/");
  redirect("/?flash=post_deleted");
}

// ════════════════════════════════════════════════════════════════
//  TOGGLE LIKE
// ════════════════════════════════════════════════════════════════
export async function togglePostLike(
  postId: string
): Promise<{ liked: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { liked: false, error: "Musisz być zalogowany aby lajkować." };

  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .single<{ author_id: string }>();

  if (!post) return { liked: false, error: "Post nie istnieje." };
  if (post.author_id === user.id) {
    return { liked: false, error: "Nie możesz polubić swojego posta." };
  }

  const { data: existing } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) return { liked: true, error: error.message };
    revalidatePath("/");
    revalidatePath(`/posty/${postId}`);
    return { liked: false };
  }

  const { error } = await supabase
    .from("post_likes")
    .insert({ post_id: postId, user_id: user.id });

  if (error) return { liked: false, error: error.message };
  revalidatePath("/");
  revalidatePath(`/posty/${postId}`);
  return { liked: true };
}
