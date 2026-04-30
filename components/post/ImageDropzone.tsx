"use client";
// Komponent uploadu zdjęć — drag & drop + klik.
// Uploaduje plik do Supabase Storage od razu po wyborze (live podgląd),
// zwraca publiczny URL do nadrzędnego komponentu (NewPostForm).

import { useState, useRef, type DragEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  onUploaded: (url: string | null) => void;
};

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ImageDropzone({ onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Walidacja + upload
  async function handleFile(file: File) {
    setError(null);

    // Walidacja typu
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Tylko zdjęcia: JPG, PNG lub WebP.");
      return;
    }
    // Walidacja rozmiaru
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Plik jest za duży (max ${MAX_SIZE_MB} MB).`);
      return;
    }

    setUploading(true);
    // Lokalny podgląd zanim Supabase odpowie — szybki feedback dla usera
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Musisz być zalogowany.");
        setUploading(false);
        return;
      }

      // Generujemy unikalną nazwę pliku.
      // Konwencja: {user_id}/{uuid}.{ext}
      // Folder = user_id pozwala RLS ograniczyć zapis tylko do "swojego" katalogu.
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setError(uploadError.message);
        setUploading(false);
        return;
      }

      // Pobieramy publiczny URL do wstawienia do posta
      const {
        data: { publicUrl },
      } = supabase.storage.from("post-images").getPublicUrl(path);

      // Aktualizacja podglądu na URL z Supabase (zamiast lokalnego blob URL)
      setPreview(publicUrl);
      onUploaded(publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się wgrać zdjęcia.");
    } finally {
      setUploading(false);
    }
  }

  // Drag & drop handlery
  function onDragOver(e: DragEvent) {
    e.preventDefault();
    setDragging(true);
  }
  function onDragLeave() {
    setDragging(false);
  }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function removeImage() {
    setPreview(null);
    setError(null);
    onUploaded(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  // Jeśli mamy podgląd — pokaż go z opcją usunięcia
  if (preview) {
    return (
      <div className="dropzone-preview">
        <img src={preview} alt="Podgląd" />
        {uploading && (
          <div className="dropzone-overlay">
            <div className="spinner" /> Wgrywanie…
          </div>
        )}
        {!uploading && (
          <button
            type="button"
            className="dropzone-remove"
            onClick={removeImage}
            aria-label="Usuń zdjęcie"
          >
            ×
          </button>
        )}
      </div>
    );
  }

  // Pusty stan — drop zone do upuszczenia/wyboru pliku
  return (
    <div>
      <div
        className={`dropzone${dragging ? " dragging" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <div className="drop-icon">🖼️</div>
        <div className="drop-title">
          Przeciągnij zdjęcie tutaj lub <strong>kliknij, aby wybrać</strong>
        </div>
        <div className="drop-help">
          PNG / JPG / WebP, max {MAX_SIZE_MB} MB. Zalecany format 16:10.
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {error && <div className="auth-error" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
}
