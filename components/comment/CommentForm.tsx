"use client";
// Formularz nowego komentarza (root) lub odpowiedzi (reply).
// Współdziała z createComment server action przez useActionState.

import { useRef, useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { createComment, type CommentFormState } from "@/lib/comments/actions";
import type { CommentTargetType } from "@/lib/comments/types";

type Props = {
  targetType: CommentTargetType;
  targetId: string;
  parentId?: string;
  /** Wywoływane po sukcesie — np. zamyka formularz odpowiedzi */
  onSuccess?: () => void;
  /** Tekst placeholdera w textarea */
  placeholder?: string;
  /** Czy automatycznie focusować textarea po wyrenderowaniu (dla reply form) */
  autoFocus?: boolean;
  /** Wyświetlać przycisk Anuluj (zamyka reply form) */
  onCancel?: () => void;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary comment-submit">
      <Send size={14} /> {pending ? "Wysyłanie…" : label}
    </button>
  );
}

export default function CommentForm({
  targetType,
  targetId,
  parentId,
  onSuccess,
  placeholder = "Napisz komentarz…",
  autoFocus = false,
  onCancel,
}: Props) {
  const [state, formAction] = useActionState<CommentFormState, FormData>(
    createComment,
    null
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Po sukcesie (state === null po wywołaniu) resetujemy formularz i wywołujemy onSuccess
  useEffect(() => {
    if (state === null) {
      formRef.current?.reset();
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  // Auto-focus dla formularza odpowiedzi
  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  const isReply = !!parentId;

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        // Po wysłaniu (sukces) zamykamy reply form
        onSuccess?.();
      }}
      className={`comment-form${isReply ? " comment-form-reply" : ""}`}
    >
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}

      <textarea
        ref={textareaRef}
        name="content"
        required
        maxLength={2000}
        placeholder={placeholder}
        className="input comment-textarea"
      />

      <div className="comment-form-actions">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost"
          >
            Anuluj
          </button>
        )}
        <SubmitButton label={isReply ? "Odpowiedz" : "Komentuj"} />
      </div>
    </form>
  );
}
