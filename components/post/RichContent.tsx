// RichContent — komponent renderujący treść posta z wykrywaniem embedów.
// Server Component (bez "use client") — react-tweet z którego korzystamy
// jest async server component, więc całość renderuje się serwerowo.
//
// Dla TikToka i Instagrama dorzucamy ich oficjalne skrypty (next/script),
// ale TYLKO gdy w treści jest co najmniej jeden taki embed.

import Script from "next/script";
import { parseContent, type ContentPart } from "@/lib/posts/render";
import YouTubeEmbed from "./embeds/YouTubeEmbed";
import TweetEmbed from "./embeds/TweetEmbed";
import TikTokEmbed from "./embeds/TikTokEmbed";
import InstagramEmbed from "./embeds/InstagramEmbed";

function renderPart(part: ContentPart, idx: number) {
  switch (part.type) {
    case "text":
      // Tekst z zachowaniem białych znaków (akapity, emoji, itp.)
      return (
        <p key={idx} className="post-paragraph">
          {part.content}
        </p>
      );
    case "youtube":
      return <YouTubeEmbed key={idx} videoId={part.videoId} />;
    case "tweet":
      return <TweetEmbed key={idx} tweetId={part.tweetId} />;
    case "tiktok":
      return (
        <TikTokEmbed
          key={idx}
          videoId={part.videoId}
          userId={part.userId}
          url={part.url}
        />
      );
    case "instagram":
      return <InstagramEmbed key={idx} postId={part.postId} url={part.url} />;
  }
}

export default function RichContent({ content }: { content: string }) {
  const parts = parseContent(content);
  const hasTikTok = parts.some((p) => p.type === "tiktok");
  const hasInstagram = parts.some((p) => p.type === "instagram");

  return (
    <>
      {parts.map((part, i) => renderPart(part, i))}
      {hasTikTok && (
        <Script src="https://www.tiktok.com/embed.js" strategy="lazyOnload" />
      )}
      {hasInstagram && (
        <Script
          src="https://www.instagram.com/embed.js"
          strategy="lazyOnload"
        />
      )}
    </>
  );
}
