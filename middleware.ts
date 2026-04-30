// Middleware Next.js — uruchamiane przed każdym requestem.
// Tutaj wywołujemy odświeżanie sesji Supabase.
// Plik MUSI być w korzeniu projektu (obok package.json), żeby Next.js go znalazł.

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Middleware działa na wszystkich ścieżkach OPRÓCZ:
     * - _next/static  (pliki statyczne Next.js)
     * - _next/image   (zoptymalizowane obrazki)
     * - favicon.ico
     * - obrazki (svg, png, jpg, jpeg, gif, webp)
     * Dzięki temu nie spowalniamy ładowania assetów.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
