// Strona nowego posta. Tytuł karty bazuje na template z layout.tsx ("%s • BigBlog").

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
  if (!user) redirect("/logowanie?next=/posty/nowy");

  // Sprawdzamy czy user może tworzyć tagi (rola ADMIN/MASTER lub override w permissions[])
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, permissions")
    .eq("id", user.id)
    .single<{ role: Role; permissions: string[] | null }>();

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
