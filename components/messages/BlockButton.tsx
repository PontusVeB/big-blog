"use client";
// Przycisk blokowania / odblokowywania użytkownika (nagłówek rozmowy).
// Po zmianie woła router.refresh() — strona wątku przerenderuje się
// i pole do pisania zareaguje na nowy stan blokady.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { blockUser, unblockUser } from "@/lib/messages/actions";

type Props = {
  targetId: string;
  initiallyBlocked: boolean;
};

export default function BlockButton({ targetId, initiallyBlocked }: Props) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const res = blocked
        ? await unblockUser(targetId)
        : await blockUser(targetId);

      if (res.error) {
        toast.error(res.error);
        return;
      }
      setBlocked(!blocked);
      toast.success(
        blocked ? "Użytkownik odblokowany." : "Użytkownik zablokowany."
      );
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={`chat-block-btn ${blocked ? "is-blocked" : ""}`}
      title={blocked ? "Odblokuj użytkownika" : "Zablokuj użytkownika"}
    >
      {blocked ? (
        <>
          <ShieldOff size={15} /> Odblokuj
        </>
      ) : (
        <>
          <Ban size={15} /> Zablokuj
        </>
      )}
    </button>
  );
}
