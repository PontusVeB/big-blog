// Pomocnicze funkcje dla modułu wiadomości.

/**
 * Zwraca parę ID uczestników w porządku kanonicznym (mniejszy UUID pierwszy).
 * Dzięki temu rozmowa A↔B i B↔A to zawsze ta sama para (user1Id, user2Id),
 * a unikalny indeks na (user1_id, user2_id) gwarantuje jedną rozmowę na parę.
 */
export function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/**
 * Godzina wiadomości w formacie HH:MM (np. "14:32").
 */
export function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Etykieta separatora dnia w wątku (np. "Dzisiaj", "Wczoraj", "12 maja 2026").
 */
export function formatMessageDay(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Dzisiaj";
  if (sameDay(date, yesterday)) return "Wczoraj";
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
