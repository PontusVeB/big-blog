"use client";
// Pojedyncze powiadomienie. Klik = mark read + nawigacja do źródła.

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, CornerDownRight, Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  markNotificationRead,
  deleteNotification,
} from "@/lib/notifications/actions";
import { formatRelativeDate, getInitial } from "@/lib/posts/utils";
import type {
  NotificationRow,
  CommentSourceInfo,
} from "@/lib/notifications/types";

type Props = {
  notification: NotificationRow;
  comment: CommentSourceInfo | undefined;
  postTitle: string | undefined;
};

function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

export default function NotificationItem({
  notification,
  comment,
  postTitle,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const actor = notification.actor;
  const actorName =
    actor?.nickname ?? actor?.email?.split("@")[0] ?? "Ktoś";
  const actorInitial = getInitial(actor?.nickname ?? actor?.email);

  // Cel nawigacji:
  //  - LIKE_ON_POST → source_id JEST id posta,
  //  - reszta (powiadomienia "komentarzowe") → post, na którym jest komentarz.
  const targetHref =
    notification.type === "LIKE_ON_POST" && notification.source_id
      ? `/posty/${notification.source_id}`
      : comment?.target_id
      ? `/posty/${comment.target_id}#comments`
      : "/";

  function handleNavigate(e: React.MouseEvent) {
    e.preventDefault();
    startTransition(async () => {
      if (!notification.is_read) {
        await markNotificationRead(notification.id);
      }
      router.push(targetHref);
    });
  }

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await deleteNotification(notification.id);
      if (result.error) toast.error(result.error);
    });
  }

  // Tekst zależny od typu
  let summary: React.ReactNode;
  let typeIcon: React.ReactNode;
  switch (notification.type) {
    case "COMMENT_ON_POST":
      typeIcon = <MessageCircle size={14} className="notif-type-icon" />;
      summary = (
        <>
          <strong>{actorName}</strong> skomentował Twój post
          {postTitle && (
            <>
              {" "}
              <strong className="notif-target">«{postTitle}»</strong>
            </>
          )}
        </>
      );
      break;
    case "REPLY_TO_COMMENT":
      typeIcon = <CornerDownRight size={14} className="notif-type-icon" />;
      summary = (
        <>
          <strong>{actorName}</strong> odpowiedział na Twój komentarz
          {postTitle && (
            <>
              {" "}pod{" "}
              <strong className="notif-target">«{postTitle}»</strong>
            </>
          )}
        </>
      );
      break;
    case "LIKE_ON_POST":
      typeIcon = <Heart size={14} className="notif-type-icon" />;
      summary = (
        <>
          <strong>{actorName}</strong> polubił Twój post
          {postTitle && (
            <>
              {" "}
              <strong className="notif-target">«{postTitle}»</strong>
            </>
          )}
        </>
      );
      break;
    case "LIKE_ON_COMMENT":
      typeIcon = <Heart size={14} className="notif-type-icon" />;
      summary = (
        <>
          <strong>{actorName}</strong> polubił Twój komentarz
          {postTitle && (
            <>
              {" "}pod{" "}
              <strong className="notif-target">«{postTitle}»</strong>
            </>
          )}
        </>
      );
      break;
  }

  return (
    <a
      href={targetHref}
      onClick={handleNavigate}
      className={`notification-item${notification.is_read ? "" : " notif-unread"}`}
      aria-label={`Powiadomienie od ${actorName}`}
    >
      {actor?.avatar_url ? (
        <img
          src={actor.avatar_url}
          alt={actorName}
          className="avatar avatar-sm notif-avatar"
        />
      ) : (
        <span className="avatar avatar-sm notif-avatar">{actorInitial}</span>
      )}

      <div className="notif-content">
        <div className="notif-summary">
          {typeIcon}
          <span>{summary}</span>
        </div>
        {comment && !comment.is_deleted && (
          <blockquote className="notif-excerpt">
            {truncate(comment.content)}
          </blockquote>
        )}
        {comment?.is_deleted && (
          <blockquote className="notif-excerpt notif-excerpt-deleted">
            <em>[komentarz został usunięty]</em>
          </blockquote>
        )}
        <div className="notif-meta">
          <span>{formatRelativeDate(notification.created_at)}</span>
          {!notification.is_read && <span className="notif-unread-dot" aria-label="Nieprzeczytane" />}
        </div>
      </div>

      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="notif-delete-btn"
        aria-label="Usuń powiadomienie"
        title="Usuń powiadomienie"
      >
        <Trash2 size={14} />
      </button>
    </a>
  );
}
