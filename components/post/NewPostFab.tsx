// Floating Action Button — pływający przycisk "Nowy post".
//
// Renderowany TYLKO na stronie głównej i TYLKO dla zalogowanych userów
// (decyzję podejmuje app/page.tsx — ten komponent jest czysto prezentacyjny).
//
// Pozycjonowanie: position: fixed (w globals.css), więc miejsce w DOM
// nie ma znaczenia. Na desktopie pigułka z ikoną + tekstem,
// na mobile okrągły przycisk z samą ikoną "+".

import Link from "next/link";
import { Plus } from "lucide-react";

export default function NewPostFab() {
  return (
    <Link
      href="/posty/nowy"
      className="new-post-fab"
      aria-label="Napisz nowy post"
      title="Napisz nowy post"
    >
      <Plus size={24} strokeWidth={2.5} className="new-post-fab-icon" />
      <span className="new-post-fab-label">Nowy post</span>
    </Link>
  );
}
