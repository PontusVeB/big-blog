// Drzewo komentarzy — buduje hierarchię i renderuje rekurencyjnie.
// Liczba komentarzy w nagłówku pochodzi z denormalizowanego licznika
// (posts.comments_count) — spójna z tym co widać na karcie.

import type { CommentRow, CommentTargetType } from "@/lib/comments/types";
import type { Role } from "@/lib/auth/permissions";
import { buildCommentTree, commentsLabel } from "@/lib/comments/utils";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";

type Props = {
  targetType: CommentTargetType;
  targetId: string;
  comments: CommentRow[];
  /** Liczba komentarzy z denormalizowanego licznika (target.comments_count).
      Spójna z licznikiem widocznym na karcie posta. */
  totalCount: number;
  viewer: { id: string; role: Role; permissions: string[] | null } | null;
};

export default function CommentTree({
  targetType,
  targetId,
  comments,
  totalCount,
  viewer,
}: Props) {
  const tree = buildCommentTree(comments);

  return (
    // id="comments" — umożliwia jump-link `/posty/<id>#comments` z karty posta
    <section id="comments" className="comments-section">
      <h3 className="comments-heading">{commentsLabel(totalCount)}</h3>

      {viewer ? (
        <CommentForm
          targetType={targetType}
          targetId={targetId}
          placeholder="Napisz komentarz…"
        />
      ) : (
        <div className="comments-login-prompt">
          <a href="/logowanie">Zaloguj się</a>, aby skomentować.
        </div>
      )}

      {tree.length > 0 && (
        <div className="comments-list">
          {tree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              targetType={targetType}
              targetId={targetId}
              viewer={viewer}
            />
          ))}
        </div>
      )}
    </section>
  );
}
