// Element pojedynczego komentarza w sekcji "Ostatnie komentarze" na profilu.
// Klik prowadzi do posta pod którym ten komentarz wisi (do sekcji #comments).
// Bez wątku, bez zagnieżdżeń — tylko treść + meta + tytuł rodzica.

import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { formatRelativeDate } from "@/lib/posts/utils";

type Props = {
  comment: {
    id: string;
    content: string;
    target_id: string;
    likes_count: number;
    created_at: string;
  };
  postTitle: string;
};

function truncate(text: string, max = 220): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + "…";
}

export default function RecentCommentItem({ comment, postTitle }: Props) {
  return (
    <Link
      href={`/posty/${comment.target_id}#comments`}
      className="recent-comment"
    >
      <div className="recent-comment-icon">
        <MessageCircle size={16} />
      </div>
      <div className="recent-comment-content">
        <p className="recent-comment-body">{truncate(comment.content)}</p>
        <div className="recent-comment-meta">
          <span className="recent-comment-target">
            Pod: <strong>{postTitle}</strong>
          </span>
          <span className="recent-comment-time">
            {formatRelativeDate(comment.created_at)}
          </span>
          {comment.likes_count > 0 && (
            <span className="recent-comment-likes">
              <Heart size={12} fill="currentColor" /> {comment.likes_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
