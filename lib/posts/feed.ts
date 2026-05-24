// Pobieranie postów do list: strona główna ("Pokaż więcej") oraz /popularne.
//
// - getFeedPosts  → porcja najnowszych postów (z filtrem po tagu) — strona główna
// - getTopPosts   → top N postów wg metryki (lajki / komentarze) — strona /popularne
//
// Oba reużywają enrichPosts (dociąga autora-tagi-stan lajka).

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PostWithAuthor, PostWithLikeState } from "./types";
import type { TagInfo } from "@/lib/tags/types";

export const FEED_PAGE_SIZE = 6;

// Wspólny SELECT postów (z autorem). Trzymany w jednym miejscu, by listy
// były spójne.
const POST_SELECT = `
  id, title, content, image_url, author_id, created_at, edited_at,
  likes_count, comments_count,
  author:profiles!author_id (id, nickname, email, avatar_url)
`;

// ════════════════════════════════════════════════════════════════
//  enrichPosts — dokłada tagi i stan polubienia bieżącego usera
// ════════════════════════════════════════════════════════════════
async function enrichPosts(
  supabase: SupabaseClient,
  posts: PostWithAuthor[],
  currentUserId: string | null
): Promise<PostWithLikeState[]> {
  if (posts.length === 0) return [];
  const ids = posts.map((p) => p.id);

  // Tagi przypisane do tych postów
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

  // Stan polubień bieżącego usera
  let likedIds = new Set<string>();
  if (currentUserId) {
    const { data: myLikes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", currentUserId)
      .in("post_id", ids);
    likedIds = new Set(myLikes?.map((l) => l.post_id as string) ?? []);
  }

  return posts.map((p) => ({
    ...p,
    liked_by_me: likedIds.has(p.id),
    tags: tagsByPostId.get(p.id) ?? [],
  }));
}

// ════════════════════════════════════════════════════════════════
//  getFeedPosts — porcja najnowszych postów (strona główna)
// ════════════════════════════════════════════════════════════════
// Trik na hasMore: pobieramy o 1 post więcej niż strona.
export async function getFeedPosts({
  tagSlug,
  offset,
}: {
  tagSlug: string | null;
  offset: number;
}): Promise<{ posts: PostWithLikeState[]; hasMore: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Filtr po tagu — zbieramy ID postów z danym tagiem
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

  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .range(offset, offset + FEED_PAGE_SIZE);

  if (postIdsFromTag) query = query.in("id", postIdsFromTag);

  const { data: rows } = await query.returns<PostWithAuthor[]>();
  const fetched = rows ?? [];
  const hasMore = fetched.length > FEED_PAGE_SIZE;
  const pagePosts = fetched.slice(0, FEED_PAGE_SIZE);

  const posts = await enrichPosts(supabase, pagePosts, user?.id ?? null);
  return { posts, hasMore };
}

// ════════════════════════════════════════════════════════════════
//  getTopPosts — top N postów wg metryki (strona /popularne)
// ════════════════════════════════════════════════════════════════
// metric: "likes" → likes_count, "comments" → comments_count (liczy też
// komentarze zagnieżdżone). Okno czasowe: posty z ostatnich `days` dni.
// Tylko posty z metryką > 0. Remis → młodszy post wyżej.
//
// currentUserId przekazujemy z zewnątrz — strona woła getTopPosts 2× i nie
// chcemy 2× odpytywać auth.
export async function getTopPosts({
  metric,
  days,
  limit,
  currentUserId,
}: {
  metric: "likes" | "comments";
  days: number;
  limit: number;
  currentUserId: string | null;
}): Promise<PostWithLikeState[]> {
  const supabase = await createClient();

  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const column = metric === "likes" ? "likes_count" : "comments_count";

  const { data: rows } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .gte("created_at", since) // okno czasowe — tylko świeże posty
    .gt(column, 0) // tylko posty, które faktycznie mają lajki/komentarze
    .order(column, { ascending: false }) // sort główny — metryka
    .order("created_at", { ascending: false }) // remis → młodszy wyżej
    .limit(limit)
    .returns<PostWithAuthor[]>();

  return enrichPosts(supabase, rows ?? [], currentUserId);
}
