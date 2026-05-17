"use client";
// Przycisk "Oznacz wszystkie jako przeczytane" — wywołuje server action,
// po sukcesie revalidate odświeża stronę + nav badge.

import { useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { markAllNotificationsRead } from "@/lib/notifications/actions";

type Props = {
  hasUnread: boolean;
};

export default function MarkAllReadButton({ hasUnread }: Props) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Wszystkie powiadomienia oznaczone jako przeczytane");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || !hasUnread}
      className="btn btn-secondary"
      title={hasUnread ? undefined : "Brak nieprzeczytanych"}
    >
      <CheckCheck size={16} />
      {pending ? "Oznaczanie…" : "Oznacz wszystkie"}
    </button>
  );
}
