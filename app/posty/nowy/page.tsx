// Strona nowego posta.
// Faza 22: guard sprawdza uprawnienie posts.create — USER bez awansu na BLOGER
// zostaje przekierowany na stronę główną z komunikatem.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostForm from "@/components/post/PostForm";
import { hasPermission, type Role } from "@/lib/auth/permissions";

export const metadata: Metadata = {
  title: "Nowy post",
};

export default async function NewPostPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Niezalogowany → logowanie
  if (!user) redirect("/logowanie?next=/posty/nowy");

  // Pobieramy profil (rola + indywidualne uprawnienia)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, permissions")
    .eq("id", user.id)
    .single<{ role: Role; permissions: string[] | null }>();

  // Brak uprawnienia posts.create → strona główna z flash-em
  if (!hasPermission(profile, "posts.create")) {
    redirect("/?flash=no_permission_create_post");
  }

  // Czy user może też tworzyć tagi (rola ADMIN/MASTER lub grant w permissions[])?
  const canCreateTags = hasPermission(profile, "tags.create");

  return (
    <div className="post-form-page">
      <header className="post-form-header">
        <h1>Nowy post</h1>
        <p className="post-form-subtitle">
          Po publikacji masz 30 minut na poprawki — potem post staje się publiczny na zawsze.
        </p>
      </header>
      <PostForm mode="create" canCreateTags={canCreateTags} />
    </div>
  );
}
