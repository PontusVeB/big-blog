// Typy współdzielone dla modułu tagów.

export type TagInfo = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
};

export type TagWithCount = TagInfo & {
  posts_count: number;
};
