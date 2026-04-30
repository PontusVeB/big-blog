// Typy współdzielone dla modułu postów.
// Definiujemy ręcznie zamiast generować z Supabase, bo dla MVP wystarczy.
// W przyszłości można dorzucić `npx supabase gen types` dla pełnej automatyki.

export type PostAuthor = {
  id: string;
  nickname: string | null;
  email: string;
  avatar_url: string | null;
};

export type PostWithAuthor = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  author_id: string;
  created_at: string;
  edited_at: string | null;
  author: PostAuthor | null;
};
