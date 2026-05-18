"use server";
// Server Actions dla logowania przez OAuth (Google, Facebook).
// Zwracamy URL który klient potem ustawia jako window.location.href.
// Supabase generuje dla nas URL do strony auth providera (np. accounts.google.com).

import { createClient } from "@/lib/supabase/server";

export type OAuthProvider = "google" | "facebook";

export async function signInWithOAuth(
  provider: OAuthProvider
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      // Po zalogowaniu Supabase przekieruje tutaj — nasz callback handler
      // wymieni "code" na sesję i finalnie przekieruje na home.
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) return { error: error.message };
  if (!data.url) return { error: "Brak URL z OAuth providera." };
  return { url: data.url };
}
