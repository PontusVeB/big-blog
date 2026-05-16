// /profil — przekierowuje na profil aktualnie zalogowanego usera.
// Niezalogowanego odsyła na logowanie z next param.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MyProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/logowanie?next=/profil");
  redirect(`/profil/${user.id}`);
}
