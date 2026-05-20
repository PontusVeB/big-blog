// Typy współdzielone dla modułu wiadomości.

/** Uproszczony profil użytkownika na potrzeby czatu. */
export type ChatUser = {
  id: string;
  nickname: string | null;
  email: string;
  avatar_url: string | null;
};

/** Pojedyncza wiadomość (wiersz tabeli messages). */
export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

/** Wiersz listy rozmów — wynik RPC get_my_conversations + dociągnięty profil. */
export type ConversationListItem = {
  conversation_id: string;
  other_user_id: string;
  last_message_content: string | null;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  unread_count: number;
  other_user: ChatUser | null;
};
