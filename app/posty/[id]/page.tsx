import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeDate, getInitial } from "@/lib/posts/utils";
import { canEditPost, canDeletePost } from "@/lib/posts/permissions";
import type { PostWithAuthor } from "@/lib/posts/types";
import type { Role } from "@/lib/auth/permissions";
import RichContent from "@/components/post/RichContent";
import PostActions from "@/components/post/PostActions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("title, content")
    .eq("id", id)
    .single();
  if (!post) return { title: "Post nie znaleziony • Big Blog" };
  return {
    title: `${post.title} • Big Blog`,
    description: post.content.slice(0, 160),
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Pobierz post + dane bieżącego usera (do sprawdzenia uprawnień edytuj/usuń)
  const [
    { data: post, error },
    { data: { user } },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select(
        `
        id, title, content, image_url, author_id, created_at, edited_at,
        author:profiles!author_id (id, nickname, email, avatar_url)
      `
      )
      .eq("id", id)
      .single<PostWithAuthor>(),
    supabase.auth.getUser(),
  ]);

  if (error || !post) notFound();

  // Profil zalogowanego do permissions check
  let viewerProfile: { id: string; role: Role; permissions: string[] | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("id, role, permissions")
      .eq("id", user.id)
      .single();
    viewerProfile = data as typeof viewerProfile;
  }

  const canEdit = canEditPost(viewerProfile, post);
  const canDelete = canDeletePost(viewerProfile, post);

  const authorName =
    post.author?.nickname ?? post.author?.email?.split("@")[0] ?? "anonim";
  const initial = getInitial(post.author?.nickname ?? post.author?.email);

  return (
    <article className="single-post">
      <div className="hero">
        {post.image_url ? (
          <img src={post.image_url} alt={post.title} className="post-hero-image" />
        ) : (
          <div className="img-placeholder img-grad-1" />
        )}
        <div className="hero-overlay">
          <h1>{post.title}</h1>
          <div className="meta">
            <span className="author">
              {post.author?.avatar_url ? (
                <img
                  src={post.author.avatar_url}
                  alt={authorName}
                  className="avatar avatar-sm"
                />
              ) : (
                <span className="avatar avatar-sm">{initial}</span>
              )}
              {authorName}
            </span>
            <span className="dot"></span>
            <span>{formatRelativeDate(post.created_at)}</span>
            {post.edited_at && (
              <>
                <span className="dot"></span>
                <span className="edited">edytowane</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Akcje (edycja/usuwanie) — widoczne tylko jeśli user ma uprawnienia */}
      <PostActions postId={post.id} canEdit={canEdit} canDelete={canDelete} />

      <div className="post-content">
        <RichContent content={post.content} />
      </div>
    </article>
  );
}
