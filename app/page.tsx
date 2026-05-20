// Strona główna — lista postów + filtr po tagach.
// Faza 13: hero i kafelki "Rozmowy/Zdjęcia/Społeczność" przeniesione na /o-blogu.
// Tu zostają tylko: filtr po tagach (wyśrodkowany) + posty + FAB.

import Link from "next/link";
import { PenLine } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/post/PostCard";
import TagsFilter from "@/components/tags/TagsFilter";
import NewPostFab from "@/components/post/NewPostFab";
import type { PostWithAuthor, PostWithLikeState } from "@/lib/posts/types";
import type { TagInfo, TagWithCount } from "@/lib/tags/types";

type SearchParams = Promise<{ tag?: string }>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { tag: activeSlug = null } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 1. Fetch wszystkich tagów (do filtra) z liczbą postów ───────────────
  const { data: allTagsRaw } = await supabase
    .from("tags")
    .select("id, name, slug, color, post_tags(count)")
    .order("name", { ascending: true });

  const allTags: TagWithCount[] = (allTagsRaw ?? []).map((t) => {
    const countRow = Array.isArray(t.post_tags) ? t.post_tags[0] : null;
    return {
      id: t.id as string,
      name: t.name as string,
      slug: t.slug as string,
      color: (t.color as string | null) ?? null,
      posts_count: (countRow?.count as number) ?? 0,
    };
  });

  // ── 2. Aktywny tag (jeśli ?tag=slug w URL) ──────────────────────────────
  const activeTag = activeSlug
    ? allTags.find((t) => t.slug === activeSlug) ?? null
    : null;

  // ── 3. Fetch postów — z filtrem po tagu, jeśli aktywny ──────────────────
  let postIdsFromTag: string[] | null = null;
  if (activeTag) {
    const { data: pt } = await supabase
      .from("post_tags")
      .select("post_id")
      .eq("tag_id", activeTag.id);
    postIdsFromTag = (pt ?? []).map((r) => r.post_id as string);
    if (postIdsFromTag.length === 0) postIdsFromTag = ["00000000-0000-0000-0000-000000000000"];
  }

  let postsQuery = supabase
    .from("posts")
    .select(
      `
      id, title, content, image_url, author_id, created_at, edited_at,
      likes_count, comments_count,
      author:profiles!author_id (id, nickname, email, avatar_url)
    `
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (postIdsFromTag) {
    postsQuery = postsQuery.in("id", postIdsFromTag);
  }

  const { data: posts } = await postsQuery.returns<PostWithAuthor[]>();
  const postList = posts ?? [];

  // ── 4. Dla każdego posta pobieramy jego tagi ────────────────────────────
  const tagsByPostId = new Map<string, TagInfo[]>();
  if (postList.length > 0) {
    const ids = postList.map((p) => p.id);
    const { data: pt } = await supabase
      .from("post_tags")
      .select("post_id, tag:tags(id, name, slug, color)")
      .in("post_id", ids);

    for (const row of pt ?? []) {
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
  }

  // ── 5. Like state ────────────────────────────────────────────────────────
  let likedIds = new Set<string>();
  if (user && postList.length > 0) {
    const postIds = postList.map((p) => p.id);
    const { data: myLikes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds);
    likedIds = new Set(myLikes?.map((l) => l.post_id as string) ?? []);
  }

  const postsWithLikeState: PostWithLikeState[] = postList.map((p) => ({
    ...p,
    liked_by_me: likedIds.has(p.id),
    tags: tagsByPostId.get(p.id) ?? [],
  }));

  const hasPosts = postsWithLikeState.length > 0;
  const currentUserId = user?.id ?? null;

  return (
    <>
      <section className="posts-feed posts-feed-top">
        {/* Filtr po tagach — wyśrodkowany razem z listą postów */}
        <TagsFilter tags={allTags} activeSlug={activeSlug} />

        <div className="feed-header">
          <h2>
            {activeTag
              ? `Posty z tagiem "${activeTag.name}"`
              : hasPosts
              ? "Najnowsze posty"
              : "Jeszcze nic tu nie ma"}
          </h2>
        </div>

        {hasPosts ? (
          <div className="posts-grid">
            {postsWithLikeState.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={currentUserId} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <PenLine size={48} className="empty-icon-svg" />
            <h3>{activeTag ? "Brak postów z tym tagiem" : "Bądź pierwszy"}</h3>
            <p>
              {activeTag
                ? "Spróbuj wybrać inny tag lub wyczyść filtr."
                : "Nikt jeszcze nie opublikował posta. Może zaczniesz od swojego pierwszego wpisu?"}
            </p>
            {activeTag ? (
              <Link href="/" className="btn btn-primary">
                Pokaż wszystkie posty
              </Link>
            ) : user ? (
              <Link href="/posty/nowy" className="btn btn-primary">
                Napisz pierwszy post
              </Link>
            ) : (
              <Link href="/rejestracja" className="btn btn-primary">
                Załóż konto i napisz post
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Pływający przycisk — tylko dla zalogowanych, tylko na stronie głównej */}
      {user && <NewPostFab />}
    </>
  );
}
