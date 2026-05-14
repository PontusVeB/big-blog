// Typy współdzielone dla modułu komentarzy.

export type CommentTargetType = "POST"; // future: "EVENT" | "RECIPE" | ...

export type CommentAuthor = {
  id: string;
  nickname: string | null;
  email: string;
  avatar_url: string | null;
};

// Komentarz w postaci jaką dostajemy z Supabase (płaski, z autorem zagnieżdżonym)
export type CommentRow = {
  id: string;
  target_type: CommentTargetType;
  target_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  depth: number;
  is_deleted: boolean;
  created_at: string;
  edited_at: string | null;
  author: CommentAuthor | null;
};

// Drzewo komentarzy zbudowane przez utils/buildTree — komentarz z dziećmi
export type CommentNode = CommentRow & {
  children: CommentNode[];
};
