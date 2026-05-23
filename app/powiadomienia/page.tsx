// Strona /powiadomienia — lista powiadomień użytkownika.
// Fetchujemy max 50 ostatnich, joinujemy actor profile + dociągamy źródła:
//   - komentarze (dla powiadomień COMMENT_ON_POST / REPLY_TO_COMMENT / LIKE_ON_COMMENT),
//   - tytuły postów (dla kontekstu — w tym posty polubione bezpośrednio: LIKE_ON_POST).

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bell, BellOff } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import NotificationItem from "@/components/notifications/NotificationItem";
import MarkAllReadButton from "@/components/notifications/MarkAllReadButton";
import type {
  NotificationRow,
  CommentSourceInfo,
} from "@/lib/notifications/types";

export const metadata: Metadata = {
  title: "Powiadomienia",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/logowanie?next=/powiadomienia");

  // 1. Pobierz powiadomienia + autor akcji (actor)
  const { data: notificationsData } = await supabase
    .from("notifications")
    .select(
      `
      id, type, source_type, source_id, is_read, created_at,
      actor:profiles!actor_id (id, nickname, email, avatar_url)
    `
    )
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<NotificationRow[]>();

  const notifications = notificationsData ?? [];

  // 2. Pobierz komentarze (źródła) — w 1 zapytaniu dla wszystkich powiadomień
  //    komentarzowych (COMMENT_ON_POST / REPLY_TO_COMMENT / LIKE_ON_COMMENT)
  const commentIds = notifications
    .filter((n) => n.source_type === "comment" && n.source_id)
    .map((n) => n.source_id as string);

  let commentMap = new Map<string, CommentSourceInfo>();

  if (commentIds.length > 0) {
    const { data: comments } = await supabase
      .from("comments")
      .select("id, content, target_id, is_deleted")
      .in("id", commentIds)
      .returns<CommentSourceInfo[]>();
    if (comments) {
      commentMap = new Map(comments.map((c) => [c.id, c]));
    }
  }

  // 3. Zbierz ID postów potrzebnych do tytułów:
  //    - posty, na których są komentarze (target_id z commentMap),
  //    - posty polubione bezpośrednio (LIKE_ON_POST → source_id).
  const postIds = new Set<string>();
  for (const c of commentMap.values()) postIds.add(c.target_id);
  for (const n of notifications) {
    if (n.type === "LIKE_ON_POST" && n.source_id) postIds.add(n.source_id);
  }

  let postTitleMap = new Map<string, string>();
  if (postIds.size > 0) {
    const { data: posts } = await supabase
      .from("posts")
      .select("id, title")
      .in("id", [...postIds]);
    postTitleMap = new Map(
      posts?.map((p) => [p.id as string, p.title as string]) ?? []
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="notifications-page">
      <header className="notifications-header">
        <div>
          <h1>
            <Bell size={28} /> Powiadomienia
          </h1>
          <p className="notifications-subtitle">
            {unreadCount > 0
              ? `Masz ${unreadCount} ${
                  unreadCount === 1 ? "nieprzeczytane powiadomienie" : "nieprzeczytane"
                }.`
              : "Wszystkie powiadomienia są przeczytane."}
          </p>
        </div>
        <MarkAllReadButton hasUnread={unreadCount > 0} />
      </header>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <BellOff size={48} className="empty-icon-svg" />
          <h3>Cisza w eterze</h3>
          <p>Brak powiadomień. Gdy ktoś zareaguje na Twoje treści, pojawią się tutaj.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => {
            const comment =
              n.source_type === "comment" && n.source_id
                ? commentMap.get(n.source_id)
                : undefined;
            // Tytuł posta dla kontekstu:
            //  - LIKE_ON_POST → źródłem jest sam post,
            //  - reszta → post, na którym leży komentarz.
            const postTitle =
              n.type === "LIKE_ON_POST" && n.source_id
                ? postTitleMap.get(n.source_id)
                : comment
                ? postTitleMap.get(comment.target_id)
                : undefined;
            return (
              <NotificationItem
                key={n.id}
                notification={n}
                comment={comment}
                postTitle={postTitle}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
