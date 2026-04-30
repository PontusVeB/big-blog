import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeDate, getInitial } from "@/lib/posts/utils";
import type { PostWithAuthor } from "@/lib/posts/types";

// Generowanie metadanych dynamicznie — tytuł karty przeglądarki = tytuł posta
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
  const { data: post, error } = await supabase
    .from("posts")
    .select(
      `
      id, title, content, image_url, author_id, created_at, edited_at,
      author:profiles!author_id (id, nickname, email, avatar_url)
    `
    )
    .eq("id", id)
    .single<PostWithAuthor>();

  if (error || !post) notFound();

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

      {/* white-space: pre-wrap zachowuje akapity i emoji wpisane w treść */}
      <div className="post-content">{post.content}</div>
    </article>
  );
}
