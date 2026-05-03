"use client";
// Avatar upload z cropperem.
// Flow: klik "Wgraj zdjęcie" → file picker → wybierasz plik → modal cropper
// → potwierdzasz wycinek → upload do Storage → URL ląduje w state rodzica.

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import AvatarCropper from "./AvatarCropper";

type Props = {
  currentUrl: string | null;
  initial: string; // litera placeholder gdy brak zdjęcia
  onUploaded: (url: string | null) => void;
};

const MAX_INPUT_SIZE_MB = 10; // przed kompresją; po canvas-resize avatar < 100 KB

export default function AvatarUpload({ currentUrl, initial, onUploaded }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Tylko zdjęcia.");
      return;
    }
    if (file.size > MAX_INPUT_SIZE_MB * 1024 * 1024) {
      setError(`Plik wejściowy max ${MAX_INPUT_SIZE_MB} MB.`);
      return;
    }
    // Otwieramy cropper z lokalnym podglądem (object URL)
    const url = URL.createObjectURL(file);
    setCropperImage(url);
    // Reset input — pozwala wybrać ten sam plik ponownie
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleCropConfirm(blob: Blob) {
    // Zamknij modal, zacznij upload
    setCropperImage(null);
    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Musisz być zalogowany.");
        setUploading(false);
        return;
      }

      // Konwencja ścieżki: {user_id}/{uuid}.jpg
      const path = `${user.id}/${crypto.randomUUID()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, {
          contentType: "image/jpeg",
          upsert: false,
          cacheControl: "3600",
        });

      if (uploadError) {
        setError(uploadError.message);
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      setPreviewUrl(publicUrl);
      onUploaded(publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się wgrać zdjęcia.");
    } finally {
      setUploading(false);
    }
  }

  function removeAvatar() {
    setPreviewUrl(null);
    onUploaded(null);
  }

  return (
    <>
      <div className="avatar-upload">
        {previewUrl ? (
          <img src={previewUrl} alt="Avatar" className="avatar-preview" />
        ) : (
          <div className="avatar-preview avatar-letter">{initial}</div>
        )}
        <div className="avatar-upload-info">
          <div className="avatar-upload-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading
                ? "Wgrywanie…"
                : previewUrl
                ? "Zmień zdjęcie"
                : "Wgraj zdjęcie"}
            </button>
            {previewUrl && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={removeAvatar}
                disabled={uploading}
              >
                Usuń
              </button>
            )}
          </div>
          <div className="field-help">
            PNG / JPG / WebP. Po wgraniu wybierzesz wycinek.
            Avatar zostanie skompresowany do 256×256 px (~50 KB).
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileSelect}
        />
      </div>
      {error && <div className="auth-error" style={{ marginTop: 8 }}>{error}</div>}

      {/* Modal z cropperem — render warunkowy */}
      {cropperImage && (
        <AvatarCropper
          imageSrc={cropperImage}
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
