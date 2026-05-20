// Strona wyników wyszukiwania — /szukaj?q=fraza
//
// Przepływ:
//  1. Czytamy `q` z URL i budujemy bezpieczne tsquery (buildTsQuery).
//  2. RPC `search_posts` zwraca id postów + rank (posortowane po trafności).
//  3. Dociągamy pełne dane postów (autor, tagi, stan lajka) i renderujemy
//     w tej samej siatce co strona główna (PostCard).
//  4. Osobno pokazujemy pasujące tagi (klik → filtr po tagu na home).

import type { Metadata } from "next";
import Link from "next/link";
import { Search as SearchIcon, Tag as TagIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/post/PostCard";
import SearchBar from "@/components/search/SearchBar";
import { buildTsQuery, postsLabel } from "@/lib/search/utils";
import type { PostWithAuthor, PostWithLikeState } from "@/lib/posts/types";
import type { TagInfo } from "@/lib/tags/types";

export const metadata: Metadata = {
  title: "Wyszukiwarka",
};

type SearchParams = Promise<{ q?: string }>;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q: rawQuery = "" } = await searchParams;
  const query = rawQuery.trim();
  const tsQuery = buildTsQuery(query);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Brak / za krótkie zapytanie — prompt zamiast pustych wyników ────────
  if (!tsQuery) {
    return (
      <div className="search-page">
        <header className="search-page-header">
          <h1>Szukaj na BigBlog</h1>
          <SearchBar variant="hero" defaultValue={query} autoFocus />
        </header>
        <div className="empty-state">
          <SearchIcon size={48} className="empty-icon-svg" />
          <h3>Wpisz, czego szukasz</h3>
          <p>
            Przeszukamy tytuły i treści wszystkich postów. Wpisz minimum 2 znaki.
          </p>
        </div>
      </div>
    );
  }

  // ── 1. RPC — wyszukiwanie z rankingiem trafności ────────────────────────
  const { data: rpcData } = await supabase.rpc("search_posts", {
    search_query: tsQuery,
  });
  const matches = (rpcData ?? []) as { id: string; rank: number }[];
  const orderedIds = matches.map((m) => m.id);

  // ── 2. Pasujące tagi (po nazwie) — szybki podgląd nad wynikami ──────────
  const tagPattern = `%${query.replace(/[%_]/g, "")}%`;
  const { data: tagRows } = await supabase
    .from("tags")
    .select("id, name, slug, color")
    .ilike("name", tagPattern)
    .limit(6)
    .returns<TagInfo[]>();
  const matchingTags = tagRows ?? [];

  // ── 3. Pełne dane postów (autor + tagi + stan lajka) ────────────────────
  let postsWithState: PostWithLikeState[] = [];

  if (orderedIds.length > 0) {
    const { data: posts } = await supabase
      .from("posts")
      .select(
        `
        id, title, content, image_url, author_id, created_at, edited_at,
        likes_count, comments_count,
        author:profiles!author_id (id, nickname, email, avatar_url)
      `
      )
      .in("id", orderedIds)
      .returns<PostWithAuthor[]>();

    const byId = new Map((posts ?? []).map((p) => [p.id, p]));

    // Tagi postów
    const tagsByPostId = new Map<string, TagInfo[]>();
    if ((posts ?? []).length > 0) {
      const { data: pt } = await supabase
        .from("post_tags")
        .select("post_id, tag:tags(id, name, slug, color)")
        .in("post_id", orderedIds);

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

    // Stan lajków bieżącego usera
    let likedIds = new Set<string>();
    if (user) {
      const { data: myLikes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", orderedIds);
      likedIds = new Set(myLikes?.map((l) => l.post_id as string) ?? []);
    }

    // Zachowujemy kolejność z RPC (ranking trafności)
    postsWithState = orderedIds
      .map((id) => byId.get(id))
      .filter((p): p is PostWithAuthor => !!p)
      .map((p) => ({
        ...p,
        liked_by_me: likedIds.has(p.id),
        tags: tagsByPostId.get(p.id) ?? [],
      }));
  }

  const count = postsWithState.length;

  return (
    <div className="search-page">
      <header className="search-page-header">
        <h1>Wyniki wyszukiwania</h1>
        <SearchBar variant="hero" defaultValue={query} />
        <p className="search-summary">
          {count > 0 ? (
            <>
              Znaleziono <strong>{count}</strong> {postsLabel(count)} dla{" "}
              <strong>„{query}"</strong>
            </>
          ) : (
            <>
              Brak wyników dla <strong>„{query}"</strong>
            </>
          )}
        </p>
      </header>

      {matchingTags.length > 0 && (
        <div className="search-tags-hint">
          <span className="search-tags-hint-label">
            <TagIcon size={14} /> Pasujące tagi:
          </span>
          {matchingTags.map((tag) => (
            <Link
              key={tag.id}
              href={`/?tag=${encodeURIComponent(tag.slug)}`}
              className="tag-pill tag-pill-link"
              style={{ backgroundColor: tag.color ?? "var(--color-teal)" }}
            >
              <TagIcon size={11} />
              {tag.name}
            </Link>
          ))}
        </div>
      )}

      {count > 0 ? (
        <div className="posts-grid">
          {postsWithState.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id ?? null}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <SearchIcon size={48} className="empty-icon-svg" />
          <h3>Nic nie znaleziono</h3>
          <p>
            Spróbuj innych słów albo ogólniejszej frazy.
            {matchingTags.length > 0
              ? " Sprawdź też pasujące tagi powyżej."
              : ""}
          </p>
          <Link href="/" className="btn btn-primary">
            Wróć na stronę główną
          </Link>
        </div>
      )}
    </div>
  );
}
