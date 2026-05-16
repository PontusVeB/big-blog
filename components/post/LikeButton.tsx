"use client";
// Generyczny przycisk lajka — działa pod posty i komentarze.
// Wybiera odpowiednią Server Action po `targetType`.
//
// Sygnatury togglePostLike i toggleCommentLike są identyczne:
// (id: string) => Promise<{ liked: boolean; error?: string }>
// dzięki czemu w środku jest prosty switch.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { togglePostLike } from "@/lib/posts/actions";
import { toggleCommentLike } from "@/lib/comments/actions";

export type LikeTargetType = "post" | "comment";

type Props = {
  targetType: LikeTargetType;
  targetId: string;
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
  /** Czy aktualny user jest autorem treści (post/komentarz) — wtedy nie może lajkować */
  isOwnContent: boolean;
  variant?: "compact" | "full";
  onCountChange?: (newCount: number) => void;
};

export default function LikeButton({
  targetType,
  targetId,
  initialLiked,
  initialCount,
  isLoggedIn,
  isOwnContent,
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

    if (!isLoggedIn) {
      const returnPath =
        typeof window !== "undefined" ? window.location.pathname : "/";
      toast("Zaloguj się, aby polubić", {
        description: "Lajki są dla zalogowanych użytkowników.",
        action: {
          label: "Zaloguj",
          onClick: () =>
            router.push(`/logowanie?next=${encodeURIComponent(returnPath)}`),
        },
      });
      return;
    }

    if (isOwnContent) {
      const msg =
        targetType === "post"
          ? "Nie możesz polubić swojego posta"
          : "Nie możesz polubić własnego komentarza";
      toast(msg, {
        description: "Możesz cieszyć się z lajków od innych 🐕",
      });
      return;
    }

    // Optimistic update
    const wasLiked = liked;
    const newLiked = !wasLiked;
    const newCount = wasLiked ? count - 1 : count + 1;
    setLiked(newLiked);
    setCount(newCount);
    onCountChange?.(newCount);

    startTransition(async () => {
      const result =
        targetType === "post"
          ? await togglePostLike(targetId)
          : await toggleCommentLike(targetId);
      if (result.error) {
        // Cofamy
        setLiked(wasLiked);
        setCount(count);
        onCountChange?.(count);
        toast.error(result.error);
      }
    });
  }

  const size = variant === "full" ? 22 : 16;
  const className =
    `like-button` +
    (liked ? " liked" : "") +
    (isOwnContent ? " is-own" : "") +
    (variant === "full" ? " like-button-full" : "");

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      aria-label={liked ? "Usuń polubienie" : "Polub"}
      title={
        isOwnContent
          ? targetType === "post"
            ? "To Twój post — nie możesz go polubić"
            : "To Twój komentarz — nie możesz go polubić"
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
