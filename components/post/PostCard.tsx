// Karta posta na liście. Faza 10: dodane tagi pod treścią (jeśli są).
//
// Struktura linków (bez nested <a>):
//   - image-link    → /posty/[id]
//   - title-link    → /posty/[id]
//   - author-link   → /profil/[id]
//   - body-link     → /posty/[id]
//   - tag-pill      → /?tag=slug  (kliknięcie filtruje feed po tagu)
//   - LikeButton, comments-stat — w footerze

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import type { PostWithLikeState } from "@/lib/posts/types";
import { formatRelativeDate, truncateContent, getInitial } from "@/lib/posts/utils";
import LikeButton from "./LikeButton";
import PostTags from "./PostTags";

const GRADIENTS = ["img-grad-1", "img-grad-2", "img-grad-3", "img-grad-4", "img-grad-5"];
function pickGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % GRADIENTS.length;
  return GRADIENTS[hash];
}

type Props = {
  post: PostWithLikeState;
  currentUserId: string | null;
};

export default function PostCard({ post, currentUserId }: Props) {
  const authorName =
    post.author?.nickname ?? post.author?.email?.split("@")[0] ?? "anonim";
  const initial = getInitial(post.author?.nickname ?? post.author?.email);
  const isOwnPost = !!currentUserId && currentUserId === post.author_id;
  const hasTags = post.tags && post.tags.length > 0;

  return (
    <article className="post-card">
      <div className="image-wrap">
        <Link
          href={`/posty/${post.id}`}
          className="image-link"
          aria-label={post.title}
        >
          {post.image_url ? (
            <img src={post.image_url} alt={post.title} className="post-image" />
          ) : (
            <div className={`img-placeholder ${pickGradient(post.id)}`} />
          )}
        </Link>

        <div className="image-overlay">
          <Link href={`/posty/${post.id}`} className="title-link">
            <h3 className="title">{post.title}</h3>
          </Link>
          <div className="meta">
            <Link href={`/profil/${post.author_id}`} className="author-link">
              {post.author?.avatar_url ? (
                <img
                  src={post.author.avatar_url}
                  alt={authorName}
                  className="avatar avatar-sm"
                />
              ) : (
                <span className="avatar avatar-sm">{initial}</span>
              )}
              <span className="author-name">{authorName}</span>
            </Link>
            <span>•</span>
            <span>{formatRelativeDate(post.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Tagi — między hero a treścią. NIE w body-linku, żeby zachować klikalność tagów. */}
      {hasTags && (
        <div className="post-card-tags">
          <PostTags tags={post.tags!} variant="inline" />
        </div>
      )}

      <Link href={`/posty/${post.id}`} className="body-link">
        <div className="body">
          <p className="excerpt">{truncateContent(post.content, 200)}</p>
          <span className="read-more">
            Czytaj dalej <ArrowRight size={14} />
          </span>
        </div>
      </Link>

      <footer className="post-card-footer">
        <LikeButton
          targetType="post"
          targetId={post.id}
          initialLiked={post.liked_by_me}
          initialCount={post.likes_count}
          isLoggedIn={currentUserId !== null}
          isOwnContent={isOwnPost}
          variant="compact"
        />
        <Link
          href={`/posty/${post.id}#comments`}
          className="comments-stat"
          title="Przejdź do komentarzy"
        >
          <MessageCircle size={16} />
          <span className="comments-stat-count">{post.comments_count}</span>
        </Link>
      </footer>
    </article>
  );
}
