// System uprawnień (RBAC z nadpisaniem per-user).

export type Role = "MASTER" | "ADMIN" | "USER";

// Domyślne uprawnienia per rola.
// MASTER ma "*" — wildcard (hasPermission zwraca true dla wszystkiego).
export const ROLE_PERMISSIONS: Record<Role, readonly string[]> = {
  MASTER: ["*"],
  ADMIN: [
    "posts.delete",      // moderacja postów
    "comments.delete",   // moderacja komentarzy
    "users.view",        // widoczność panelu użytkowników
  ],
  USER: [
    "posts.create",
    "posts.editOwn",
    "posts.deleteOwn",
    "comments.create",
  ],
} as const;

// Lista uprawnień jakie MASTER może nadawać "ekstra" konkretnemu userowi
// przez panel admina (poza domyślnymi z roli). USER z "posts.delete" może
// moderować posty bez bycia ADMINEM.
export const AVAILABLE_PERMISSIONS = [
  "posts.delete",
  "comments.delete",
  "users.view",
] as const;

export type AvailablePermission = typeof AVAILABLE_PERMISSIONS[number];

export const PERMISSION_LABELS: Record<AvailablePermission, string> = {
  "posts.delete": "Usuwanie postów",
  "comments.delete": "Usuwanie komentarzy",
  "users.view": "Dostęp do panelu użytkowników",
};

export const PERMISSION_DESCRIPTIONS: Record<AvailablePermission, string> = {
  "posts.delete": "Może usuwać posty innych użytkowników (moderacja).",
  "comments.delete": "Może usuwać komentarze innych użytkowników (moderacja).",
  "users.view": "Może wejść w panel /admin i podglądać użytkowników.",
};

export type ProfileForPermissions = {
  role: Role;
  permissions?: string[] | null;
};

// Sprawdza czy profil ma konkretne uprawnienie.
// MASTER zawsze TAK; inni — z roli lub z permissions[].
export function hasPermission(
  profile: ProfileForPermissions | null | undefined,
  permission: string
): boolean {
  if (!profile) return false;
  if (profile.role === "MASTER") return true;
  if (profile.permissions?.includes(permission)) return true;
  return ROLE_PERMISSIONS[profile.role]?.includes(permission) ?? false;
}
