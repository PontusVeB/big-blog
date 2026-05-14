// Komponent drzewa komentarzy — server component.
// Buduje drzewo z płaskiej listy i renderuje rekurencyjnie przez CommentItem.
// Generyczny: targetType + targetId, więc działa pod postem, eventem, etc.

import type { CommentRow, CommentTargetType } from "@/lib/comments/types";
import type { Role } from "@/lib/auth/permissions";
import { buildCommentTree, commentsLabel } from "@/lib/comments/utils";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";

type Props = {
  targetType: CommentTargetType;
  targetId: string;
  comments: CommentRow[];
  viewer: { id: string; role: Role; permissions: string[] | null } | null;
};

export default function CommentTree({
  targetType,
  targetId,
  comments,
  viewer,
}: Props) {
  const tree = buildCommentTree(comments);
  // Liczymy nieusunięte do wyświetlenia w nagłówku
  const visibleCount = comments.filter((c) => !c.is_deleted).length;

  return (
    <section className="comments-section">
      <h3 className="comments-heading">{commentsLabel(visibleCount)}</h3>

      {/* Formularz nowego komentarza (root level) */}
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

      {/* Lista komentarzy — drzewo */}
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
