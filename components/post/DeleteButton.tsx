"use client";
// Przycisk "Usuń post" — wymaga potwierdzenia, wywołuje server action.
// Server action robi redirect po sukcesie, więc po kliknięciu user idzie na /.

import { useTransition } from "react";
import { deletePost } from "@/lib/posts/actions";

export default function DeleteButton({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !confirm(
        "Na pewno chcesz usunąć ten post? Tej operacji nie można cofnąć."
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deletePost(postId);
      // Po sukcesie deletePost wykonuje redirect — nie wracamy tu.
      if (result?.error) {
        alert(result.error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="btn btn-danger"
    >
      {pending ? "Usuwanie…" : "🗑️ Usuń post"}
    </button>
  );
}
