// Pomocnicze funkcje dla tagów.

// Mapa polskich znaków → ASCII (do tworzenia URL-friendly slugów)
const PL_TO_ASCII: Record<string, string> = {
  ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
  Ą: "A", Ć: "C", Ę: "E", Ł: "L", Ń: "N", Ó: "O", Ś: "S", Ź: "Z", Ż: "Z",
};

/**
 * Zamienia tekst na slug URL-friendly.
 * "Sport i aktywność" → "sport-i-aktywnosc"
 */
export function slugify(text: string): string {
  return text
    .split("")
    .map((c) => PL_TO_ASCII[c] ?? c)
    .join("")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Paleta kolorów do automatycznego nadawania nowym tagom.
// Dobrane pod ciemny motyw Tollerkowa.
export const TAG_COLORS = [
  "#069494", // teal
  "#B8623E", // cinnamon
  "#6d2e46", // burgundy
  "#4a7d65", // sage
  "#c0a062", // amber
  "#355385", // indigo
  "#8b5cf6", // purple
  "#3ECF8E", // mint
];

export function randomTagColor(): string {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
}
