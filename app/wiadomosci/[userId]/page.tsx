// Wątek rozmowy 1:1 z konkretnym użytkownikiem (/wiadomosci/[userId]).
// [userId] to ID DRUGIEJ osoby. Rozmowa może jeszcze nie istnieć —
// powstaje przy pierwszej wysłanej wiadomości (w Server Action).

import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getInitial } from "@/lib/posts/utils";
import { canonicalPair } from "@/lib/messages/utils";
import MessageThread from "@/components/messages/MessageThread";
import BlockButton from "@/components/messages/BlockButton";
import type { MessageRow, ChatUser } from "@/lib/messages/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("nickname, email")
    .eq("id", userId)
    .maybeSingle<{ nickname: string | null; email: string }>();
  if (!data) return { title: "Rozmowa" };
  const name = data.nickname ?? data.email.split("@")[0];
  return { title: `Rozmowa z ${name}` };
}

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/logowanie?next=/wiadomosci/${userId}`);
  if (userId === user.id) redirect("/wiadomosci");

  // Druga osoba
  const { data: otherUser } = await supabase
    .from("profiles")
    .select("id, nickname, email, avatar_url")
    .eq("id", userId)
    .maybeSingle<ChatUser>();
  if (!otherUser) notFound();

  // Rozmowa (para w porządku kanonicznym) — może nie istnieć
  const [u1, u2] = canonicalPair(user.id, userId);
  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("user1_id", u1)
    .eq("user2_id", u2)
    .maybeSingle<{ id: string }>();

  // Wiadomości — ostatnie 100, w kolejności rosnącej (od najstarszej)
  let messages: MessageRow[] = [];
  if (conv) {
    const { data: msgs } = await supabase
      .from("messages")
      .select(
        "id, conversation_id, sender_id, recipient_id, content, read_at, created_at"
      )
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<MessageRow[]>();
    messages = (msgs ?? []).reverse();
  }

  // Czy JA zablokowałem tę osobę (jej blokad na mnie celowo nie sprawdzamy)
  const { data: block } = await supabase
    .from("blocked_users")
    .select("blocker_id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", userId)
    .maybeSingle();
  const iBlockedThem = !!block;

  const name = otherUser.nickname ?? otherUser.email.split("@")[0];
  const initial = getInitial(otherUser.nickname ?? otherUser.email);

  return (
    <div className="chat-page">
      <header className="chat-header">
        <Link href="/wiadomosci" className="chat-back" aria-label="Wróć do rozmów">
          <ArrowLeft size={20} />
        </Link>

        <Link href={`/profil/${otherUser.id}`} className="chat-header-user">
          {otherUser.avatar_url ? (
            <img
              src={otherUser.avatar_url}
              alt={name}
              className="avatar avatar-sm"
            />
          ) : (
            <span className="avatar avatar-sm">{initial}</span>
          )}
          <span className="chat-header-name">{name}</span>
        </Link>

        <BlockButton targetId={otherUser.id} initiallyBlocked={iBlockedThem} />
      </header>

      {/* key = ID rozmówcy → zmiana wątku to świeży mount (czysty stan,
          świeża subskrypcja Realtime, pusty kompozytor). */}
      <MessageThread
        key={otherUser.id}
        initialMessages={messages}
        otherUser={otherUser}
        currentUserId={user.id}
        conversationId={conv?.id ?? null}
        iBlockedThem={iBlockedThem}
      />
    </div>
  );
}
