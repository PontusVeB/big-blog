"use client";
// Uniwersalny formularz posta — obsługuje zarówno tworzenie jak i edycję.
// Tryb wybierany przez prop `mode`. W trybie "edit" akcja używa updatePost
// i wstawia ukryty input z ID posta + pre-fill pól.

import { useState, useRef } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import dynamic from "next/dynamic";
import type { EmojiClickData } from "emoji-picker-react";
import { createPost, updatePost, type PostFormState } from "@/lib/posts/actions";
import ImageDropzone from "./ImageDropzone";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => <div className="emoji-loading">Ładowanie emoji…</div>,
});

type PostFormProps = {
  mode: "create" | "edit";
  initial?: {
    id: string;
    title: string;
    content: string;
    imageUrl: string | null;
  };
};

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  const labels = {
    create: { idle: "Publikuj post", busy: "Publikowanie…" },
    edit: { idle: "Zapisz zmiany", busy: "Zapisywanie…" },
  };
  const label = pending ? labels[mode].busy : labels[mode].idle;
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-primary auth-submit"
    >
      {label}
    </button>
  );
}

export default function PostForm({ mode, initial }: PostFormProps) {
  // Wybór akcji w zależności od trybu
  const action = mode === "edit" ? updatePost : createPost;
  const [state, formAction] = useActionState<PostFormState, FormData>(action, null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    setTimeout(() => {
      textarea.focus();
      const cursor = start + emojiData.emoji.length;
      textarea.setSelectionRange(cursor, cursor);
    }, 0);
  }

  return (
    <form action={formAction} className="post-form">
      {/* Hidden input z ID — tylko w trybie edycji */}
      {mode === "edit" && initial && (
        <input type="hidden" name="id" value={initial.id} />
      )}

      <div className="field">
        <label>Zdjęcie hero (opcjonalne)</label>
        <ImageDropzone
          onUploaded={setImageUrl}
          initialUrl={initial?.imageUrl}
        />
        <input type="hidden" name="imageUrl" value={imageUrl ?? ""} />
      </div>

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
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
          placeholder="Napisz swój post… Wklejaj linki do YT/TikTok/X/Instagram w osobnej linii."
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
          💡 Wklej link do filmu z <strong>YouTube</strong>, <strong>TikToka</strong>,
          posta z <strong>X</strong> lub <strong>Instagrama</strong> w osobnej linii —
          automatycznie zamieni się na ładny podgląd.
        </div>
      </div>

      {state?.error && <div className="auth-error">{state.error}</div>}

      <div className="post-form-actions">
        <SubmitButton mode={mode} />
      </div>
    </form>
  );
}
