// System uprawnień (RBAC z nadpisaniem per-user).
// Trzy poziomy: rola (MASTER/ADMIN/USER) + dodatkowe permissions[] na profilu.
// MASTER ma "*" — wszystko. Pozostali mają to co w ROLE_PERMISSIONS lub
// w swoim permissions[]. Dodanie nowej roli = jedna linia tutaj. Dodanie
// nowego uprawnienia = jeden string w odpowiednim miejscu.

export type Role = "MASTER" | "ADMIN" | "USER";

// Domyślne uprawnienia per rola.
// Dorzucanie nowych uprawnień: dopisz tu konkretny string, użyj go w hasPermission().
export const ROLE_PERMISSIONS: Record<Role, readonly string[]> = {
  MASTER: ["*"], // wildcard — wszystkie uprawnienia
  ADMIN: [
    "posts.delete",      // moderacja postów (kasowanie cudzych)
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

export type ProfileForPermissions = {
  role: Role;
  permissions?: string[] | null;
};

// Sprawdza czy profil ma konkretne uprawnienie.
// Logika: MASTER zawsze TAK; pozostali — sprawdzamy permissions[] usera
// (per-user override) i ROLE_PERMISSIONS dla jego roli.
export function hasPermission(
  profile: ProfileForPermissions | null | undefined,
  permission: string
): boolean {
  if (!profile) return false;
  if (profile.role === "MASTER") return true;
  if (profile.permissions?.includes(permission)) return true;
  return ROLE_PERMISSIONS[profile.role]?.includes(permission) ?? false;
}
