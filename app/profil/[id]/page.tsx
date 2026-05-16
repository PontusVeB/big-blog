// Publiczny profil usera — hero + 4 statystyki + ostatnie posty (3) + ostatnie komentarze (3).
// Wszystkie liczniki to:
//   - Posty:                COUNT(*) z tabeli posts (autor=X)
//   - Komentarze:           COUNT(*) z comments (autor=X, NOT is_deleted)
//   - Polubienia oddane:    COUNT(*) z post_likes + comment_likes (user=X)
//   - Polubienia otrzymane: SUM(likes_count) na postach i komentarzach (autor=X)
// Wszystko równolegle w jednym Promise.all.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  UserCog, Calendar, FilePen, MessageCircle, Heart, HeartHandshake,
  Shield, Crown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/post/PostCard";
import RecentCommentItem from "@/components/profile/RecentCommentItem";
import type { PostWithAuthor, PostWithLikeState } from "@/lib/posts/types";

type ProfileData = {
  id: string;
  email: string;
  nickname: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: "MASTER" | "ADMIN" | "USER";
  created_at: string;
};

type UserComment = {
  id: string;
  content: string;
  target_id: string;
  likes_count: number;
  created_at: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("nickname, email")
    .eq("id", id)
    .single<{ nickname: string | null; email: string }>();
  if (!data) return { title: "Profil nie znaleziony" };
  const displayName = data.nickname ?? data.email.split("@")[0];
  return {
    title: displayName,
    description: `Profil użytkownika ${displayName} na Tollerkowie`,
  };
}

function pluralPL(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1) Profil i dane bieżącego usera — równolegle
  const [{ data: { user } }, { data: profile, error: profileErr }] =
    await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("profiles")
        .select("id, email, nickname, bio, avatar_url, role, created_at")
        .eq("id", id)
        .single<ProfileData>(),
    ]);

  if (profileErr || !profile) notFound();

  // 2) Wszystkie zapytania o statystyki — równolegle dla wydajności
  const [
    { data: userPosts },
    { data: userComments, count: commentsCount },
    { count: postLikesGiven },
    { count: commentLikesGiven },
  ] = await Promise.all([
    // Posty tego usera (wszystkie — do liczenia + 3 najnowsze do display)
    supabase
      .from("posts")
      .select(
        `
        id, title, content, image_url, author_id, created_at, edited_at,
        likes_count, comments_count,
        author:profiles!author_id (id, nickname, email, avatar_url)
      `
      )
      .eq("author_id", id)
      .order("created_at", { ascending: false })
      .returns<PostWithAuthor[]>(),
    // Komentarze tego usera (NOT deleted)
    supabase
      .from("comments")
      .select("id, content, target_id, likes_count, created_at", {
        count: "exact",
      })
      .eq("author_id", id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .returns<UserComment[]>(),
    // Polubienia postów oddane przez tego usera
    supabase
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", id),
    // Polubienia komentarzy oddane przez tego usera
    supabase
      .from("comment_likes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", id),
  ]);

  const posts = userPosts ?? [];
  const comments = userComments ?? [];

  // Liczniki agregowane po JS-ie (na bazie już pobranych danych)
  const postsCount = posts.length;
  const totalCommentsCount = commentsCount ?? comments.length;
  const totalLikesGiven = (postLikesGiven ?? 0) + (commentLikesGiven ?? 0);
  const postLikesReceived = posts.reduce((sum, p) => sum + p.likes_count, 0);
  const commentLikesReceived = comments.reduce(
    (sum, c) => sum + c.likes_count,
    0
  );
  const totalLikesReceived = postLikesReceived + commentLikesReceived;

  // 3) Posty/komentarze do wyświetlenia (3 najnowsze)
  const recentPosts = posts.slice(0, 3);
  const recentComments = comments.slice(0, 3);

  // 4) Lajki bieżącego usera na recent posts (do podświetlenia serc w PostCard)
  let likedIds = new Set<string>();
  if (user && recentPosts.length > 0) {
    const postIds = recentPosts.map((p) => p.id);
    const { data: myLikes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds);
    likedIds = new Set(myLikes?.map((l) => l.post_id as string) ?? []);
  }

  const recentPostsWithLikeState: PostWithLikeState[] = recentPosts.map((p) => ({
    ...p,
    liked_by_me: likedIds.has(p.id),
  }));

  // 5) Tytuły postów pod którymi są ostatnie komentarze (do wyświetlenia)
  const recentTargetIds = [...new Set(recentComments.map((c) => c.target_id))];
  let postTitlesMap = new Map<string, string>();
  if (recentTargetIds.length > 0) {
    const { data: relatedPosts } = await supabase
      .from("posts")
      .select("id, title")
      .in("id", recentTargetIds);
    postTitlesMap = new Map(
      relatedPosts?.map((p) => [p.id as string, p.title as string]) ?? []
    );
  }

  // Bookkeeping
  const isOwnProfile = user?.id === profile.id;
  const displayName =
    profile.nickname ?? profile.email.split("@")[0] ?? "anonim";
  const initial = (profile.nickname || profile.email)[0]?.toUpperCase() || "?";
  const joinedFormatted = new Date(profile.created_at).toLocaleDateString(
    "pl-PL",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <div className="profile-page">
      {/* ── HERO ─────────────────────────────────────── */}
      <section className="profile-hero">
        <div className="profile-avatar-wrap">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar profile-avatar-letter">{initial}</div>
          )}
        </div>
        <div className="profile-info">
          <h1 className="profile-name">
            <span>{displayName}</span>
            {profile.role === "MASTER" && (
              <span className="role-badge role-master">
                <Crown size={12} /> Master
              </span>
            )}
            {profile.role === "ADMIN" && (
              <span className="role-badge role-admin">
                <Shield size={12} /> Admin
              </span>
            )}
          </h1>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          <div className="profile-meta">
            <span>
              <Calendar size={14} /> Dołączył {joinedFormatted}
            </span>
          </div>
          {isOwnProfile && (
            <Link href="/profil/edycja" className="btn btn-secondary">
              <UserCog size={16} /> Edytuj profil
            </Link>
          )}
        </div>
      </section>

      {/* ── STATY (4 kafelki) ────────────────────────── */}
      <section className="profile-stats">
        <div className="stat-card">
          <FilePen size={20} className="stat-icon" />
          <div className="stat-value">{postsCount}</div>
          <div className="stat-label">
            {pluralPL(postsCount, "post", "posty", "postów")}
          </div>
        </div>
        <div className="stat-card">
          <MessageCircle size={20} className="stat-icon" />
          <div className="stat-value">{totalCommentsCount}</div>
          <div className="stat-label">
            {pluralPL(totalCommentsCount, "komentarz", "komentarze", "komentarzy")}
          </div>
        </div>
        <div className="stat-card">
          <HeartHandshake size={20} className="stat-icon" />
          <div className="stat-value">{totalLikesGiven}</div>
          <div className="stat-label">
            {pluralPL(totalLikesGiven, "polubienie oddane", "polubienia oddane", "polubień oddanych")}
          </div>
        </div>
        <div className="stat-card">
          <Heart size={20} className="stat-icon" />
          <div className="stat-value">{totalLikesReceived}</div>
          <div className="stat-label">
            {pluralPL(totalLikesReceived, "polubienie otrzymane", "polubienia otrzymane", "polubień otrzymanych")}
          </div>
        </div>
      </section>

      {/* ── OSTATNIE POSTY (3) ───────────────────────── */}
      <section className="profile-section">
        <div className="profile-section-header">
          <h2>Ostatnie posty</h2>
          {postsCount > 3 && (
            <span className="profile-section-more">
              i jeszcze {postsCount - 3}…
            </span>
          )}
        </div>
        {recentPostsWithLikeState.length > 0 ? (
          <div className="posts-grid">
            {recentPostsWithLikeState.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.id ?? null}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>
              {isOwnProfile
                ? "Nie napisałeś jeszcze żadnego posta."
                : `${displayName} nie napisał jeszcze żadnego posta.`}
            </p>
            {isOwnProfile && (
              <Link href="/posty/nowy" className="btn btn-primary">
                Napisz pierwszy
              </Link>
            )}
          </div>
        )}
      </section>

      {/* ── OSTATNIE KOMENTARZE (3) ──────────────────── */}
      <section className="profile-section">
        <div className="profile-section-header">
          <h2>Ostatnie komentarze</h2>
          {totalCommentsCount > 3 && (
            <span className="profile-section-more">
              i jeszcze {totalCommentsCount - 3}…
            </span>
          )}
        </div>
        {recentComments.length > 0 ? (
          <div className="recent-comments-list">
            {recentComments.map((c) => (
              <RecentCommentItem
                key={c.id}
                comment={c}
                postTitle={
                  postTitlesMap.get(c.target_id) ?? "(usunięty post)"
                }
              />
            ))}
          </div>
        ) : (
          <div className="empty-state empty-state-compact">
            <p>
              {isOwnProfile
                ? "Nie skomentowałeś jeszcze żadnego posta."
                : `${displayName} nie skomentował jeszcze żadnego posta.`}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
