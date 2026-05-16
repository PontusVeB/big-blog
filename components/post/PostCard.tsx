// Karta posta na liście. Wewnątrz są TRZY osobne Linki:
//   - image-link    → /posty/[id]   (kliknięcie w zdjęcie)
//   - title-link    → /posty/[id]   (kliknięcie w tytuł)
//   - author-link   → /profil/[id]  (kliknięcie w awatar lub nick autora)
//   - body-link     → /posty/[id]   (kliknięcie w treść / "Czytaj dalej")
// Plus footer z LikeButton i licznikiem komentarzy (osobne Linki).
//
// Cała ta gimnastyka — żeby autor zawsze prowadził do profilu, a reszta do posta.
// Nie ma nested <a> (niepoprawny HTML), bo image-overlay jest siblingiem image-linka
// (pozycjonowany absolutnie nad nim), nie zawiera się w nim.

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import type { PostWithLikeState } from "@/lib/posts/types";
import { formatRelativeDate, truncateContent, getInitial } from "@/lib/posts/utils";
import LikeButton from "./LikeButton";

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

  return (
    <article className="post-card">
      <div className="image-wrap">
        {/* Zdjęcie (lub gradient) jako klikalny Link do posta */}
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

        {/* Overlay z gradientem i napisami — SIBLING image-linka, nie nested.
            CSS pointer-events: none na tle, auto na linkach wewnątrz. */}
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
