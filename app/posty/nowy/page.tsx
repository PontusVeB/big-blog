import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostForm from "@/components/post/PostForm";

export const metadata: Metadata = {
  title: "Nowy post • Big Blog",
};

export default async function NewPostPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/logowanie?next=/posty/nowy");

  return (
    <div className="post-form-page">
      <header className="post-form-header">
        <h1>Nowy post</h1>
        <p className="post-form-subtitle">
          Po publikacji masz 30 minut na poprawki — potem post staje się publiczny na zawsze.
        </p>
      </header>
      <PostForm mode="create" />
    </div>
  );
}
