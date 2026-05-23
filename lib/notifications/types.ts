// Typy współdzielone dla modułu powiadomień.

export type NotificationType =
  | "COMMENT_ON_POST"
  | "REPLY_TO_COMMENT"
  | "LIKE_ON_POST"
  | "LIKE_ON_COMMENT";

export type NotificationActor = {
  id: string;
  nickname: string | null;
  email: string;
  avatar_url: string | null;
};

export type NotificationRow = {
  id: string;
  type: NotificationType;
  source_type: string | null;
  source_id: string | null;
  is_read: boolean;
  created_at: string;
  actor: NotificationActor | null;
};

// Dane potrzebne do renderowania konkretnego powiadomienia (po dołączeniu źródła)
export type CommentSourceInfo = {
  id: string;
  content: string;
  target_id: string;
  is_deleted: boolean;
};
