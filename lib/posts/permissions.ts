// Reguły domenowe dla postów: kto i kiedy może edytować/usuwać.

import { hasPermission, type ProfileForPermissions } from "@/lib/auth/permissions";

// Okno na edycję posta od momentu publikacji.
// Po tym czasie post jest "publiczny na zawsze" — bez retroaktywnych zmian.
export const POST_EDIT_WINDOW_MS = 30 * 60 * 1000; // 30 minut

export type PostForPermissions = {
  author_id: string;
  created_at: string;
};

// Czy user może edytować ten post?
// Tylko autor + tylko jeśli post jest młodszy niż POST_EDIT_WINDOW_MS.
export function canEditPost(
  profile: (ProfileForPermissions & { id: string }) | null,
  post: PostForPermissions
): boolean {
  if (!profile) return false;
  if (profile.id !== post.author_id) return false;
  const ageMs = Date.now() - new Date(post.created_at).getTime();
  return ageMs <= POST_EDIT_WINDOW_MS;
}

// Czy user może usunąć ten post?
// Autor: zawsze może swój. Admin/master: każdy (uprawnienie posts.delete).
export function canDeletePost(
  profile: (ProfileForPermissions & { id: string }) | null,
  post: PostForPermissions
): boolean {
  if (!profile) return false;
  if (profile.id === post.author_id) return true;
  return hasPermission(profile, "posts.delete");
}

// Ile sekund zostało na edycję? (0 jeśli czas minął)
export function editWindowRemainingSec(post: PostForPermissions): number {
  const expires = new Date(post.created_at).getTime() + POST_EDIT_WINDOW_MS;
  return Math.max(0, Math.floor((expires - Date.now()) / 1000));
}
