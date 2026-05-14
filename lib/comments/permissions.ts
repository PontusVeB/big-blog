// Reguły domenowe dla komentarzy.

import { hasPermission, type ProfileForPermissions } from "@/lib/auth/permissions";

// Okno na edycję komentarza — krótsze niż dla posta (15 min).
// Komentarze są bardziej "rozmowne", po 15 minutach kontekst już ucieka.
export const COMMENT_EDIT_WINDOW_MS = 15 * 60 * 1000;

// Maksymalna głębokość zagnieżdżania (0 = top-level, 5 = piąta odpowiedź wgłąb).
// Po przekroczeniu — nowy komentarz musi być pod wcześniejszym poziomem.
export const MAX_COMMENT_DEPTH = 5;

export type CommentForPermissions = {
  author_id: string;
  created_at: string;
  is_deleted: boolean;
};

// Czy user może edytować ten komentarz?
// Tylko autor + tylko jeśli komentarz jest młodszy niż 15 min + nie jest usunięty.
export function canEditComment(
  profile: (ProfileForPermissions & { id: string }) | null,
  comment: CommentForPermissions
): boolean {
  if (!profile) return false;
  if (comment.is_deleted) return false;
  if (profile.id !== comment.author_id) return false;
  const ageMs = Date.now() - new Date(comment.created_at).getTime();
  return ageMs <= COMMENT_EDIT_WINDOW_MS;
}

// Czy user może usunąć ten komentarz?
// Autor: zawsze może swój. Admin/master: każdy (uprawnienie comments.delete).
export function canDeleteComment(
  profile: (ProfileForPermissions & { id: string }) | null,
  comment: CommentForPermissions
): boolean {
  if (!profile) return false;
  if (comment.is_deleted) return false;
  if (profile.id === comment.author_id) return true;
  return hasPermission(profile, "comments.delete");
}
