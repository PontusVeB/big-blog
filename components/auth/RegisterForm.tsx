"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { register, type AuthState } from "@/lib/auth/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary auth-submit">
      {pending ? "Tworzenie konta..." : "Załóż konto"}
    </button>
  );
}

export default function RegisterForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(register, null);

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
          autoComplete="new-password"
          minLength={6}
          className="input"
          placeholder="minimum 6 znaków"
        />
        <div className="field-help">Wybierz mocne hasło. Min. 6 znaków.</div>
      </div>

      {state?.error && <div className="auth-error">{state.error}</div>}

      <SubmitButton />
    </form>
  );
}
