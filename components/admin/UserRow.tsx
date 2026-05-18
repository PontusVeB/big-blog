"use client";
// Pojedynczy wiersz tabeli userów + inline edycja + status online.
// Komórki mają data-label żeby na mobile pokazać etykietę "Rola:", "Status:" itd.

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

function OnlineStatus({ lastSeen }: { lastSeen: string | null }) {
  if (!lastSeen) {
    return (
      <span className="online-status online-never">
        <span className="online-dot" /> nigdy
      </span>
    );
  }
  const diffMs = Date.now() - new Date(lastSeen).getTime();
  const diffMin = diffMs / 60_000;

  if (diffMin < 5) {
    return (
      <span className="online-status online-now">
        <span className="online-dot" /> online
      </span>
    );
  }
  if (diffMin < 60) {
    return (
      <span className="online-status online-recent">
        <span className="online-dot" /> {Math.floor(diffMin)} min temu
      </span>
    );
  }
  return (
    <span className="online-status online-away">
      <span className="online-dot" /> {formatRelativeDate(lastSeen)}
    </span>
  );
}

export default function UserRow({ user, isSelf, canEdit }: Props) {
  const [editing, setEditing] = useState(false);

  const displayName =
    user.nickname ?? user.email?.split("@")[0] ?? "anonim";
  const initial = getInitial(user.nickname ?? user.email);
  const permissions = user.permissions ?? [];
  const isEditable = canEdit && !isSelf && user.role !== "MASTER";

  return (
    <>
      <div className="admin-users-row">
        {/* User cell — na mobile renderowany jako header karty (bez data-label) */}
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

        <div data-label="Rola">
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

        <div data-label="Status">
          <OnlineStatus lastSeen={user.last_seen_at} />
        </div>

        <div className="admin-permissions-cell" data-label="Uprawnienia">
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

        <div className="admin-joined-cell" data-label="Dołączył">
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
