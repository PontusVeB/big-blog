// Wyświetlanie listy tagów posta jako klikalne pille.
// Server component — każdy tag prowadzi do /?tag=slug (filtr na home).
//
// Wariant "inline" (compact) używany w PostCard pod meta,
// wariant "block" używany na stronie szczegółów posta.

import Link from "next/link";
import { Tag as TagIcon } from "lucide-react";
import type { TagInfo } from "@/lib/tags/types";

type Props = {
  tags: TagInfo[];
  variant?: "inline" | "block";
  /** Jeśli true, pille NIE są klikalne (np. w karcie posta, gdzie cała karta to link). */
  staticDisplay?: boolean;
};

export default function PostTags({
  tags,
  variant = "inline",
  staticDisplay = false,
}: Props) {
  if (!tags || tags.length === 0) return null;

  const className = `tags-pills tags-pills-${variant}`;

  return (
    <div className={className}>
      {tags.map((tag) => {
        const style = { backgroundColor: tag.color ?? "var(--color-accent)" };

        if (staticDisplay) {
          return (
            <span key={tag.id} className="tag-pill" style={style}>
              <TagIcon size={11} />
              {tag.name}
            </span>
          );
        }

        return (
          <Link
            key={tag.id}
            href={`/?tag=${encodeURIComponent(tag.slug)}`}
            className="tag-pill tag-pill-link"
            style={style}
            title={`Pokaż posty z tagiem "${tag.name}"`}
          >
            <TagIcon size={11} />
            {tag.name}
          </Link>
        );
      })}
    </div>
  );
}
