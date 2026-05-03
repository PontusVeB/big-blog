// Admin client Supabase — używa SERVICE_ROLE_KEY i BYPASSUJE RLS.
//
// ⚠️  UŻYWAĆ TYLKO W SERVER ACTIONS PO SPRAWDZENIU UPRAWNIEŃ.
//     Nigdy nie eksponować na klienta. SERVICE_ROLE_KEY ma pełny dostęp do bazy.
//
// Po co? Czasami potrzebujemy operacji, których RLS by nie pozwolił:
//   - admin moderuje cudzy post (RLS pozwala tylko autorowi)
//   - kasowanie pliku z innego folderu w Storage
//   - operacje administracyjne na auth.users
// W takim wypadku w Server Action sprawdzamy uprawnienia w kodzie (hasPermission)
// i jeśli OK — używamy admin clienta.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}

// Wyciąga ścieżkę pliku z publicznego URL Supabase Storage.
// Np. https://xyz.supabase.co/storage/v1/object/public/post-images/USERID/abc.jpg
//   → "USERID/abc.jpg"
export function extractStoragePath(publicUrl: string, bucket: string): string | null {
  const marker = `/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}
