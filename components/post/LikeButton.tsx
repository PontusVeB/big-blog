"use client";
// Przycisk serca z optimistic update, blokadą self-like, toastami.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { togglePostLike } from "@/lib/posts/actions";

type Props = {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
  /** Czy aktualny user jest autorem posta (wtedy nie może lajkować) */
  isOwnPost: boolean;
  variant?: "compact" | "full";
  onCountChange?: (newCount: number) => void;
};

export default function LikeButton({
  postId,
  initialLiked,
  initialCount,
  isLoggedIn,
  isOwnPost,
  variant = "compact",
  onCountChange,
}: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    // Niezalogowany — toast z akcją zalogowania
    if (!isLoggedIn) {
      toast("Zaloguj się, aby polubić", {
        description: "Lajki są dla zalogowanych użytkowników.",
        action: {
          label: "Zaloguj",
          onClick: () => router.push(`/logowanie?next=/posty/${postId}`),
        },
      });
      return;
    }

    // Własny post — nie można polubić, ale tłumaczymy dlaczego
    if (isOwnPost) {
      toast("Nie możesz polubić swojego posta", {
        description: "Możesz cieszyć się z lajków od innych 🐕",
      });
      return;
    }

    // Optimistic update — od razu zmiana UI
    const wasLiked = liked;
    const newLiked = !wasLiked;
    const newCount = wasLiked ? count - 1 : count + 1;
    setLiked(newLiked);
    setCount(newCount);
    onCountChange?.(newCount);

    startTransition(async () => {
      const result = await togglePostLike(postId);
      if (result.error) {
        // Cofamy zmianę i pokazujemy toast z błędem
        setLiked(wasLiked);
        setCount(count);
        onCountChange?.(count);
        toast.error(result.error);
      }
    });
  }

  const size = variant === "full" ? 22 : 18;
  const className =
    `like-button` +
    (liked ? " liked" : "") +
    (isOwnPost ? " is-own" : "") +
    (variant === "full" ? " like-button-full" : "");

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      aria-label={liked ? "Usuń polubienie" : "Polub post"}
      title={
        isOwnPost
          ? "To Twój post — nie możesz go polubić"
          : isLoggedIn
          ? undefined
          : "Zaloguj się aby lajkować"
      }
    >
      <Heart size={size} fill={liked ? "currentColor" : "none"} />
      <span className="like-count">{count}</span>
    </button>
  );
}
