import type { Metadata } from "next";
import Link from "next/link";
import { Users, FilePen, MessageCircle, Heart, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdminAccess } from "@/lib/admin/guards";

export const metadata: Metadata = {
  title: "Panel admina",
};

export default async function AdminDashboardPage() {
  const viewer = await requireAdminAccess();
  const supabase = await createClient();

  // Statystyki ogólne — wszystkie zapytania równolegle
  const [
    { count: usersCount },
    { count: postsCount },
    { count: commentsCount },
    { count: postLikesCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("is_deleted", false),
    supabase.from("post_likes").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Panel admina</h1>
        <p className="admin-subtitle">
          Witaj, {viewer.email}. Rola: <strong>{viewer.role}</strong>.
        </p>
      </header>

      <section className="admin-stats">
        <div className="stat-card">
          <Users size={20} className="stat-icon" />
          <div className="stat-value">{usersCount ?? 0}</div>
          <div className="stat-label">użytkowników</div>
        </div>
        <div className="stat-card">
          <FilePen size={20} className="stat-icon" />
          <div className="stat-value">{postsCount ?? 0}</div>
          <div className="stat-label">postów</div>
        </div>
        <div className="stat-card">
          <MessageCircle size={20} className="stat-icon" />
          <div className="stat-value">{commentsCount ?? 0}</div>
          <div className="stat-label">komentarzy</div>
        </div>
        <div className="stat-card">
          <Heart size={20} className="stat-icon" />
          <div className="stat-value">{postLikesCount ?? 0}</div>
          <div className="stat-label">polubień postów</div>
        </div>
      </section>

      <section className="admin-modules">
        <Link href="/admin/uzytkownicy" className="admin-module-card">
          <Users size={28} className="admin-module-icon" />
          <div className="admin-module-info">
            <h3>Zarządzaj użytkownikami</h3>
            <p>Lista wszystkich kont, zmiana ról i uprawnień.</p>
          </div>
          <ChevronRight size={20} className="admin-module-arrow" />
        </Link>
      </section>
    </div>
  );
}
