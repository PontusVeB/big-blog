"use client";
// Globalny "flash toast" — łapie parametr ?flash=X z URL i pokazuje odpowiedni
// toast po przekierowaniu z Server Action. Po pokazaniu czyści URL.
//
// Działa to tak:
// 1. Server Action po sukcesie wywołuje redirect(`/sciezka?flash=post_created`)
// 2. Strona docelowa renderuje się z parametrem w URL
// 3. Ten komponent (w root layoucie) wykrywa parametr przez useSearchParams
// 4. Wystrzeliwuje toast z odpowiedniej wiadomości
// 5. Usuwa flash z URL (router.replace) żeby F5 nie wywoływało toasta znowu

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

type FlashConfig = {
  type: "success" | "error" | "info";
  text: string;
  description?: string;
};

// Słownik komunikatów. Dorzucanie nowych — dopisz klucz + treść.
// Klucz używany w Server Action: redirect(`/?flash=NAZWA_KLUCZA`)
const FLASHES: Record<string, FlashConfig> = {
  post_created:    { type: "success", text: "Post opublikowany 🎉", description: "Dziel się dalej!" },
  post_updated:    { type: "success", text: "Post zaktualizowany" },
  post_deleted:    { type: "info",    text: "Post usunięty" },
  profile_saved:   { type: "success", text: "Profil zaktualizowany" },
  logged_in:       { type: "success", text: "Zalogowano" },
  logged_out:      { type: "info",    text: "Wylogowano" },
  registered:      { type: "success", text: "Witaj w Tollerkowie! 🐕", description: "Konto utworzone, możesz pisać posty." },
};

export default function ToastFlash() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const flash = searchParams.get("flash");
    if (!flash) return;

    const config = FLASHES[flash];
    if (config) {
      const fn =
        config.type === "success"
          ? toast.success
          : config.type === "error"
          ? toast.error
          : toast;
      fn(config.text, { description: config.description });
    }

    // Usuwamy "flash" z URL bez przeładowania strony (replace zamiast push)
    const cleaned = new URLSearchParams(searchParams.toString());
    cleaned.delete("flash");
    const queryString = cleaned.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, router, pathname]);

  return null;
}
