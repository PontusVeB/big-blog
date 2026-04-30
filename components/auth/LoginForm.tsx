"use client";
// Formularz logowania — komponent kliencki (potrzebuje stanu i akcji).

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type AuthState } from "@/lib/auth/actions";

// Przycisk submit z animacją "ładowania" — useFormStatus czyta stan formularza
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary auth-submit">
      {pending ? "Logowanie..." : "Zaloguj się"}
    </button>
  );
}

export default function LoginForm() {
  // useActionState — React 19 hook do form actions z błędami i stanem
  const [state, formAction] = useActionState<AuthState, FormData>(login, null);

  return (
    <form action={formAction} className="auth-form">
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
          placeholder="twoj@email.pl"
        />
      </div>
      <div className="field">
        <label htmlFor="password">Hasło</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          minLength={6}
          className="input"
          placeholder="••••••••"
        />
      </div>

      {state?.error && <div className="auth-error">{state.error}</div>}

      <SubmitButton />
    </form>
  );
}
