// Edycja posta. Tytuł karty bazuje na template z layout.tsx ("%s • BigBlog").

import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostForm from "@/components/post/PostForm";
import { POST_EDIT_WINDOW_MS } from "@/lib/posts/permissions";
import { hasPermission, type Role } from "@/lib/auth/permissions";
import type { TagInfo } from "@/lib/tags/types";

export const metadata: Metadata = {
  title: "Edycja posta",
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/logowanie?next=/posty/${id}/edytuj`);

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, content, image_url, author_id, created_at")
    .eq("id", id)
    .single();

  if (!post) notFound();
  if (post.author_id !== user.id) redirect(`/posty/${id}`);

  const ageMs = Date.now() - new Date(post.created_at).getTime();
  if (ageMs > POST_EDIT_WINDOW_MS) {
    redirect(`/posty/${id}`);
  }

  // Tagi posta + uprawnienie tworzenia
  const [{ data: tagRows }, { data: profile }] = await Promise.all([
    supabase
      .from("post_tags")
      .select("tag:tags(id, name, slug, color)")
      .eq("post_id", id),
    supabase
      .from("profiles")
      .select("role, permissions")
      .eq("id", user.id)
      .single<{ role: Role; permissions: string[] | null }>(),
  ]);

  const initialTags: TagInfo[] = (tagRows ?? [])
    .map((r) => {
      const t = Array.isArray(r.tag) ? r.tag[0] : r.tag;
      if (!t) return null;
      return {
        id: t.id as string,
        name: t.name as string,
        slug: t.slug as string,
        color: (t.color as string | null) ?? null,
      };
    })
    .filter((t): t is TagInfo => t !== null);

  const canCreateTags = hasPermission(profile, "tags.create");

  return (
    <div className="post-form-page">
      <header className="post-form-header">
        <h1>Edycja posta</h1>
        <p className="post-form-subtitle">
          Możesz wprowadzać zmiany jeszcze przez kilka minut.
          Po upływie 30 minut od publikacji post staje się "zafiksowany".
        </p>
      </header>
      <PostForm
        mode="edit"
        canCreateTags={canCreateTags}
        initial={{
          id: post.id,
          title: post.title,
          content: post.content,
          imageUrl: post.image_url,
          tags: initialTags,
        }}
      />
    </div>
  );
}
