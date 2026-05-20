"use client";
// Formularz edycji profilu. Banner success usunięty — po zapisie
// updateProfile redirectuje z ?flash=profile_saved i wyskakuje toast.
// Inline pokazujemy tylko błędy.

import { useState, useRef } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import dynamic from "next/dynamic";
import { Smile } from "lucide-react";
import type { EmojiClickData } from "emoji-picker-react";
import { updateProfile, type ProfileFormState } from "@/lib/profiles/actions";
import AvatarUpload from "./AvatarUpload";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => <div className="emoji-loading">Ładowanie emoji…</div>,
});

type Props = {
  initial: {
    email: string;
    nickname: string | null;
    bio: string | null;
    avatarUrl: string | null;
  };
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary auth-submit">
      {pending ? "Zapisywanie…" : "Zapisz zmiany"}
    </button>
  );
}

export default function ProfileEditForm({ initial }: Props) {
  const [state, formAction] = useActionState<ProfileFormState, FormData>(
    updateProfile,
    null
  );
  const [nickname, setNickname] = useState(initial.nickname ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatarUrl);
  const [showEmoji, setShowEmoji] = useState(false);
  const nicknameRef = useRef<HTMLInputElement>(null);

  const placeholderInitial = (initial.nickname || initial.email)[0].toUpperCase();

  function insertEmojiToNick(emoji: EmojiClickData) {
    const el = nicknameRef.current;
    if (!el) {
      setNickname((prev) => prev + emoji.emoji);
      return;
    }
    const start = el.selectionStart ?? nickname.length;
    const end = el.selectionEnd ?? nickname.length;
    const next = nickname.slice(0, start) + emoji.emoji + nickname.slice(end);
    setNickname(next);
    setTimeout(() => {
      el.focus();
      const cursor = start + emoji.emoji.length;
      el.setSelectionRange(cursor, cursor);
    }, 0);
  }

  return (
    <form action={formAction} className="post-form">
      <div className="field">
        <label>Avatar</label>
        <AvatarUpload
          currentUrl={avatarUrl}
          initial={placeholderInitial}
          onUploaded={setAvatarUrl}
        />
        <input type="hidden" name="avatarUrl" value={avatarUrl ?? ""} />
      </div>

      <div className="field">
        <div className="field-label-row">
          <label htmlFor="nickname">Ksywka</label>
          <button
            type="button"
            className="emoji-toggle"
            onClick={() => setShowEmoji((s) => !s)}
            aria-label="Wstaw emoji"
            title="Wstaw emoji"
          >
            <Smile size={18} />
          </button>
        </div>
        <input
          ref={nicknameRef}
          id="nickname"
          name="nickname"
          type="text"
          required
          minLength={2}
          maxLength={30}
          autoComplete="off"
          className="input"
          placeholder="Twoja unikalna ksywka"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        {showEmoji && (
          <div className="emoji-picker-wrapper">
            <EmojiPicker
              onEmojiClick={insertEmojiToNick}
              theme={"dark" as never}
              width="100%"
              height={320}
              searchPlaceHolder="Szukaj emoji..."
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}
        <div className="field-help">
          2–30 znaków. Możesz dodać emoji 🚀. Ksywka musi być unikalna w serwisie.
        </div>
      </div>

      <div className="field field-readonly">
        <label htmlFor="email">E-mail (nieedytowalny)</label>
        <input
          id="email"
          className="input"
          value={initial.email}
          readOnly
          disabled
        />
        <div className="field-help">
          E-mail jest identyfikatorem konta. Zmiana wymaga osobnej procedury.
        </div>
      </div>

      <div className="field">
        <label htmlFor="bio">Opis</label>
        <textarea
          id="bio"
          name="bio"
          maxLength={500}
          rows={4}
          className="input"
          placeholder="Krótko o sobie — kim jesteś, o czym piszesz (opcjonalnie)"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <div className="field-help">Max 500 znaków. {bio.length}/500</div>
      </div>

      {state?.error && <div className="auth-error">{state.error}</div>}

      <div className="post-form-actions">
        <SubmitButton />
      </div>
    </form>
  );
}
