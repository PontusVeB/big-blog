"use client";
// Pojedynczy wiersz w tabeli userów. Po kliknięciu "Edytuj" rozwija się
// inline EditUserForm pod wierszem.

import { useState } from "react";
import Link from "next/link";
import { Pencil, Lock, Crown, Shield, User as UserIcon } from "lucide-react";
import { formatRelativeDate, getInitial } from "@/lib/posts/utils";
import type { AdminUserRow } from "@/app/admin/uzytkownicy/page";
import EditUserForm from "./EditUserForm";

type Props = {
  user: AdminUserRow;
  isSelf: boolean;
  canEdit: boolean;
};

export default function UserRow({ user, isSelf, canEdit }: Props) {
  const [editing, setEditing] = useState(false);

  const displayName =
    user.nickname ?? user.email?.split("@")[0] ?? "anonim";
  const initial = getInitial(user.nickname ?? user.email);
  const permissions = user.permissions ?? [];

  // MASTER nie do edycji przez panel (tylko DB)
  // Sam siebie też nie da się edytować (zabezpieczenie żeby się nie zablokować)
  const isEditable = canEdit && !isSelf && user.role !== "MASTER";

  return (
    <>
      <div className="admin-users-row">
        <div className="admin-user-cell">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={displayName}
              className="avatar avatar-sm"
            />
          ) : (
            <span className="avatar avatar-sm">{initial}</span>
          )}
          <div className="admin-user-info">
            <Link href={`/profil/${user.id}`} className="admin-user-name">
              {displayName}
              {isSelf && <span className="admin-self-badge"> (to Ty)</span>}
            </Link>
            <span className="admin-user-email">{user.email}</span>
          </div>
        </div>

        <div>
          {user.role === "MASTER" && (
            <span className="role-badge role-master">
              <Crown size={12} /> Master
            </span>
          )}
          {user.role === "ADMIN" && (
            <span className="role-badge role-admin">
              <Shield size={12} /> Admin
            </span>
          )}
          {user.role === "USER" && (
            <span className="role-badge role-user">
              <UserIcon size={12} /> User
            </span>
          )}
        </div>

        <div className="admin-permissions-cell">
          {permissions.length === 0 ? (
            <span className="admin-permissions-empty">(z roli)</span>
          ) : (
            permissions.map((p) => (
              <span key={p} className="permission-pill">
                {p}
              </span>
            ))
          )}
        </div>

        <div className="admin-joined-cell">
          {formatRelativeDate(user.created_at)}
        </div>

        <div className="admin-actions-cell">
          {isEditable ? (
            <button
              type="button"
              className="btn btn-secondary admin-edit-btn"
              onClick={() => setEditing(!editing)}
            >
              <Pencil size={14} /> {editing ? "Zwiń" : "Edytuj"}
            </button>
          ) : user.role === "MASTER" ? (
            <span className="admin-locked" title="MASTER tylko przez bazę">
              <Lock size={14} />
            </span>
          ) : isSelf ? (
            <span className="admin-locked" title="Nie możesz edytować siebie">
              <Lock size={14} />
            </span>
          ) : null}
        </div>
      </div>

      {editing && (
        <div className="admin-edit-row">
          <EditUserForm
            user={user}
            onSaved={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}
    </>
  );
}
