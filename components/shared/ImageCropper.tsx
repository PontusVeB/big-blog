"use client";
// Generyczny cropper zdjęć — używany w dwóch miejscach:
//   1. AvatarUpload — kółko 1:1, output 256x256
//   2. ImageDropzone (post hero) — prostokąt 16:9, output 1600x900
// Po zatwierdzeniu zwraca skompresowany Blob JPEG.

import { useState, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";

type Props = {
  imageSrc: string;
  /** Proporcje kadru — 1 dla kwadratu, 16/9 dla post-hero, itp. */
  aspect?: number;
  /** Kształt obrysu w cropperze — "round" dla avatara, "rect" dla zdjęć postów */
  cropShape?: "round" | "rect";
  /** Wymiary docelowe wyjściowego JPEG-a (canvas resize) */
  outputWidth?: number;
  outputHeight?: number;
  /** Jakość kompresji JPEG (0.0 - 1.0). 0.85-0.9 daje dobry balans rozmiaru/jakości. */
  jpegQuality?: number;
  /** Tytuł modala (np. "Dopasuj zdjęcie profilowe") */
  title?: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
};

export default function ImageCropper({
  imageSrc,
  aspect = 1,
  cropShape = "rect",
  outputWidth = 1600,
  outputHeight = 900,
  jpegQuality = 0.88,
  title = "Dopasuj kadr",
  onConfirm,
  onCancel,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedArea) return;
    setBusy(true);
    try {
      const blob = await cropToBlob(
        imageSrc,
        croppedArea,
        outputWidth,
        outputHeight,
        jpegQuality
      );
      onConfirm(blob);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cropper-overlay" onClick={onCancel}>
      <div className="cropper-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cropper-header">
          <h3>{title}</h3>
          <button onClick={onCancel} className="close" aria-label="Zamknij">×</button>
        </div>

        <div className="cropper-area">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={cropShape === "rect"}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="cropper-controls">
          <label>
            Powiększenie
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="cropper-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={busy}>
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-primary"
            disabled={busy || !croppedArea}
          >
            {busy ? "Przetwarzanie…" : "Zapisz wycinek"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pomocnicze: crop + resize + kompresja przez canvas ─────────────
async function cropToBlob(
  imageSrc: string,
  area: Area,
  outputWidth: number,
  outputHeight: number,
  jpegQuality: number
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Brak wsparcia canvas 2D w przeglądarce.");

  // Wycinamy z oryginału obszar zaznaczony w cropperze i skalujemy
  ctx.drawImage(
    image,
    area.x, area.y, area.width, area.height,
    0, 0, outputWidth, outputHeight
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Nie udało się utworzyć blob"))),
      "image/jpeg",
      jpegQuality
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Nie udało się wczytać obrazka: ${e}`));
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}
