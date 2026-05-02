// Parser treści posta — rozpoznaje URL-e do YouTube/X/TikTok/Instagram.
// Każdy URL na własnej linii (oddzielony pustymi liniami) wykrywany jest jako embed.
// Inne treści (zwykły tekst, akapity, emoji) zostają jako tekst.
//
// Logika: dzielimy treść po znakach \n, dla każdej linii sprawdzamy regex.
// Jeśli linia matchuje którykolwiek wzorzec — to embed; inaczej dorzucamy do
// bufora tekstowego, który flushujemy gdy trafimy na embed albo koniec.

export type ContentPart =
  | { type: "text"; content: string }
  | { type: "youtube"; videoId: string }
  | { type: "tweet"; tweetId: string }
  | { type: "tiktok"; videoId: string; userId: string; url: string }
  | { type: "instagram"; postId: string; url: string };

// Wzorce URL-i serwisów społecznościowych
const PATTERNS = {
  // YouTube: watch?v=, youtu.be/, shorts/
  youtube:
    /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  // X / Twitter: status/123
  tweet: /^https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^/]+\/status\/(\d+)/,
  // TikTok: @user/video/123
  tiktok: /^https?:\/\/(?:www\.)?tiktok\.com\/@([^/]+)\/video\/(\d+)/,
  // Instagram: /p/ABC/ lub /reel/ABC/
  instagram: /^https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/,
} as const;

function detectEmbed(line: string): ContentPart | null {
  let m: RegExpMatchArray | null;

  m = line.match(PATTERNS.youtube);
  if (m) return { type: "youtube", videoId: m[1] };

  m = line.match(PATTERNS.tweet);
  if (m) return { type: "tweet", tweetId: m[1] };

  m = line.match(PATTERNS.tiktok);
  if (m) return { type: "tiktok", userId: m[1], videoId: m[2], url: line };

  m = line.match(PATTERNS.instagram);
  if (m) return { type: "instagram", postId: m[1], url: line };

  return null;
}

function flushText(buffer: string, parts: ContentPart[]) {
  const trimmed = buffer.trim();
  if (trimmed.length > 0) {
    parts.push({ type: "text", content: trimmed });
  }
}

export function parseContent(text: string): ContentPart[] {
  const lines = text.split("\n");
  const parts: ContentPart[] = [];
  let buffer = "";

  for (const line of lines) {
    const trimmedLine = line.trim();
    const embed = detectEmbed(trimmedLine);

    if (embed) {
      // Linia jest URL-em do embeda — flushujemy zebrany tekst i dorzucamy embed
      flushText(buffer, parts);
      buffer = "";
      parts.push(embed);
    } else {
      // Zwykły tekst — dorzucamy do bufora (zachowując oryginalną linię, bez trim)
      buffer += (buffer ? "\n" : "") + line;
    }
  }
  flushText(buffer, parts);

  return parts;
}
