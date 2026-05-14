"use client";
// Pojedynczy komentarz w drzewie. Renderuje się rekurencyjnie dla dzieci.
// State po stronie klienta: tryb odpowiedzi (toggle), tryb edycji (toggle).

import { useState, useTransition } from "react";
import { CornerDownRight, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { updateComment, deleteComment } from "@/lib/comments/actions";
import { canEditComment, canDeleteComment, MAX_COMMENT_DEPTH } from "@/lib/comments/permissions";
import { formatRelativeDate, getInitial } from "@/lib/posts/utils";
import type { CommentNode, CommentTargetType } from "@/lib/comments/types";
import type { Role } from "@/lib/auth/permissions";
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

  return (
    <div className={`comment${comment.is_deleted ? " comment-deleted" : ""}`}>
      <div className="comment-row">
        {!comment.is_deleted && comment.author?.avatar_url ? (
          <img
            src={comment.author.avatar_url}
            alt={authorName}
            className="avatar avatar-sm"
          />
        ) : (
          <span className="avatar avatar-sm comment-avatar-placeholder">
            {initial}
          </span>
        )}

        <div className="comment-content">
          <div className="comment-head">
            <span className="nick">{authorName}</span>
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

          {/* Rekurencyjny render dzieci */}
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
