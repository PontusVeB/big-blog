// Strona główna — Toller-themed.
// Faza 4 zastąpi placeholder kart prawdziwą integracją z postami z bazy
// (już mamy w aplikacji, tu hero + sekcje wprowadzające).

import Link from "next/link";
import { PawPrint, MessageCircle, ImagePlus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/post/PostCard";
import type { PostWithAuthor } from "@/lib/posts/types";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        <span className="badge badge-warm">
          <PawPrint size={14} /> Społeczność miłośników Tollerów
        </span>
        <h1>Tollerkowo</h1>
        <p>
          Miejsce, gdzie opiekunowie Tollerów dzielą się historiami,
          zdjęciami i radami. Sport, zdrowie, hodowla, codzienne życie z rasą —
          wszystko od ludzi, którzy żyją tym samym co Ty.
        </p>
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
            <PawPrint size={48} className="empty-icon-svg" />
            <h3>Bądź pierwszy</h3>
            <p>Nikt jeszcze nie napisał posta. Może opowiesz o swoim Tollerze?</p>
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

      {/* Sekcja "co znajdziesz" — pokazuje rodzaje treści, niezależnie od liczby postów */}
      <section className="features">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><MessageCircle size={24} /></div>
            <h4>Rozmowy</h4>
            <p>Pytaj, dziel się doświadczeniami z innymi opiekunami Tollerów.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><ImagePlus size={24} /></div>
            <h4>Zdjęcia</h4>
            <p>Wrzucaj fotki swojego pieska — w rumowiskach lub na kanapie.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Users size={24} /></div>
            <h4>Społeczność</h4>
            <p>Spotkania, treningi, hodowle — łączymy ludzi z tym samym hobby.</p>
          </div>
        </div>
      </section>
    </>
  );
}
