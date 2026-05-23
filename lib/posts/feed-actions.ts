"use server";
// Server Action dla przycisku "Pokaż więcej" na stronie głównej.
// Cienka obwoluta na getFeedPosts — pobiera kolejną porcję postów.

import { getFeedPosts } from "./feed";

export async function loadMorePosts(tagSlug: string | null, offset: number) {
  return getFeedPosts({ tagSlug, offset });
}
