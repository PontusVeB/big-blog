// Karta posta wyświetlana na liście (strona główna).
// Server Component — nie używa stanu, tylko renderuje dane.

import Link from "next/link";
import type { PostWithAuthor } from "@/lib/posts/types";
import { formatRelativeDate, truncateContent, getInitial } from "@/lib/posts/utils";

// Gradienty placeholder kiedy post nie ma jeszcze zdjęcia (Round 2A).
// Dobierany deterministycznie po ID posta — ten sam post = ten sam gradient.
const GRADIENTS = ["img-grad-1", "img-grad-2", "img-grad-3", "img-grad-4", "img-grad-5"];
function pickGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % GRADIENTS.length;
  return GRADIENTS[hash];
}

export default function PostCard({ post }: { post: PostWithAuthor }) {
  const authorName =
    post.author?.nickname ?? post.author?.email?.split("@")[0] ?? "anonim";
  const initial = getInitial(post.author?.nickname ?? post.author?.email);

  return (
    <article className="post-card">
      <Link href={`/posty/${post.id}`} className="post-card-link">
        <div className="image-wrap">
          {post.image_url ? (
            <img src={post.image_url} alt={post.title} className="post-image" />
          ) : (
            <div className={`img-placeholder ${pickGradient(post.id)}`} />
          )}
          <div className="image-overlay">
            <h3 className="title">{post.title}</h3>
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
              <span>•</span>
              <span>{formatRelativeDate(post.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="body">
          <p className="excerpt">{truncateContent(post.content, 200)}</p>
          <span className="read-more">Czytaj dalej →</span>
        </div>
      </Link>
    </article>
  );
}
