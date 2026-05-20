// System uprawnień (RBAC z nadpisaniem per-user).

export type Role = "MASTER" | "ADMIN" | "USER";

export const ROLE_PERMISSIONS: Record<Role, readonly string[]> = {
  MASTER: ["*"],
  ADMIN: [
    "posts.delete",
    "comments.delete",
    "users.view",
    "tags.create",   // admin tworzy tagi domyślnie
  ],
  USER: [
    "posts.create",
    "posts.editOwn",
    "posts.deleteOwn",
    "comments.create",
  ],
} as const;

export const AVAILABLE_PERMISSIONS = [
  "posts.delete",
  "comments.delete",
  "users.view",
  "tags.create",
  "tags.delete",
] as const;

export type AvailablePermission = typeof AVAILABLE_PERMISSIONS[number];

export const PERMISSION_LABELS: Record<AvailablePermission, string> = {
  "posts.delete": "Usuwanie postów",
  "comments.delete": "Usuwanie komentarzy",
  "users.view": "Dostęp do panelu użytkowników",
  "tags.create": "Tworzenie tagów",
  "tags.delete": "Usuwanie tagów",
};

export const PERMISSION_DESCRIPTIONS: Record<AvailablePermission, string> = {
  "posts.delete": "Może usuwać posty innych użytkowników (moderacja).",
  "comments.delete": "Może usuwać komentarze innych użytkowników (moderacja).",
  "users.view": "Może wejść w panel /admin i podglądać użytkowników.",
  "tags.create": "Może tworzyć nowe tagi tematyczne (dla wszystkich postów).",
  "tags.delete": "Może usuwać istniejące tagi z bazy.",
};

export type ProfileForPermissions = {
  role: Role;
  permissions?: string[] | null;
};

export function hasPermission(
  profile: ProfileForPermissions | null | undefined,
  permission: string
): boolean {
  if (!profile) return false;
  if (profile.role === "MASTER") return true;
  if (profile.permissions?.includes(permission)) return true;
  return ROLE_PERMISSIONS[profile.role]?.includes(permission) ?? false;
}
