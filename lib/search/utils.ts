// Pomocnicze funkcje dla wyszukiwarki.

/**
 * Buduje bezpieczne zapytanie `tsquery` z surowego tekstu wpisanego przez usera.
 *
 * Przykład:
 *   "Kotek i Pies!" → "kotek:* & pies:*"
 *
 * Dlaczego tak:
 *  - usuwamy wszystko poza literami (też polskimi), cyframi i spacjami —
 *    dzięki temu wynik jest ZAWSZE poprawnym tsquery (funkcja SQL `to_tsquery`
 *    rzuca błędem na niepoprawnym wejściu);
 *  - każdemu słowu doklejamy prefiks `:*` — pozwala dopasować odmiany po
 *    początku słowa ("kot" znajdzie "kotek", "kota", "koty"). To w polskim
 *    rekompensuje brak słownika tematyzującego;
 *  - słowa łączymy operatorem `&` (AND) — wynik musi zawierać wszystkie.
 *
 * Zwraca `null`, gdy nie ma sensownego słowa (np. same znaki specjalne) —
 * strona /szukaj pokazuje wtedy prompt zamiast pustych wyników.
 */
export function buildTsQuery(raw: string): string | null {
  const cleaned = raw
    .toLowerCase()
    // \p{L} = dowolna litera (Unicode, więc też ą/ć/ę…), \p{N} = cyfra
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim();

  if (!cleaned) return null;

  // Bierzemy tylko słowa min. 2-znakowe (jednoliterowe to za dużo szumu).
  const terms = cleaned.split(/\s+/).filter((term) => term.length >= 2);
  if (terms.length === 0) return null;

  return terms.map((term) => `${term}:*`).join(" & ");
}

/**
 * Polska odmiana słowa "post" zależnie od liczby.
 *  1 → post, 2-4 → posty, 5+ → postów (z wyjątkiem 12-14).
 */
export function postsLabel(n: number): string {
  if (n === 1) return "post";
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) {
    return "posty";
  }
  return "postów";
}
