"use client";
// Wątek rozmowy — lista wiadomości (bąbelki) + pole do pisania z emotkami.
//
// Realtime (Faza 15 + poprawka Fazy 16):
//  - lokalny stan `messages` (seed z initialMessages),
//  - subskrypcja Supabase Realtime na INSERT do tabeli messages,
//  - PRZED subskrypcją pobieramy sesję i ustawiamy token Realtime —
//    inaczej po F5 kanał subskrybuje się jako "anon" i RLS blokuje zdarzenia.

import { Fragment, useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Smile, Send } from "lucide-react";
import { toast } from "sonner";
import type { EmojiClickData } from "emoji-picker-react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, markConversationRead } from "@/lib/messages/actions";
import { formatMessageTime, formatMessageDay } from "@/lib/messages/utils";
import type { MessageRow, ChatUser } from "@/lib/messages/types";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => <div className="emoji-loading">Ładowanie emoji…</div>,
});

type Props = {
  initialMessages: MessageRow[];
  otherUser: ChatUser;
  currentUserId: string;
  conversationId: string | null;
  iBlockedThem: boolean;
};

export default function MessageThread({
  initialMessages,
  otherUser,
  currentUserId,
  conversationId,
  iBlockedThem,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [content, setContent] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const otherName = otherUser.nickname ?? otherUser.email.split("@")[0];

  // Dopisuje wiadomość do listy, pomijając duplikaty (po id).
  function appendMessage(msg: MessageRow) {
    setMessages((prev) =>
      prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
    );
  }

  // Oznaczamy rozmowę jako przeczytaną po wejściu w wątek.
  // router.refresh() odświeża też navbar (licznik koperty spada).
  useEffect(() => {
    if (!conversationId) return;
    markConversationRead(conversationId).then(() => router.refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // ── Subskrypcja Realtime — nowe wiadomości DO mnie ──────────────
  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let active = true;

    (async () => {
      // KLUCZOWE: po F5 sesja wczytuje się z cookies asynchronicznie.
      // Najpierw ją pobieramy i ustawiamy token Realtime — dopiero potem
      // subskrybujemy, żeby kanał działał jako zalogowany user (RLS).
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }

      channel = supabase
        .channel(`thread-${currentUserId}-${otherUser.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `recipient_id=eq.${currentUserId}`,
          },
          (payload) => {
            const msg = payload.new as MessageRow;
            // Interesują nas tylko wiadomości od osoby z TEGO wątku.
            if (msg.sender_id !== otherUser.id) return;
            appendMessage(msg);
            // Wątek otwarty → od razu oznaczamy jako przeczytane.
            markConversationRead(msg.conversation_id);
          }
        )
        .subscribe();
    })();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, otherUser.id]);

  // Przewijamy na dół przy każdej nowej wiadomości.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleEmojiClick(emojiData: EmojiClickData) {
    const ta = textareaRef.current;
    if (!ta) {
      setContent((prev) => prev + emojiData.emoji);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    setContent(content.slice(0, start) + emojiData.emoji + content.slice(end));
    setTimeout(() => {
      ta.focus();
      const cursor = start + emojiData.emoji.length;
      ta.setSelectionRange(cursor, cursor);
    }, 0);
  }

  function handleSend() {
    const text = content.trim();
    if (!text || isPending) return;
    startTransition(async () => {
      const res = await sendMessage(otherUser.id, text);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      // Własną wiadomość dopisujemy od razu (Realtime jej nam nie wyśle —
      // filtr to recipient_id = ja, a tu odbiorcą jest druga osoba).
      if (res.message) appendMessage(res.message);
      setContent("");
      setShowEmoji(false);
    });
  }

  let lastDay = "";

  return (
    <div className="chat-thread">
      {/* ── Lista wiadomości ─────────────────────────────── */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>To początek Twojej rozmowy z {otherName}.</p>
            <p className="chat-empty-hint">Napisz pierwszą wiadomość poniżej.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const day = formatMessageDay(msg.created_at);
            const showDay = day !== lastDay;
            lastDay = day;
            const mine = msg.sender_id === currentUserId;
            return (
              <Fragment key={msg.id}>
                {showDay && <div className="chat-day">{day}</div>}
                <div className={`chat-bubble-row ${mine ? "mine" : "theirs"}`}>
                  <div className="chat-bubble">
                    <p className="chat-bubble-text">{msg.content}</p>
                    <span className="chat-bubble-time">
                      {formatMessageTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              </Fragment>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Pole do pisania (lub komunikat o blokadzie) ──── */}
      {iBlockedThem ? (
        <div className="chat-blocked-notice">
          Zablokowałeś tego użytkownika. Odblokuj go w nagłówku rozmowy, aby
          móc pisać.
        </div>
      ) : (
        <div className="chat-composer">
          {showEmoji && (
            <div className="chat-emoji-wrapper">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme={"dark" as never}
                width="100%"
                height={320}
                searchPlaceHolder="Szukaj emoji..."
                previewConfig={{ showPreview: false }}
              />
            </div>
          )}
          <div className="chat-composer-row">
            <button
              type="button"
              className="chat-emoji-toggle"
              onClick={() => setShowEmoji((s) => !s)}
              aria-label="Wstaw emoji"
              title="Wstaw emoji"
            >
              <Smile size={20} />
            </button>
            <textarea
              ref={textareaRef}
              className="chat-input"
              placeholder={`Napisz do ${otherName}…`}
              value={content}
              rows={1}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              type="button"
              className="chat-send-btn"
              onClick={handleSend}
              disabled={isPending || content.trim().length === 0}
              aria-label="Wyślij wiadomość"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="chat-composer-hint">
            Enter wysyła • Shift + Enter dodaje nową linię
          </div>
        </div>
      )}
    </div>
  );
}
