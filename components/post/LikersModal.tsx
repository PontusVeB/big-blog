"use client";
// Modal z listą userów, którzy polubili dany post.
// Pobiera listę live z Supabase przy otwarciu.

import { useEffect, useState } from "react";
import Link from "next/link";
import { X as XIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Liker = {
  user_id: string;
  user: {
    id: string;
    nickname: string | null;
    email: string;
    avatar_url: string | null;
    role: "MASTER" | "ADMIN" | "USER";
  } | null;
};

export default function LikersModal({
  postId,
  onClose,
}: {
  postId: string;
  onClose: () => void;
}) {
  const [likers, setLikers] = useState<Liker[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pobieramy listę przy mount
  useEffect(() => {
    let cancelled = false;
    async function fetchLikers() {
      const supabase = createClient();
      const { data, error: fetchErr } = await supabase
        .from("post_likes")
        .select(
          `
          user_id,
          user:profiles!user_id (id, nickname, email, avatar_url, role)
        `
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (fetchErr) {
        setError(fetchErr.message);
        return;
      }
      setLikers((data as unknown as Liker[]) ?? []);
    }
    fetchLikers();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  // ESC zamyka modal
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Polubienia {likers ? `(${likers.length})` : ""}</h3>
          <button className="close" onClick={onClose} aria-label="Zamknij">
            <XIcon size={20} />
          </button>
        </div>
        <div className="modal-body">
          {error && <div className="auth-error">{error}</div>}
          {!likers && !error && (
            <div className="loading-state">Ładowanie…</div>
          )}
          {likers && likers.length === 0 && (
            <div className="empty-row">Nikt jeszcze nie polubił tego posta.</div>
          )}
          {likers?.map((liker) => {
            const name =
              liker.user?.nickname ||
              liker.user?.email?.split("@")[0] ||
              "anonim";
            const initial = (
              liker.user?.nickname ||
              liker.user?.email ||
              "?"
            )[0].toUpperCase();
            return (
              <Link
                key={liker.user_id}
                href={`/profil/${liker.user_id}`}
                className="user-row"
                onClick={onClose}
              >
                {liker.user?.avatar_url ? (
                  <img
                    src={liker.user.avatar_url}
                    alt={name}
                    className="avatar avatar-sm"
                  />
                ) : (
                  <span className="avatar avatar-sm">{initial}</span>
                )}
                <div className="info">
                  <div className="nick">{name}</div>
                  <div className="role">{translateRole(liker.user?.role)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function translateRole(role: string | null | undefined): string {
  if (role === "MASTER") return "Master";
  if (role === "ADMIN") return "Admin";
  return "Użytkownik";
}
