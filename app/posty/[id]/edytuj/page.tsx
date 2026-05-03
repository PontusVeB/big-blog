import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostForm from "@/components/post/PostForm";
import { POST_EDIT_WINDOW_MS } from "@/lib/posts/permissions";

export const metadata: Metadata = {
  title: "Edycja posta • Big Blog",
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

  // Tylko autor może edytować
  if (post.author_id !== user.id) redirect(`/posty/${id}`);

  // Okno edycji 30 min
  const ageMs = Date.now() - new Date(post.created_at).getTime();
  if (ageMs > POST_EDIT_WINDOW_MS) {
    // Edycja niedostępna — wracamy na podgląd posta
    redirect(`/posty/${id}`);
  }

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
        initial={{
          id: post.id,
          title: post.title,
          content: post.content,
          imageUrl: post.image_url,
        }}
      />
    </div>
  );
}
