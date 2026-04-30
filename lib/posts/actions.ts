"use server";
// Server Actions dla postów.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PostFormState = { error?: string } | null;

// ─── Tworzenie posta ──────────────────────────────────────────
export async function createPost(
  _prevState: PostFormState,
  formData: FormData
): Promise<PostFormState> {
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();

  // Walidacja podstawowa
  if (!title || !content) {
    return { error: "Tytuł i treść są wymagane." };
  }
  if (title.length > 200) {
    return { error: "Tytuł może mieć maksymalnie 200 znaków." };
  }
  if (content.length > 50000) {
    return { error: "Treść jest zbyt długa (max 50 000 znaków)." };
  }

  // Sprawdzamy zalogowanie
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Musisz być zalogowany, aby napisać post." };
  }

  // Wstawiamy posta — RLS sprawdzi, że author_id zgadza się z auth.uid()
  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      title,
      content,
      author_id: user.id,
    })
    .select("id")
    .single();

  if (error || !post) {
    return { error: error?.message ?? "Nie udało się zapisać posta." };
  }

  // Odświeżamy cache strony głównej (lista postów) i przekierowujemy do nowego posta
  revalidatePath("/");
  redirect(`/posty/${post.id}`);
}
