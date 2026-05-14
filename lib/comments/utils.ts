// Pomocnicze funkcje dla komentarzy.

import type { CommentRow, CommentNode } from "./types";

// Buduje drzewo komentarzy z płaskiej listy (po parent_id).
// Sortowanie: w obrębie tego samego rodzica — chronologicznie (najstarsze pierwsze).
// Komentarze bez parent_id (lub z nieznanym parent_id) trafiają jako root.
export function buildCommentTree(comments: CommentRow[]): CommentNode[] {
  // Najpierw posortuj po created_at — to gwarantuje że dzieci dorzucamy w kolejności
  const sorted = [...comments].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Mapa id → node (z pustą tablicą dzieci do uzupełnienia)
  const map = new Map<string, CommentNode>();
  for (const c of sorted) {
    map.set(c.id, { ...c, children: [] });
  }

  // Podpinanie dzieci pod rodziców
  const roots: CommentNode[] = [];
  for (const c of sorted) {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

// Polskie deklinacje liczby komentarzy: 1 komentarz / 2 komentarze / 5 komentarzy
export function commentsLabel(n: number): string {
  if (n === 0) return "Brak komentarzy";
  if (n === 1) return "1 komentarz";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${n} komentarze`;
  }
  return `${n} komentarzy`;
}
