// Osadzenie filmu z TikToka.
// TikTok wymaga oficjalnego skryptu embed.js, który wykrywa element <blockquote>
// i podmienia go na iframe z odtwarzaczem. Skrypt ładujemy raz per strona
// w komponencie RichContent (gdy są jakieś TikToki w treści).

type Props = {
  videoId: string;
  userId: string;
  url: string;
};

export default function TikTokEmbed({ videoId, userId, url }: Props) {
  return (
    <div className="embed-wrapper tiktok-embed-wrapper">
      <blockquote
        className="tiktok-embed"
        cite={url}
        data-video-id={videoId}
        style={{ maxWidth: 605, minWidth: 325 }}
      >
        <section>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`https://www.tiktok.com/@${userId}`}
          >
            @{userId}
          </a>
        </section>
      </blockquote>
    </div>
  );
}
