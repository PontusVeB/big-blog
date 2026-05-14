"use server";
// Server Actions dla komentarzy — generyczne, działają z każdym
// "target_type" (na razie tylko POST, w przyszłości EVENT, RECIPE, ...).

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasPermission, type Role } from "@/lib/auth/permissions";
import {
  COMMENT_EDIT_WINDOW_MS,
  MAX_COMMENT_DEPTH,
} from "./permissions";
import type { CommentTargetType } from "./types";

export type CommentFormState = { error?: string } | null;

// Ścieżka do revalidate w zależności od typu obiektu.
// Dla POST komentarze siedzą na /posty/[id]. Gdy dorzucisz EVENT — dodaj case.
function getTargetPath(targetType: CommentTargetType, targetId: string): string {
  switch (targetType) {
    case "POST":
      return `/posty/${targetId}`;
    // case "EVENT": return `/wydarzenia/${targetId}`;
  }
}

function validateContent(content: string): string | null {
  if (!content || content.length === 0) return "Treść komentarza nie może być pusta.";
  if (content.length > 2000) return "Komentarz jest zbyt długi (max 2000 znaków).";
  return null;
}

// ════════════════════════════════════════════════════════════════
//  CREATE COMMENT
// ════════════════════════════════════════════════════════════════
export async function createComment(
  _prev: CommentFormState,
  formData: FormData
): Promise<CommentFormState> {
  const targetType = formData.get("targetType") as CommentTargetType;
  const targetId = formData.get("targetId") as string;
  const content = (formData.get("content") as string)?.trim();
  const parentIdRaw = (formData.get("parentId") as string)?.trim();
  const parentId = parentIdRaw && parentIdRaw.length > 0 ? parentIdRaw : null;

  if (!targetType || !targetId) return { error: "Brak danych celu komentarza." };

  const validationError = validateContent(content);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Musisz być zalogowany, aby skomentować." };

  let depth = 0;
  if (parentId) {
    // Sprawdzamy depth rodzica + ograniczenie głębokości
    const { data: parent } = await supabase
      .from("comments")
      .select("depth, target_type, target_id")
      .eq("id", parentId)
      .single<{ depth: number; target_type: string; target_id: string }>();

    if (!parent) return { error: "Komentarz, do którego odpowiadasz, nie istnieje." };
    if (parent.target_type !== targetType || parent.target_id !== targetId) {
      return { error: "Niezgodność celu odpowiedzi." };
    }
    if (parent.depth >= MAX_COMMENT_DEPTH) {
      return { error: "Osiągnięto maksymalną głębokość zagnieżdżenia." };
    }
    depth = parent.depth + 1;
  }

  const { error } = await supabase.from("comments").insert({
    target_type: targetType,
    target_id: targetId,
    author_id: user.id,
    content,
    parent_id: parentId,
    depth,
  });

  if (error) return { error: error.message };

  revalidatePath(getTargetPath(targetType, targetId));
  return null; // success — formularz się zresetuje
}

// ════════════════════════════════════════════════════════════════
//  UPDATE COMMENT — tylko autor, w oknie 15 min
// ════════════════════════════════════════════════════════════════
export async function updateComment(
  commentId: string,
  newContent: string
): Promise<{ error?: string } | undefined> {
  const content = newContent.trim();
  const validationError = validateContent(content);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const { data: existing } = await supabase
    .from("comments")
    .select("id, author_id, created_at, is_deleted, target_type, target_id")
    .eq("id", commentId)
    .single<{
      id: string;
      author_id: string;
      created_at: string;
      is_deleted: boolean;
      target_type: CommentTargetType;
      target_id: string;
    }>();

  if (!existing) return { error: "Komentarz nie istnieje." };
  if (existing.is_deleted) return { error: "Komentarz został usunięty." };
  if (existing.author_id !== user.id) {
    return { error: "Możesz edytować tylko swoje komentarze." };
  }
  const ageMs = Date.now() - new Date(existing.created_at).getTime();
  if (ageMs > COMMENT_EDIT_WINDOW_MS) {
    return { error: "Czas na edycję upłynął (15 minut)." };
  }

  const { error } = await supabase
    .from("comments")
    .update({
      content,
      edited_at: new Date().toISOString(),
    })
    .eq("id", commentId);

  if (error) return { error: error.message };

  revalidatePath(getTargetPath(existing.target_type, existing.target_id));
}

// ════════════════════════════════════════════════════════════════
//  DELETE COMMENT (soft) — autor lub admin z comments.delete
// ════════════════════════════════════════════════════════════════
// Soft delete: ustawiamy is_deleted=true i czyścimy content. Wątek dzieci
// pozostaje widoczny — w UI pokazujemy "[komentarz usunięty]".
export async function deleteComment(
  commentId: string
): Promise<{ error?: string } | undefined> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const [{ data: comment }, { data: profile }] = await Promise.all([
    supabase
      .from("comments")
      .select("id, author_id, target_type, target_id, is_deleted")
      .eq("id", commentId)
      .single<{
        id: string;
        author_id: string;
        target_type: CommentTargetType;
        target_id: string;
        is_deleted: boolean;
      }>(),
    supabase
      .from("profiles")
      .select("id, role, permissions")
      .eq("id", user.id)
      .single<{ id: string; role: Role; permissions: string[] | null }>(),
  ]);

  if (!comment) return { error: "Komentarz nie istnieje." };
  if (comment.is_deleted) return; // już usunięty — sukces no-op
  if (!profile) return { error: "Profil nie znaleziony." };

  const isAuthor = comment.author_id === user.id;
  const isModerator = hasPermission(profile, "comments.delete");
  if (!isAuthor && !isModerator) {
    return { error: "Nie masz uprawnień do usunięcia tego komentarza." };
  }

  // Admin client bypassuje RLS — używamy go gdy moderator usuwa cudze
  // (RLS UPDATE pozwala tylko autorowi). Dla autora też używamy admina
  // dla spójności kodu — i tak właśnie sprawdziliśmy uprawnienia ręcznie.
  const admin = createAdminClient();
  const { error } = await admin
    .from("comments")
    .update({
      is_deleted: true,
      content: "", // wymazujemy treść — anonimizacja
    })
    .eq("id", commentId);

  if (error) return { error: error.message };

  revalidatePath(getTargetPath(comment.target_type, comment.target_id));
}
