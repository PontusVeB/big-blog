"use client";
// Modal z cropperem zdjęcia — kółko 1:1.
// Po zatwierdzeniu zwraca skompresowany Blob (JPEG 256x256, jakość ~0.85).
// Dzięki canvas-resize avatar nigdy nie waży więcej niż ~50 KB,
// niezależnie od oryginalnego rozmiaru.

import { useState, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";

type Props = {
  imageSrc: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
};

const OUTPUT_SIZE = 256; // wymiary docelowe avatara w pikselach
const JPEG_QUALITY = 0.85;

export default function AvatarCropper({ imageSrc, onConfirm, onCancel }: Props) {
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
      const blob = await cropToBlob(imageSrc, croppedArea);
      onConfirm(blob);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cropper-overlay" onClick={onCancel}>
      <div className="cropper-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cropper-header">
          <h3>Dopasuj kadr</h3>
          <button onClick={onCancel} className="close" aria-label="Zamknij">×</button>
        </div>

        <div className="cropper-area">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
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
async function cropToBlob(imageSrc: string, area: Area): Promise<Blob> {
  const image = await loadImage(imageSrc);

  // Tworzymy canvas o docelowych wymiarach (256x256)
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Brak wsparcia canvas 2D w przeglądarce.");

  // Wycinamy z oryginału obszar zaznaczony w cropperze i skalujemy do 256x256
  ctx.drawImage(
    image,
    area.x, area.y, area.width, area.height,
    0, 0, OUTPUT_SIZE, OUTPUT_SIZE
  );

  // Eksport jako JPEG z kompresją
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Nie udało się utworzyć blob"))),
      "image/jpeg",
      JPEG_QUALITY
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
