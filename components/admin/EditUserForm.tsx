"use client";
// Inline formularz edycji jednego usera (rozwija się pod jego wierszem).
// Pozwala zmienić rolę USER ↔ ADMIN i toggle uprawnień z whitelisty.

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AVAILABLE_PERMISSIONS,
  PERMISSION_LABELS,
  PERMISSION_DESCRIPTIONS,
  ROLE_PERMISSIONS,
  type Role,
} from "@/lib/auth/permissions";
import { updateUser } from "@/lib/admin/actions";

type Props = {
  user: {
    id: string;
    nickname: string | null;
    email: string;
    role: Role;
    permissions: string[] | null;
  };
  onSaved: () => void;
  onCancel: () => void;
};

export default function EditUserForm({ user, onSaved, onCancel }: Props) {
  // MASTER excluded — w UI userzy z MASTER mają inline lock, nie dochodzi tu nigdy
  const [role, setRole] = useState<"USER" | "ADMIN">(
    user.role === "ADMIN" ? "ADMIN" : "USER"
  );
  const [permissions, setPermissions] = useState<string[]>(
    user.permissions ?? []
  );
  const [pending, startTransition] = useTransition();

  function togglePermission(perm: string) {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateUser(user.id, role, permissions);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Zmiany zapisane");
        onSaved();
      }
    });
  }

  // Domyślne uprawnienia z wybranej roli — pokazujemy info-tag
  const rolePermissions = ROLE_PERMISSIONS[role] ?? [];

  return (
    <div className="admin-edit-form">
      <h4>Edytuj: {user.nickname ?? user.email}</h4>

      <div className="admin-edit-field">
        <label>Rola</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "USER" | "ADMIN")}
          className="input"
        >
          <option value="USER">USER (regularny)</option>
          <option value="ADMIN">ADMIN (moderator)</option>
        </select>
        <div className="admin-edit-help">
          MASTER można nadać tylko bezpośrednio w bazie (SQL Editor Supabase).
          Po zmianie roli na ADMIN automatycznie dostaje wszystkie uprawnienia
          moderacji.
        </div>
      </div>

      <div className="admin-edit-field">
        <label>Dodatkowe uprawnienia (extra do roli)</label>
        <div className="permissions-list">
          {AVAILABLE_PERMISSIONS.map((perm) => {
            const fromRole = rolePermissions.includes(perm);
            const explicit = permissions.includes(perm);
            return (
              <label key={perm} className="permission-checkbox">
                <input
                  type="checkbox"
                  checked={explicit}
                  onChange={() => togglePermission(perm)}
                />
                <div className="permission-info">
                  <div className="permission-name">
                    {PERMISSION_LABELS[perm]}
                    {fromRole && (
                      <span className="permission-from-role">
                        {" "}(już z roli)
                      </span>
                    )}
                  </div>
                  <div className="permission-desc">
                    {PERMISSION_DESCRIPTIONS[perm]}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
        <div className="admin-edit-help">
          Te uprawnienia są dorzucane <em>poza</em> rolą. Np. USER z
          "posts.delete" może moderować, choć nie jest ADMINEM.
        </div>
      </div>

      <div className="admin-edit-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onCancel}
          disabled={pending}
        >
          Anuluj
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={pending}
        >
          {pending ? "Zapisywanie…" : "Zapisz zmiany"}
        </button>
      </div>
    </div>
  );
}
