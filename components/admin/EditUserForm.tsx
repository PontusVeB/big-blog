"use client";
// Inline formularz edycji jednego usera (rola + uprawnienia jako tabela).

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
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

  // Domyślne uprawnienia z aktualnie wybranej roli — pokazujemy w kolumnie "Z roli"
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
          ADMIN automatycznie ma uprawnienia moderacji.
        </div>
      </div>

      <div className="admin-edit-field">
        <label>Uprawnienia</label>
        <table className="permissions-table">
          <thead>
            <tr>
              <th>Uprawnienie</th>
              <th>Opis</th>
              <th title="Czy ta rola domyślnie ma to uprawnienie">Z roli</th>
              <th title="Czy nadać ekstra niezależnie od roli">Nadane</th>
            </tr>
          </thead>
          <tbody>
            {AVAILABLE_PERMISSIONS.map((perm) => {
              const fromRole = rolePermissions.includes(perm);
              const explicit = permissions.includes(perm);
              return (
                <tr key={perm}>
                  <td className="permission-name-cell">
                    <code>{perm}</code>
                    <div className="permission-label">
                      {PERMISSION_LABELS[perm]}
                    </div>
                  </td>
                  <td className="permission-desc-cell">
                    {PERMISSION_DESCRIPTIONS[perm]}
                  </td>
                  <td className="permission-check-cell">
                    {fromRole ? (
                      <Check size={16} className="check-yes" />
                    ) : (
                      <span className="check-no">—</span>
                    )}
                  </td>
                  <td className="permission-check-cell">
                    <input
                      type="checkbox"
                      checked={explicit}
                      onChange={() => togglePermission(perm)}
                      className="permission-checkbox-input"
                      aria-label={`Nadaj ${perm}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="admin-edit-help">
          "Z roli" — automatycznie z wybranej roli. "Nadane" — extra, zapisane
          w polu <code>permissions[]</code>. Suma tych dwóch determinuje co
          user faktycznie może zrobić.
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
