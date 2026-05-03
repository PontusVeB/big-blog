// PostActions — przyciski edycji i usuwania.

import Link from "next/link";
import { Pencil } from "lucide-react";
import DeleteButton from "./DeleteButton";

type Props = {
  postId: string;
  canEdit: boolean;
  canDelete: boolean;
};

export default function PostActions({ postId, canEdit, canDelete }: Props) {
  if (!canEdit && !canDelete) return null;

  return (
    <div className="post-actions">
      {canEdit && (
        <Link href={`/posty/${postId}/edytuj`} className="btn btn-secondary">
          <Pencil size={16} /> Edytuj
        </Link>
      )}
      {canDelete && <DeleteButton postId={postId} />}
    </div>
  );
}
