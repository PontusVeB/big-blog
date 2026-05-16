// Drzewo komentarzy — budowa hierarchii + render.
// Przyjmuje set ID komentarzy które aktualny user polajkował.

import type { CommentRow, CommentTargetType } from "@/lib/comments/types";
import type { Role } from "@/lib/auth/permissions";
import { buildCommentTree, commentsLabel } from "@/lib/comments/utils";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";

type Props = {
  targetType: CommentTargetType;
  targetId: string;
  comments: CommentRow[];
  /** Set ID komentarzy które zalogowany user polubił */
  likedCommentIds: Set<string>;
  /** Liczba komentarzy z denormalizowanego licznika (target.comments_count) */
  totalCount: number;
  viewer: { id: string; role: Role; permissions: string[] | null } | null;
};

export default function CommentTree({
  targetType,
  targetId,
  comments,
  likedCommentIds,
  totalCount,
  viewer,
}: Props) {
  const tree = buildCommentTree(comments, likedCommentIds);

  return (
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
