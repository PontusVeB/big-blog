"use client";

import { useState } from "react";
import LikeButton from "./LikeButton";
import LikersModal from "./LikersModal";

type Props = {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
  isOwnPost: boolean;
};

function likesLabel(n: number): string {
  if (n === 0) return "Nikt jeszcze nie polubił";
  if (n === 1) return "1 osoba polubiła";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${n} osoby polubiły`;
  }
  return `${n} osób polubiło`;
}

export default function PostLikesSection({
  postId,
  initialLiked,
  initialCount,
  isLoggedIn,
  isOwnPost,
}: Props) {
  const [count, setCount] = useState(initialCount);
  const [showLikers, setShowLikers] = useState(false);

  return (
    <div className="post-likes-section">
      <LikeButton
        postId={postId}
        initialLiked={initialLiked}
        initialCount={initialCount}
        isLoggedIn={isLoggedIn}
        isOwnPost={isOwnPost}
        variant="full"
        onCountChange={setCount}
      />
      <button
        type="button"
        className="likes-count-trigger"
        onClick={() => count > 0 && setShowLikers(true)}
        disabled={count === 0}
      >
        {likesLabel(count)}
      </button>

      {showLikers && (
        <LikersModal postId={postId} onClose={() => setShowLikers(false)} />
      )}
    </div>
  );
}
