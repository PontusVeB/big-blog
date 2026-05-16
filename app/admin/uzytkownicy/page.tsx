import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdminAccess } from "@/lib/admin/guards";
import UserRow from "@/components/admin/UserRow";
import type { Role } from "@/lib/auth/permissions";

export const metadata: Metadata = {
  title: "Użytkownicy • Panel admina",
};

export type AdminUserRow = {
  id: string;
  email: string;
  nickname: string | null;
  avatar_url: string | null;
  role: Role;
  permissions: string[] | null;
  created_at: string;
};

export default async function AdminUsersPage() {
  const viewer = await requireAdminAccess();
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, nickname, avatar_url, role, permissions, created_at")
    .order("created_at", { ascending: false })
    .returns<AdminUserRow[]>();

  const canEditOthers = viewer.role === "MASTER";

  return (
    <div className="admin-page">
      <header className="admin-header">
        <Link href="/admin" className="admin-back-link">
          <ArrowLeft size={16} /> Panel admina
        </Link>
        <h1>Użytkownicy</h1>
        <p className="admin-subtitle">
          {canEditOthers ? (
            <>
              Możesz zmieniać role między <strong>USER</strong> ↔ <strong>ADMIN</strong> oraz
              nadawać granularne uprawnienia. MASTER ustawiasz tylko bezpośrednio w bazie.
            </>
          ) : (
            <>
              Widzisz listę użytkowników w trybie tylko-do-odczytu. Edycję ról
              może wykonać tylko MASTER.
            </>
          )}
        </p>
      </header>

      <div className="admin-users-table">
        <div className="admin-users-row admin-users-header-row">
          <div>Użytkownik</div>
          <div>Rola</div>
          <div>Uprawnienia</div>
          <div>Dołączył</div>
          <div></div>
        </div>
        {(users ?? []).map((user) => (
          <UserRow
            key={user.id}
            user={user}
            isSelf={user.id === viewer.id}
            canEdit={canEditOthers}
          />
        ))}
      </div>
    </div>
  );
}
