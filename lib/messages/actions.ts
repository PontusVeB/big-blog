"use server";
// Server Actions dla wiadomości: wysyłanie, oznaczanie jako przeczytane,
// blokowanie / odblokowywanie użytkowników.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canonicalPair } from "./utils";

const MAX_MESSAGE_LENGTH = 5000;

// ════════════════════════════════════════════════════════════════
//  WYSYŁANIE WIADOMOŚCI
// ════════════════════════════════════════════════════════════════
export async function sendMessage(
  recipientId: string,
  rawContent: string
): Promise<{ error?: string; conversationId?: string }> {
  const content = rawContent.trim();

  // Walidacja treści
  if (!content) return { error: "Wiadomość nie może być pusta." };
  if (content.length > MAX_MESSAGE_LENGTH) {
    return { error: `Wiadomość jest zbyt długa (max ${MAX_MESSAGE_LENGTH} znaków).` };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Musisz być zalogowany." };

  if (recipientId === user.id) {
    return { error: "Nie możesz wysłać wiadomości do samego siebie." };
  }

  // Odbiorca musi istnieć
  const { data: recipient } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", recipientId)
    .maybeSingle();
  if (!recipient) return { error: "Taki użytkownik nie istnieje." };

  // Sprawdzenie blokad w OBU kierunkach — klientem admin, bo RLS ukrywa
  // przed nami wiersze "ktoś nas zablokował".
  const admin = createAdminClient();
  const { data: blocks } = await admin
    .from("blocked_users")
    .select("blocker_id")
    .in("blocker_id", [user.id, recipientId])
    .in("blocked_id", [user.id, recipientId]);

  if (blocks && blocks.length > 0) {
    return { error: "Nie możesz wysłać wiadomości do tego użytkownika." };
  }

  // Znajdź lub utwórz rozmowę (para w porządku kanonicznym)
  const [u1, u2] = canonicalPair(user.id, recipientId);

  let conversationId: string | null = null;
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user1_id", u1)
    .eq("user2_id", u2)
    .maybeSingle();

  if (existing) {
    conversationId = existing.id as string;
  } else {
    const { data: created, error: convErr } = await supabase
      .from("conversations")
      .insert({ user1_id: u1, user2_id: u2 })
      .select("id")
      .single();

    if (convErr || !created) {
      // Możliwy wyścig (równoległa pierwsza wiadomość) — spróbuj odczytać.
      const { data: retry } = await supabase
        .from("conversations")
        .select("id")
        .eq("user1_id", u1)
        .eq("user2_id", u2)
        .maybeSingle();
      if (!retry) return { error: "Nie udało się utworzyć rozmowy." };
      conversationId = retry.id as string;
    } else {
      conversationId = created.id as string;
    }
  }

  // Zapis wiadomości
  const { error: msgErr } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    recipient_id: recipientId,
    content,
  });
  if (msgErr) return { error: msgErr.message };

  revalidatePath(`/wiadomosci/${recipientId}`);
  revalidatePath("/wiadomosci");
  return { conversationId };
}

// ════════════════════════════════════════════════════════════════
//  OZNACZANIE ROZMOWY JAKO PRZECZYTANEJ
// ════════════════════════════════════════════════════════════════
export async function markConversationRead(
  conversationId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Musisz być zalogowany." };

  // Oznaczamy tylko wiadomości DO mnie, jeszcze nieprzeczytane.
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) return { error: error.message };

  revalidatePath("/wiadomosci");
  return {};
}

// ════════════════════════════════════════════════════════════════
//  BLOKOWANIE / ODBLOKOWANIE
// ════════════════════════════════════════════════════════════════
export async function blockUser(
  targetId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Musisz być zalogowany." };
  if (targetId === user.id) return { error: "Nie możesz zablokować samego siebie." };

  const { error } = await supabase
    .from("blocked_users")
    .insert({ blocker_id: user.id, blocked_id: targetId });

  // 23505 = już zablokowany — traktujemy jako sukces.
  if (error && error.code !== "23505") return { error: error.message };

  revalidatePath(`/wiadomosci/${targetId}`);
  revalidatePath("/wiadomosci");
  return {};
}

export async function unblockUser(
  targetId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const { error } = await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetId);

  if (error) return { error: error.message };

  revalidatePath(`/wiadomosci/${targetId}`);
  revalidatePath("/wiadomosci");
  return {};
}
