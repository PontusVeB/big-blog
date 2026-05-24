// Strona główna — lista postów (po 6, z przyciskiem "Pokaż więcej") + filtr po tagach.
// Faza 22: FAB i CTA "Nowy post" widoczne tylko dla użytkowników z posts.create.

import Link from "next/link";
import { PenLine } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import TagsFilter from "@/components/tags/TagsFilter";
import NewPostFab from "@/components/post/NewPostFab";
import PostFeed from "@/components/post/PostFeed";
import { getFeedPosts } from "@/lib/posts/feed";
import { hasPermission, type Role } from "@/lib/auth/permissions";
import type { TagWithCount } from "@/lib/tags/types";

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

  // Pobieramy profil zalogowanego usera (potrzebujemy roli + permissions).
  // Tylko gdy user jest zalogowany — null dla anonimów.
  let canCreatePost = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, permissions")
      .eq("id", user.id)
      .single<{ role: Role; permissions: string[] | null }>();
    canCreatePost = hasPermission(profile, "posts.create");
  }

  // ── Tagi do paska filtrów (z liczbą postów) ─────────────────────────────
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

  const activeTag = activeSlug
    ? allTags.find((t) => t.slug === activeSlug) ?? null
    : null;

  // ── Pierwsza porcja postów (6) ──────────────────────────────────────────
  const { posts, hasMore } = await getFeedPosts({ tagSlug: activeSlug, offset: 0 });
  const hasPosts = posts.length > 0;
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
          <PostFeed
            initialPosts={posts}
            initialHasMore={hasMore}
            tagSlug={activeSlug}
            currentUserId={currentUserId}
          />
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
            ) : canCreatePost ? (
              <Link href="/posty/nowy" className="btn btn-primary">
                Napisz pierwszy post
              </Link>
            ) : user ? (
              // Zalogowany, ale bez uprawnień — nie pokazujemy "Napisz post"
              <p className="text-muted">
                Skontaktuj się z administratorem, żeby zacząć pisać posty.
              </p>
            ) : (
              <Link href="/rejestracja" className="btn btn-primary">
                Załóż konto
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Pływający przycisk — tylko dla tych z uprawnieniem posts.create */}
      {canCreatePost && <NewPostFab />}
    </>
  );
}
