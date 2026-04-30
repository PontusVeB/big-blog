"use client";
// Formularz nowego posta z emoji pickerem.
// Emoji picker jest dynamicznie ładowany — pojawia się dopiero gdy klikniesz
// przycisk z buźką. Dzięki temu nie spowalnia ładowania strony.

import { useState, useRef } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import dynamic from "next/dynamic";
import type { EmojiClickData } from "emoji-picker-react";
import { createPost, type PostFormState } from "@/lib/posts/actions";

// Dynamiczny import — biblioteka emoji-picker-react ma ~150 KB,
// nie chcemy żeby ładowała się na każdej stronie. ssr: false bo używa window.
const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => <div className="emoji-loading">Ładowanie emoji…</div>,
});

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-primary auth-submit"
    >
      {pending ? "Publikowanie…" : "Publikuj post"}
    </button>
  );
}

export default function NewPostForm() {
  const [state, formAction] = useActionState<PostFormState, FormData>(
    createPost,
    null
  );
  const [content, setContent] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Wstawia emoji w miejscu kursora w textarea (zachowuje pozycję)
  function handleEmojiClick(emojiData: EmojiClickData) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => prev + emojiData.emoji);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent =
      content.slice(0, start) + emojiData.emoji + content.slice(end);
    setContent(newContent);
    // Po re-renderze przywróć kursor za wstawionym emoji
    setTimeout(() => {
      textarea.focus();
      const cursor = start + emojiData.emoji.length;
      textarea.setSelectionRange(cursor, cursor);
    }, 0);
  }

  return (
    <form action={formAction} className="post-form">
      <div className="field">
        <label htmlFor="title">Tytuł</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={200}
          autoComplete="off"
          className="input"
          placeholder="Krótki, chwytliwy tytuł"
        />
      </div>

      <div className="field">
        <div className="field-label-row">
          <label htmlFor="content">Treść</label>
          <button
            type="button"
            className="emoji-toggle"
            onClick={() => setShowEmoji((s) => !s)}
            aria-label="Wstaw emoji"
            title="Wstaw emoji"
          >
            😀
          </button>
        </div>
        <textarea
          ref={textareaRef}
          id="content"
          name="content"
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="input post-textarea"
          placeholder="Napisz swój post… Możesz wstawić emoji klikając przycisk z buźką po prawej."
        />
        {showEmoji && (
          <div className="emoji-picker-wrapper">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={"dark" as never}
              width="100%"
              height={360}
              searchPlaceHolder="Szukaj emoji..."
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}
        <div className="field-help">
          Linki do filmów (YouTube, TikTok) i postów z X dorzucimy w następnej rundzie — będą się rozwijały do podglądów.
        </div>
      </div>

      {state?.error && <div className="auth-error">{state.error}</div>}

      <div className="post-form-actions">
        <SubmitButton />
      </div>
    </form>
  );
}
