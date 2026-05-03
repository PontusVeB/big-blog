"use client";
// Przycisk "Usuń post" — wymaga potwierdzenia, wywołuje server action.

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePost } from "@/lib/posts/actions";

export default function DeleteButton({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Na pewno chcesz usunąć ten post? Tej operacji nie można cofnąć.")) {
      return;
    }
    startTransition(async () => {
      const result = await deletePost(postId);
      if (result?.error) alert(result.error);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="btn btn-danger"
    >
      <Trash2 size={16} /> {pending ? "Usuwanie…" : "Usuń"}
    </button>
  );
}
