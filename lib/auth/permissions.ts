// System uprawnień (RBAC z nadpisaniem per-user).
// Faza 22: dodano rolę BLOGER (= USER + posts.create).
// posts.create stało się realnym uprawnieniem — egzekwowanym w 3 warstwach.

export type Role = "MASTER" | "ADMIN" | "BLOGER" | "USER";

// Domyślne uprawnienia per rola.
// MASTER ma "*" — wildcard (hasPermission zwraca true dla wszystkiego).
export const ROLE_PERMISSIONS: Record<Role, readonly string[]> = {
  MASTER: ["*"],
  ADMIN: [
    "posts.create",      // tworzenie postów
    "posts.delete",      // moderacja postów
    "comments.delete",   // moderacja komentarzy
    "users.view",        // widoczność panelu użytkowników
    "tags.create",       // tworzenie tagów
    "tags.delete",       // usuwanie tagów
  ],
  // BLOGER: piszę posty i komentuję — pełny twórca treści bez moderacji
  BLOGER: [
    "posts.create",      // tworzenie postów
    "posts.editOwn",     // edycja własnych postów (do 30 min)
    "posts.deleteOwn",   // usuwanie własnych postów
    "comments.create",   // dodawanie komentarzy
  ],
  // USER: komentuje i lajkuje, NIE tworzy postów
  // posts.editOwn / posts.deleteOwn zachowane na wypadek demotion z BLOGER
  USER: [
    "posts.editOwn",
    "posts.deleteOwn",
    "comments.create",
  ],
} as const;

// Uprawnienia które MASTER może nadawać/odbierać konkretnej osobie w panelu admina.
// posts.create tu jest: MASTER może dać wyjątkowo jednemu USER-owi prawo postowania
// bez awansowania go na BLOGER-a.
export const AVAILABLE_PERMISSIONS = [
  "posts.create",
  "posts.delete",
  "comments.delete",
  "users.view",
  "tags.create",
  "tags.delete",
] as const;

export type AvailablePermission = typeof AVAILABLE_PERMISSIONS[number];

export const PERMISSION_LABELS: Record<AvailablePermission, string> = {
  "posts.create":   "Tworzenie postów",
  "posts.delete":   "Usuwanie postów",
  "comments.delete":"Usuwanie komentarzy",
  "users.view":     "Dostęp do panelu użytkowników",
  "tags.create":    "Tworzenie tagów",
  "tags.delete":    "Usuwanie tagów",
};

export const PERMISSION_DESCRIPTIONS: Record<AvailablePermission, string> = {
  "posts.create":    "Może tworzyć nowe posty (wyjątek per-user dla roli USER).",
  "posts.delete":    "Może usuwać posty innych użytkowników (moderacja).",
  "comments.delete": "Może usuwać komentarze innych użytkowników (moderacja).",
  "users.view":      "Może wejść w panel /admin i podglądać użytkowników.",
  "tags.create":     "Może tworzyć nowe tagi tematyczne (dla wszystkich postów).",
  "tags.delete":     "Może usuwać istniejące tagi z bazy.",
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
