"use client";
// Przycisk usuwania posta — confirm + toast zamiast alert.

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePost } from "@/lib/posts/actions";

export default function DeleteButton({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Na pewno chcesz usunąć ten post? Tej operacji nie można cofnąć.")) {
      return;
    }
    startTransition(async () => {
      const result = await deletePost(postId);
      if (result?.error) {
        toast.error("Nie udało się usunąć posta", {
          description: result.error,
        });
      }
      // Po sukcesie deletePost wykonuje redirect — nie wracamy tutaj
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
