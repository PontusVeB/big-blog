"use client";
// Wątek rozmowy — lista wiadomości (bąbelki) + pole do pisania z emotkami.
//
// Bez realtime (to Faza 15): po wysłaniu wołamy router.refresh(), co odświeża
// serwerowy komponent strony i pobiera nową wiadomość. Druga osoba zobaczy ją
// dopiero po odświeżeniu strony.

import { Fragment, useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Smile, Send } from "lucide-react";
import { toast } from "sonner";
import type { EmojiClickData } from "emoji-picker-react";
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
  const [content, setContent] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const otherName = otherUser.nickname ?? otherUser.email.split("@")[0];

  // Oznaczamy rozmowę jako przeczytaną po wejściu w wątek.
  useEffect(() => {
    if (!conversationId) return;
    markConversationRead(conversationId).then(() => router.refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Przewijamy na dół przy każdej zmianie liczby wiadomości.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [initialMessages.length]);

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
      setContent("");
      setShowEmoji(false);
      router.refresh();
    });
  }

  let lastDay = "";

  return (
    <div className="chat-thread">
      {/* ── Lista wiadomości ─────────────────────────────── */}
      <div className="chat-messages">
        {initialMessages.length === 0 ? (
          <div className="chat-empty">
            <p>To początek Twojej rozmowy z {otherName}.</p>
            <p className="chat-empty-hint">Napisz pierwszą wiadomość poniżej.</p>
          </div>
        ) : (
          initialMessages.map((msg) => {
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
