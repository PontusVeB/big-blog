// PostActions — przyciski edycji i usuwania posta.
// Server Component (decyzje o widoczności robimy serwerowo z dostępem do profilu).
// DeleteButton w środku jest klientem — potrzebuje confirm() i transition.

import Link from "next/link";
import DeleteButton from "./DeleteButton";

type Props = {
  postId: string;
  canEdit: boolean;
  canDelete: boolean;
};

export default function PostActions({ postId, canEdit, canDelete }: Props) {
  // Brak uprawnień = brak komponentu (czyste UI)
  if (!canEdit && !canDelete) return null;

  return (
    <div className="post-actions">
      {canEdit && (
        <Link href={`/posty/${postId}/edytuj`} className="btn btn-secondary">
          ✏️ Edytuj
        </Link>
      )}
      {canDelete && <DeleteButton postId={postId} />}
    </div>
  );
}
