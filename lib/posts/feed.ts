// Pobieranie porcji postów do strony głównej ("Pokaż więcej").
//
// To zwykła funkcja async (nie Server Action) — używają jej:
//   - app/page.tsx (pierwsza porcja, render serwerowy),
//   - lib/posts/feed-actions.ts → loadMorePosts (kolejne porcje, z klienta).
//
// Trik na hasMore: pobieramy o 1 post więcej niż strona. Jeśli przyszło
// FEED_PAGE_SIZE + 1 wierszy → są kolejne posty (pokazujemy przycisk).

import { createClient } from "@/lib/supabase/server";
import type { PostWithAuthor, PostWithLikeState } from "./types";
import type { TagInfo } from "@/lib/tags/types";

export const FEED_PAGE_SIZE = 6;

type FeedResult = {
  posts: PostWithLikeState[];
  hasMore: boolean;
};

export async function getFeedPosts({
  tagSlug,
  offset,
}: {
  tagSlug: string | null;
  offset: number;
}): Promise<FeedResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Filtr po tagu — zbieramy ID postów z danym tagiem ───────────────────
  let postIdsFromTag: string[] | null = null;
  if (tagSlug) {
    const { data: tag } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", tagSlug)
      .maybeSingle();
    if (!tag) return { posts: [], hasMore: false };

    const { data: pt } = await supabase
      .from("post_tags")
      .select("post_id")
      .eq("tag_id", tag.id);
    postIdsFromTag = (pt ?? []).map((r) => r.post_id as string);
    if (postIdsFromTag.length === 0) return { posts: [], hasMore: false };
  }

  // ── Posty — pobieramy FEED_PAGE_SIZE + 1 (range jest włączający) ────────
  let query = supabase
    .from("posts")
    .select(
      `
      id, title, content, image_url, author_id, created_at, edited_at,
      likes_count, comments_count,
      author:profiles!author_id (id, nickname, email, avatar_url)
    `
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + FEED_PAGE_SIZE);

  if (postIdsFromTag) query = query.in("id", postIdsFromTag);

  const { data: rows } = await query.returns<PostWithAuthor[]>();
  const fetched = rows ?? [];
  const hasMore = fetched.length > FEED_PAGE_SIZE;
  const pagePosts = fetched.slice(0, FEED_PAGE_SIZE);

  if (pagePosts.length === 0) return { posts: [], hasMore: false };

  const ids = pagePosts.map((p) => p.id);

  // ── Tagi przypisane do tych postów ──────────────────────────────────────
  const tagsByPostId = new Map<string, TagInfo[]>();
  const { data: ptRows } = await supabase
    .from("post_tags")
    .select("post_id, tag:tags(id, name, slug, color)")
    .in("post_id", ids);

  for (const row of ptRows ?? []) {
    const postId = row.post_id as string;
    const tagData = Array.isArray(row.tag) ? row.tag[0] : row.tag;
    if (!tagData) continue;
    const existing = tagsByPostId.get(postId) ?? [];
    existing.push({
      id: tagData.id as string,
      name: tagData.name as string,
      slug: tagData.slug as string,
      color: (tagData.color as string | null) ?? null,
    });
    tagsByPostId.set(postId, existing);
  }

  // ── Stan polubień bieżącego usera ───────────────────────────────────────
  let likedIds = new Set<string>();
  if (user) {
    const { data: myLikes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", ids);
    likedIds = new Set(myLikes?.map((l) => l.post_id as string) ?? []);
  }

  const posts: PostWithLikeState[] = pagePosts.map((p) => ({
    ...p,
    liked_by_me: likedIds.has(p.id),
    tags: tagsByPostId.get(p.id) ?? [],
  }));

  return { posts, hasMore };
}
