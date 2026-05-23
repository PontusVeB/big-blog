"use client";
// Siatka postów na stronie głównej + przycisk "Pokaż więcej".
//
// Pierwsza porcja (6 postów) przychodzi z serwera jako initialPosts.
// Klik "Pokaż więcej" woła Server Action loadMorePosts i dokłada kolejne 6
// pod spód — bez przeładowania strony i bez utraty pozycji przewijania.

import { useState, useTransition } from "react";
import PostCard from "./PostCard";
import { loadMorePosts } from "@/lib/posts/feed-actions";
import type { PostWithLikeState } from "@/lib/posts/types";

type Props = {
  initialPosts: PostWithLikeState[];
  initialHasMore: boolean;
  tagSlug: string | null;
  currentUserId: string | null;
};

export default function PostFeed({
  initialPosts,
  initialHasMore,
  tagSlug,
  currentUserId,
}: Props) {
  const [posts, setPosts] = useState<PostWithLikeState[]>(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  function handleLoadMore() {
    startTransition(async () => {
      const res = await loadMorePosts(tagSlug, posts.length);
      setPosts((prev) => {
        // Dopisujemy tylko nowe ID (zabezpieczenie przed duplikatami,
        // gdyby w międzyczasie powstał nowy post i przesunął offset).
        const seen = new Set(prev.map((p) => p.id));
        const fresh = res.posts.filter((p) => !seen.has(p.id));
        return [...prev, ...fresh];
      });
      setHasMore(res.hasMore);
    });
  }

  return (
    <>
      <div className="posts-grid">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={currentUserId} />
        ))}
      </div>

      {hasMore && (
        <div className="feed-load-more">
          <button
            type="button"
            className="btn btn-secondary feed-load-more-btn"
            onClick={handleLoadMore}
            disabled={isPending}
          >
            {isPending ? "Ładowanie…" : "Pokaż więcej"}
          </button>
        </div>
      )}
    </>
  );
}
