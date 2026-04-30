// Helpery dla postów.

// Formatowanie daty względnej po polsku.
// "przed chwilą" / "5 min temu" / "wczoraj" / "3 dni temu" / "12 marca 2026"
export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "przed chwilą";
  if (diffMin < 60) return `${diffMin} min temu`;
  if (diffHr < 24) return `${diffHr} godz. temu`;
  if (diffDay === 1) return "wczoraj";
  if (diffDay < 7) return `${diffDay} dni temu`;

  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Skrócenie treści posta do podglądu na liście.
// Tnie po słowie aby nie pojawiło się "...lor" zamiast "...lorem".
export function truncateContent(content: string, maxLength = 200): string {
  if (content.length <= maxLength) return content;
  const truncated = content.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "…";
}

// Pierwsza litera (do placeholdera avatara) — bezpieczna nawet dla pustych stringów.
export function getInitial(text: string | null | undefined): string {
  if (!text) return "?";
  return text[0].toUpperCase();
}
