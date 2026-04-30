import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Logowanie • Big Blog",
};

export default async function LoginPage() {
  // Jeśli user już zalogowany, przekierowujemy go na stronę główną
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Logowanie</h1>
        <p className="auth-subtitle">Wpisz swój email i hasło, aby się zalogować.</p>
        <LoginForm />
        <div className="auth-footer">
          Nie masz konta?{" "}
          <Link href="/rejestracja">Zarejestruj się</Link>
        </div>
      </div>
    </div>
  );
}
