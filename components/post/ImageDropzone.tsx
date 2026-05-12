"use client";
// Komponent uploadu zdjęć posta — drag & drop + klik → cropper 16:9 → upload.
// Po wybraniu pliku otwiera się modal croppera. Po zatwierdzeniu wycinka
// blob jest wgrywany do Supabase Storage jako JPEG 1600x900.

import { useState, useRef, type DragEvent } from "react";
import { ImagePlus, X as XIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ImageCropper from "@/components/shared/ImageCropper";

type Props = {
  onUploaded: (url: string | null) => void;
  initialUrl?: string | null;
};

const MAX_INPUT_SIZE_MB = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ImageDropzone({ onUploaded, initialUrl }: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Tylko zdjęcia: JPG, PNG lub WebP.");
      return;
    }
    if (file.size > MAX_INPUT_SIZE_MB * 1024 * 1024) {
      setError(`Plik wejściowy max ${MAX_INPUT_SIZE_MB} MB.`);
      return;
    }
    // Otwieramy cropper z lokalnym podglądem
    const url = URL.createObjectURL(file);
    setCropperImage(url);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleCropConfirm(blob: Blob) {
    setCropperImage(null);
    setUploading(true);
    setError(null);

    // Lokalny podgląd zanim Supabase odpowie
    const localPreview = URL.createObjectURL(blob);
    setPreview(localPreview);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Musisz być zalogowany.");
        setUploading(false);
        return;
      }

      // Zawsze JPEG (cropper kompresuje do tego formatu)
      const path = `${user.id}/${crypto.randomUUID()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(path, blob, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setError(uploadError.message);
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("post-images")
        .getPublicUrl(path);

      setPreview(publicUrl);
      onUploaded(publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się wgrać zdjęcia.");
    } finally {
      setUploading(false);
    }
  }

  function onDragOver(e: DragEvent) { e.preventDefault(); setDragging(true); }
  function onDragLeave() { setDragging(false); }
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

  if (preview) {
    return (
      <>
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
              <XIcon size={18} />
            </button>
          )}
        </div>
        {cropperImage && (
          <ImageCropper
            imageSrc={cropperImage}
            aspect={16 / 9}
            cropShape="rect"
            outputWidth={1600}
            outputHeight={900}
            jpegQuality={0.88}
            title="Dopasuj zdjęcie hero posta"
            onConfirm={handleCropConfirm}
            onCancel={() => {
              URL.revokeObjectURL(cropperImage);
              setCropperImage(null);
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
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
          <ImagePlus size={36} className="drop-icon-svg" />
          <div className="drop-title">
            Przeciągnij zdjęcie tutaj lub <strong>kliknij, aby wybrać</strong>
          </div>
          <div className="drop-help">
            PNG / JPG / WebP, max {MAX_INPUT_SIZE_MB} MB. Po wgraniu wybierzesz wycinek 16:9.
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

      {cropperImage && (
        <ImageCropper
          imageSrc={cropperImage}
          aspect={16 / 9}
          cropShape="rect"
          outputWidth={1600}
          outputHeight={900}
          jpegQuality={0.88}
          title="Dopasuj zdjęcie hero posta"
          onConfirm={handleCropConfirm}
          onCancel={() => {
            URL.revokeObjectURL(cropperImage);
            setCropperImage(null);
          }}
        />
      )}
    </>
  );
}
