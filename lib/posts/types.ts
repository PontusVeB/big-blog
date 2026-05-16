// Typy współdzielone dla modułu postów.

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
  likes_count: number;
  comments_count: number;
  author: PostAuthor | null;
};

// Wzbogacenie postem o flagę "czy aktualnie zalogowany user polubił".
export type PostWithLikeState = PostWithAuthor & {
  liked_by_me: boolean;
};
