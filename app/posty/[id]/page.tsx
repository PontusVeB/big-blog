// Strona szczegółów posta. Faza 10: dodane wyświetlanie tagów pod meta.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeDate, getInitial } from "@/lib/posts/utils";
import { canEditPost, canDeletePost } from "@/lib/posts/permissions";
import type { PostWithAuthor } from "@/lib/posts/types";
import type { CommentRow } from "@/lib/comments/types";
import type { Role } from "@/lib/auth/permissions";
import type { TagInfo } from "@/lib/tags/types";
import RichContent from "@/components/post/RichContent";
import PostActions from "@/components/post/PostActions";
import PostLikesSection from "@/components/post/PostLikesSection";
import PostTags from "@/components/post/PostTags";
import CommentTree from "@/components/comment/CommentTree";

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
  if (!post) return { title: "Post nie znaleziony" };
  return {
    title: post.title,
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

  const [{ data: post, error }, { data: { user } }] = await Promise.all([
    supabase
      .from("posts")
      .select(
        `
        id, title, content, image_url, author_id, created_at, edited_at,
        likes_count, comments_count,
        author:profiles!author_id (id, nickname, email, avatar_url)
      `
      )
      .eq("id", id)
      .single<PostWithAuthor>(),
    supabase.auth.getUser(),
  ]);

  if (error || !post) notFound();

  // Tagi posta
  const { data: tagRows } = await supabase
    .from("post_tags")
    .select("tag:tags(id, name, slug, color)")
    .eq("post_id", id);

  const tags: TagInfo[] = (tagRows ?? [])
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

  let viewerProfile: { id: string; role: Role; permissions: string[] | null } | null = null;
  let likedByMe = false;

  if (user) {
    const [{ data: profileData }, { data: myLike }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, role, permissions")
        .eq("id", user.id)
        .single(),
      supabase
        .from("post_likes")
        .select("post_id")
        .eq("post_id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    viewerProfile = profileData as typeof viewerProfile;
    likedByMe = !!myLike;
  }

  const { data: commentsData } = await supabase
    .from("comments")
    .select(
      `
      id, target_type, target_id, author_id, content, parent_id, depth, is_deleted, likes_count, created_at, edited_at,
      author:profiles!author_id (id, nickname, email, avatar_url)
    `
    )
    .eq("target_type", "POST")
    .eq("target_id", id)
    .order("created_at", { ascending: true })
    .returns<CommentRow[]>();
  const comments = commentsData ?? [];

  let likedCommentIds = new Set<string>();
  if (user && comments.length > 0) {
    const commentIds = comments.map((c) => c.id);
    const { data: myCommentLikes } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", user.id)
      .in("comment_id", commentIds);
    likedCommentIds = new Set(
      myCommentLikes?.map((l) => l.comment_id as string) ?? []
    );
  }

  const canEdit = canEditPost(viewerProfile, post);
  const canDelete = canDeletePost(viewerProfile, post);
  const isOwnPost = !!user && user.id === post.author_id;

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
            <Link
              href={`/profil/${post.author_id}`}
              className="author author-link-hero"
            >
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
            </Link>
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

      {/* Tagi posta — klikalne pille prowadzące do /?tag=slug */}
      {tags.length > 0 && (
        <div className="single-post-tags">
          <PostTags tags={tags} variant="block" />
        </div>
      )}

      <PostActions postId={post.id} canEdit={canEdit} canDelete={canDelete} />

      <div className="post-content">
        <RichContent content={post.content} />
      </div>

      <PostLikesSection
        postId={post.id}
        initialLiked={likedByMe}
        initialCount={post.likes_count}
        isLoggedIn={!!user}
        isOwnPost={isOwnPost}
      />

      <CommentTree
        targetType="POST"
        targetId={post.id}
        comments={comments}
        likedCommentIds={likedCommentIds}
        totalCount={post.comments_count}
        viewer={viewerProfile}
      />
    </article>
  );
}
