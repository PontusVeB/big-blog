// Strona /popularne — najpopularniejsze posty z ostatnich 30 dni.
// Dwie sekcje: "Najbardziej lubiane" (wg lajków) i "Gorące tematy" (wg komentarzy).
// Dane z denormalizowanych liczników na `posts` — bez ciężkich zapytań.

import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/post/PostCard";
import { getTopPosts } from "@/lib/posts/feed";

export const metadata: Metadata = {
  title: "Popularne",
};

const WINDOW_DAYS = 30;
const TOP_LIMIT = 3;

export default async function PopularPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  // Obie sekcje równolegle
  const [mostLiked, hottest] = await Promise.all([
    getTopPosts({ metric: "likes", days: WINDOW_DAYS, limit: TOP_LIMIT, currentUserId }),
    getTopPosts({ metric: "comments", days: WINDOW_DAYS, limit: TOP_LIMIT, currentUserId }),
  ]);

  return (
    <div className="popular-page">
      <header className="popular-header">
        <h1>Popularne</h1>
        <p>Najciekawsze posty z ostatnich {WINDOW_DAYS} dni.</p>
      </header>

      {/* ── Najbardziej lubiane ───────────────────────────── */}
      <section className="popular-section">
        <h2 className="popular-section-title">
          <Heart size={20} /> Najbardziej lubiane
        </h2>
        {mostLiked.length > 0 ? (
          <div className="posts-grid">
            {mostLiked.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={currentUserId} />
            ))}
          </div>
        ) : (
          <p className="popular-empty">
            Za mało polubień w ostatnich {WINDOW_DAYS} dniach.
          </p>
        )}
      </section>

      {/* ── Gorące tematy ─────────────────────────────────── */}
      <section className="popular-section">
        <h2 className="popular-section-title">
          <Flame size={20} /> Gorące tematy
        </h2>
        {hottest.length > 0 ? (
          <div className="posts-grid">
            {hottest.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={currentUserId} />
            ))}
          </div>
        ) : (
          <p className="popular-empty">
            Za mało dyskusji w ostatnich {WINDOW_DAYS} dniach.
          </p>
        )}
      </section>

      <div className="popular-cta">
        <Link href="/" className="btn btn-secondary">
          Zobacz wszystkie posty
        </Link>
      </div>
    </div>
  );
}
