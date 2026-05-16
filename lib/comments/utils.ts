// Pomocnicze funkcje dla komentarzy.

import type { CommentRow, CommentNode } from "./types";

// Buduje drzewo komentarzy z płaskiej listy (po parent_id).
// likedIds: zbiór ID komentarzy które bieżący user polubił — używany do
// ustawienia liked_by_me na każdym węźle (potrzebne dla serca w UI).
export function buildCommentTree(
  comments: CommentRow[],
  likedIds: Set<string> = new Set()
): CommentNode[] {
  const sorted = [...comments].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const map = new Map<string, CommentNode>();
  for (const c of sorted) {
    map.set(c.id, {
      ...c,
      children: [],
      liked_by_me: likedIds.has(c.id),
    });
  }

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

// Polskie deklinacje liczby komentarzy
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
