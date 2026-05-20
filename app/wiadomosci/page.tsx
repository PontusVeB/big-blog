// Lista rozmów użytkownika. Dane z funkcji RPC `get_my_conversations`
// (ostatnia wiadomość + licznik nieprzeczytanych), profile drugich
// uczestników dociągamy osobnym zapytaniem.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeDate, getInitial } from "@/lib/posts/utils";
import type { ChatUser } from "@/lib/messages/types";

export const metadata: Metadata = {
  title: "Wiadomości",
};

type ConvRow = {
  conversation_id: string;
  other_user_id: string;
  last_message_content: string | null;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  unread_count: number;
};

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/logowanie?next=/wiadomosci");

  // Lista rozmów (RPC)
  const { data: rpcData } = await supabase.rpc("get_my_conversations");
  const rows = (rpcData ?? []) as ConvRow[];

  // Profile drugich uczestników — jednym zapytaniem
  const userMap = new Map<string, ChatUser>();
  if (rows.length > 0) {
    const ids = [...new Set(rows.map((r) => r.other_user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nickname, email, avatar_url")
      .in("id", ids);
    for (const p of profiles ?? []) {
      userMap.set(p.id as string, p as ChatUser);
    }
  }

  return (
    <div className="messages-page">
      <header className="messages-header">
        <h1>
          <Mail size={24} /> Wiadomości
        </h1>
      </header>

      {rows.length === 0 ? (
        <div className="empty-state">
          <Mail size={48} className="empty-icon-svg" />
          <h3>Brak rozmów</h3>
          <p>
            Nie masz jeszcze żadnych wiadomości. Wejdź na profil użytkownika
            i napisz do niego bezpośrednio.
          </p>
          <Link href="/" className="btn btn-primary">
            Przeglądaj posty
          </Link>
        </div>
      ) : (
        <ul className="conversation-list">
          {rows.map((row) => {
            const other = userMap.get(row.other_user_id);
            const name =
              other?.nickname ?? other?.email?.split("@")[0] ?? "użytkownik";
            const initial = getInitial(other?.nickname ?? other?.email);
            const mineLast = row.last_message_sender_id === user.id;
            const hasUnread = row.unread_count > 0;

            return (
              <li key={row.conversation_id}>
                <Link
                  href={`/wiadomosci/${row.other_user_id}`}
                  className={`conversation-item ${hasUnread ? "is-unread" : ""}`}
                >
                  {other?.avatar_url ? (
                    <img
                      src={other.avatar_url}
                      alt={name}
                      className="conversation-avatar"
                    />
                  ) : (
                    <span className="conversation-avatar conversation-avatar-letter">
                      {initial}
                    </span>
                  )}

                  <div className="conversation-main">
                    <div className="conversation-top">
                      <span className="conversation-name">{name}</span>
                      {row.last_message_at && (
                        <span className="conversation-time">
                          {formatRelativeDate(row.last_message_at)}
                        </span>
                      )}
                    </div>
                    <div className="conversation-preview">
                      {mineLast && <span className="conversation-you">Ty: </span>}
                      {row.last_message_content ?? "—"}
                    </div>
                  </div>

                  {hasUnread && (
                    <span className="conversation-badge">{row.unread_count}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
