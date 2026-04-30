import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Rejestracja • Big Blog",
};

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Rejestracja</h1>
        <p className="auth-subtitle">Załóż darmowe konto w 30 sekund.</p>
        <RegisterForm />
        <div className="auth-footer">
          Masz już konto?{" "}
          <Link href="/logowanie">Zaloguj się</Link>
        </div>
      </div>
    </div>
  );
}
