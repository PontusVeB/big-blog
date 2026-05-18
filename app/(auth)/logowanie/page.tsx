import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "@/components/auth/LoginForm";
import OAuthButtons from "@/components/auth/OAuthButtons";

export const metadata: Metadata = {
  title: "Logowanie",
};

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Logowanie</h1>
        <p className="auth-subtitle">Wybierz sposób, w jaki chcesz się zalogować.</p>

        <OAuthButtons />

        <div className="auth-divider">
          <span>lub email i hasło</span>
        </div>

        <LoginForm />

        <div className="auth-footer">
          Nie masz konta?{" "}
          <Link href="/rejestracja">Zarejestruj się</Link>
        </div>
      </div>
    </div>
  );
}
