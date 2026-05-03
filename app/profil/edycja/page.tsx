import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileEditForm from "@/components/profile/ProfileEditForm";

export const metadata: Metadata = {
  title: "Edycja profilu • Big Blog",
};

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/logowanie?next=/profil/edycja");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, nickname, bio, avatar_url")
    .eq("id", user.id)
    .single<{
      email: string;
      nickname: string | null;
      bio: string | null;
      avatar_url: string | null;
    }>();

  if (!profile) redirect("/");

  return (
    <div className="post-form-page">
      <header className="post-form-header">
        <h1>Edycja profilu</h1>
        <p className="post-form-subtitle">
          Zmień to, jak widzą Cię inni użytkownicy.
        </p>
      </header>
      <ProfileEditForm
        initial={{
          email: profile.email,
          nickname: profile.nickname,
          bio: profile.bio,
          avatarUrl: profile.avatar_url,
        }}
      />
    </div>
  );
}
