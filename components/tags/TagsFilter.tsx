// Pasek filtrów po tagach na home (server component).
// Każdy chip to <Link> do /?tag=slug, aktywny ma "active" class.
// Plus przycisk "Wyczyść" wskakuje, gdy filtr jest aktywny.

import Link from "next/link";
import { Tag as TagIcon, X } from "lucide-react";
import type { TagWithCount } from "@/lib/tags/types";

type Props = {
  tags: TagWithCount[];
  /** Aktywny slug z URL (?tag=...). null oznacza brak filtra. */
  activeSlug: string | null;
};

export default function TagsFilter({ tags, activeSlug }: Props) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="tags-filter">
      <div className="tags-filter-header">
        <span className="tags-filter-label">
          <TagIcon size={14} /> Filtruj po tagu:
        </span>
        {activeSlug && (
          <Link href="/" className="tags-filter-clear" title="Wyczyść filtr">
            <X size={14} /> Wyczyść
          </Link>
        )}
      </div>

      <div className="tags-filter-chips">
        {tags.map((tag) => {
          const isActive = tag.slug === activeSlug;
          const style = isActive
            ? { backgroundColor: tag.color ?? "var(--color-accent)" }
            : { borderColor: tag.color ?? "var(--color-accent)" };

          return (
            <Link
              key={tag.id}
              href={isActive ? "/" : `/?tag=${encodeURIComponent(tag.slug)}`}
              className={`tag-chip ${isActive ? "tag-chip-active" : ""}`}
              style={style}
              title={
                isActive
                  ? "Kliknij, aby wyłączyć filtr"
                  : `Pokaż posty z tagiem "${tag.name}"`
              }
            >
              <span className="tag-chip-name">{tag.name}</span>
              <span className="tag-chip-count">{tag.posts_count}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
