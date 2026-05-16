// Typy współdzielone dla modułu komentarzy.

export type CommentTargetType = "POST";

export type CommentAuthor = {
  id: string;
  nickname: string | null;
  email: string;
  avatar_url: string | null;
};

// Komentarz w postaci surowej z bazy.
export type CommentRow = {
  id: string;
  target_type: CommentTargetType;
  target_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  depth: number;
  is_deleted: boolean;
  likes_count: number;
  created_at: string;
  edited_at: string | null;
  author: CommentAuthor | null;
};

// Drzewo komentarzy + flaga "czy zalogowany user polubił".
// liked_by_me uzupełniane przez buildCommentTree na podstawie zbioru
// ID komentarzy które user polajkował (jedno zapytanie).
export type CommentNode = CommentRow & {
  children: CommentNode[];
  liked_by_me: boolean;
};
