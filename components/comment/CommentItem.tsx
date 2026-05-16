"use client";
// Pojedynczy komentarz — z lajkiem, reply, edycją, usuwaniem.
// Avatar i nick autora są klikalnymi linkami do /profil/[author_id]
// (poza komentarzami soft-deleted — tam autor jest zanonimizowany).

import { useState, useTransition } from "react";
import Link from "next/link";
import { CornerDownRight, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { updateComment, deleteComment } from "@/lib/comments/actions";
import { canEditComment, canDeleteComment, MAX_COMMENT_DEPTH } from "@/lib/comments/permissions";
import { formatRelativeDate, getInitial } from "@/lib/posts/utils";
import type { CommentNode, CommentTargetType } from "@/lib/comments/types";
import type { Role } from "@/lib/auth/permissions";
import LikeButton from "@/components/post/LikeButton";
import CommentForm from "./CommentForm";

type Props = {
  comment: CommentNode;
  targetType: CommentTargetType;
  targetId: string;
  viewer: { id: string; role: Role; permissions: string[] | null } | null;
};

export default function CommentItem({
  comment,
  targetType,
  targetId,
  viewer,
}: Props) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [, startTransition] = useTransition();

  const canEdit = canEditComment(viewer, comment);
  const canDelete = canDeleteComment(viewer, comment);
  const canReply = !!viewer && !comment.is_deleted && comment.depth < MAX_COMMENT_DEPTH;
  const isOwnComment = !!viewer && viewer.id === comment.author_id;

  const authorName = comment.is_deleted
    ? "[użytkownik]"
    : comment.author?.nickname ??
      comment.author?.email?.split("@")[0] ??
      "anonim";
  const initial = comment.is_deleted
    ? "—"
    : getInitial(comment.author?.nickname ?? comment.author?.email);

  function handleSaveEdit() {
    startTransition(async () => {
      const result = await updateComment(comment.id, editContent);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Komentarz zaktualizowany");
        setEditOpen(false);
      }
    });
  }

  function handleDelete() {
    if (!confirm("Na pewno usunąć ten komentarz?")) return;
    startTransition(async () => {
      const result = await deleteComment(comment.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.info("Komentarz usunięty");
      }
    });
  }

  // Element awatara — wybieramy między imgiem a fallbackiem z literką
  const avatarEl =
    !comment.is_deleted && comment.author?.avatar_url ? (
      <img
        src={comment.author.avatar_url}
        alt={authorName}
        className="avatar avatar-sm"
      />
    ) : (
      <span className="avatar avatar-sm comment-avatar-placeholder">{initial}</span>
    );

  return (
    <div className={`comment${comment.is_deleted ? " comment-deleted" : ""}`}>
      <div className="comment-row">
        {/* Avatar — link do profilu (poza deleted) */}
        {comment.is_deleted ? (
          avatarEl
        ) : (
          <Link href={`/profil/${comment.author_id}`} aria-label={authorName} className="comment-avatar-link">
            {avatarEl}
          </Link>
        )}

        <div className="comment-content">
          <div className="comment-head">
            {/* Nick — też link do profilu */}
            {comment.is_deleted ? (
              <span className="nick">{authorName}</span>
            ) : (
              <Link href={`/profil/${comment.author_id}`} className="comment-author-link">
                <span className="nick">{authorName}</span>
              </Link>
            )}
            <span className="time">{formatRelativeDate(comment.created_at)}</span>
            {comment.edited_at && !comment.is_deleted && (
              <span className="badge-edited">(edytowane)</span>
            )}
          </div>

          {editOpen ? (
            <div className="comment-edit">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={2000}
                className="input"
                rows={3}
              />
              <div className="comment-edit-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setEditContent(comment.content);
                    setEditOpen(false);
                  }}
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveEdit}
                >
                  Zapisz
                </button>
              </div>
            </div>
          ) : (
            <div className="comment-body">
              {comment.is_deleted ? (
                <em>[komentarz usunięty]</em>
              ) : (
                comment.content
              )}
            </div>
          )}

          {!editOpen && !comment.is_deleted && (
            <div className="comment-actions">
              <LikeButton
                targetType="comment"
                targetId={comment.id}
                initialLiked={comment.liked_by_me}
                initialCount={comment.likes_count}
                isLoggedIn={!!viewer}
                isOwnContent={isOwnComment}
                variant="compact"
              />
              {canReply && (
                <button
                  type="button"
                  className="comment-action-btn"
                  onClick={() => setReplyOpen((s) => !s)}
                >
                  {replyOpen ? <X size={14} /> : <CornerDownRight size={14} />}
                  {replyOpen ? "Anuluj" : "Odpowiedz"}
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  className="comment-action-btn"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil size={14} /> Edytuj
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  className="comment-action-btn comment-action-danger"
                  onClick={handleDelete}
                >
                  <Trash2 size={14} /> Usuń
                </button>
              )}
            </div>
          )}

          {replyOpen && (
            <div className="comment-reply-wrapper">
              <CommentForm
                targetType={targetType}
                targetId={targetId}
                parentId={comment.id}
                placeholder={`Odpowiedz ${authorName}…`}
                autoFocus
                onCancel={() => setReplyOpen(false)}
                onSuccess={() => setReplyOpen(false)}
              />
            </div>
          )}

          {comment.children.length > 0 && (
            <div className="comment-children">
              {comment.children.map((child) => (
                <CommentItem
                  key={child.id}
                  comment={child}
                  targetType={targetType}
                  targetId={targetId}
                  viewer={viewer}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
