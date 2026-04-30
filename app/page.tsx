// Strona główna — lista najnowszych postów.
// Server Component pobiera dane bezpośrednio z bazy (przez Supabase).

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/post/PostCard";
import type { PostWithAuthor } from "@/lib/posts/types";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pobieramy 20 najnowszych postów z autorami
  const { data: posts } = await supabase
    .from("posts")
    .select(
      `
      id, title, content, image_url, author_id, created_at, edited_at,
      author:profiles!author_id (id, nickname, email, avatar_url)
    `
    )
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<PostWithAuthor[]>();

  const hasPosts = posts && posts.length > 0;

  return (
    <>
      <section className="hero hero-compact">
        <span className="badge">Big Blog</span>
        <h1>Co u Ciebie?</h1>
        <p>Miejsce do dzielenia się myślami, zdjęciami i historiami.</p>
      </section>

      <section className="posts-feed">
        <div className="feed-header">
          <h2>{hasPosts ? "Najnowsze posty" : "Jeszcze nic tu nie ma"}</h2>
          {user && (
            <Link href="/posty/nowy" className="btn btn-primary">
              + Nowy post
            </Link>
          )}
        </div>

        {hasPosts ? (
          <div className="posts-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>Bądź pierwszy</h3>
            <p>Nikt jeszcze nie napisał posta. Może Ty?</p>
            {user ? (
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
    </>
  );
}
