"use client";
// Inline formularz edycji jednego usera (rola + uprawnienia jako tabela).
// Faza 22: dropdown ról zastąpiony kartami (USER / BLOGER / ADMIN).

import { useState, useTransition } from "react";
import { Check, Shield, Feather, User as UserIcon } from "lucide-react";
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

// Typ ról jakie MASTER może nadawać przez panel (MASTER excluded — tylko przez bazę)
type EditableRole = "USER" | "BLOGER" | "ADMIN";

function toEditableRole(role: Role): EditableRole {
  if (role === "ADMIN") return "ADMIN";
  if (role === "BLOGER") return "BLOGER";
  return "USER";
}

// Definicja kart ról — ikona, opis, kolor
const ROLE_OPTIONS: {
  value: EditableRole;
  label: string;
  description: string;
  Icon: React.ElementType;
  cardClass: string;
}[] = [
  {
    value: "USER",
    label: "User",
    description: "Komentuje i lajkuje. Nie tworzy postów.",
    Icon: UserIcon,
    cardClass: "role-card-user",
  },
  {
    value: "BLOGER",
    label: "Bloger",
    description: "Tworzy posty i komentuje. Bez uprawnień moderacji.",
    Icon: Feather,
    cardClass: "role-card-bloger",
  },
  {
    value: "ADMIN",
    label: "Admin",
    description: "Moderator — usuwa cudze treści, zarządza tagami.",
    Icon: Shield,
    cardClass: "role-card-admin",
  },
];

export default function EditUserForm({ user, onSaved, onCancel }: Props) {
  const [role, setRole] = useState<EditableRole>(toEditableRole(user.role));
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

  // Domyślne uprawnienia z aktualnie wybranej roli — kolumna "Z roli"
  const rolePermissions = ROLE_PERMISSIONS[role] ?? [];

  const displayName = user.nickname ?? user.email;

  return (
    <div className="admin-edit-form">
      <h4>Edytuj: {displayName}</h4>

      {/* ── WYBÓR ROLI — karty zamiast select ─────────── */}
      <div className="admin-edit-field">
        <label>Rola</label>
        <div className="role-cards">
          {ROLE_OPTIONS.map(({ value, label, description, Icon, cardClass }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={`role-card ${cardClass} ${role === value ? "selected" : ""}`}
            >
              <span className="role-card-icon">
                <Icon size={18} />
              </span>
              <span className="role-card-body">
                <span className="role-card-name">{label}</span>
                <span className="role-card-desc">{description}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="admin-edit-help">
          Rola <strong>MASTER</strong> nadawana tylko bezpośrednio w bazie
          (Supabase SQL Editor).
        </p>
      </div>

      {/* ── TABELA UPRAWNIEŃ ────────────────────────────── */}
      <div className="admin-edit-field">
        <label>Uprawnienia indywidualne</label>
        <table className="permissions-table">
          <thead>
            <tr>
              <th>Uprawnienie</th>
              <th>Opis</th>
              <th title="Czy ta rola domyślnie ma to uprawnienie">Z roli</th>
              <th title="Nadaj ekstra, niezależnie od roli">Nadane</th>
            </tr>
          </thead>
          <tbody>
            {AVAILABLE_PERMISSIONS.map((perm) => {
              const fromRole = (rolePermissions as readonly string[]).includes(perm);
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
        <p className="admin-edit-help">
          <strong>Z roli</strong> — automatycznie z wybranej roli.{" "}
          <strong>Nadane</strong> — extra dla tego użytkownika, zapisane w{" "}
          <code>permissions[]</code>. Suma obu daje realne możliwości usera.
          Przykład: USER z nadanym <code>posts.create</code> może pisać posty
          bez awansu na Blogera.
        </p>
      </div>

      {/* ── PRZYCISKI ──────────────────────────────────── */}
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
