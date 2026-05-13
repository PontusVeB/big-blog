"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string } | null;

// ─── Logowanie email + hasło ───────────────────────────────────────
export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email i hasło są wymagane." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/?flash=logged_in");
}

// ─── Rejestracja ─────────────────────────────────────────────────
export async function register(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email i hasło są wymagane." };
  }
  if (password.length < 6) {
    return { error: "Hasło musi mieć minimum 6 znaków." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/?flash=registered");
}

// ─── Wylogowanie ─────────────────────────────────────────────────
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/?flash=logged_out");
}

function translateAuthError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Niepoprawny email lub hasło.";
  if (msg.includes("User already registered")) return "Konto z tym adresem już istnieje. Spróbuj się zalogować.";
  if (msg.includes("Password should be at least")) return "Hasło musi mieć minimum 6 znaków.";
  if (msg.includes("Email not confirmed")) return "Potwierdź swój email — sprawdź skrzynkę.";
  if (msg.includes("rate limit")) return "Za dużo prób. Spróbuj za chwilę.";
  return msg;
}
