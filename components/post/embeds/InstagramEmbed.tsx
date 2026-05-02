// Osadzenie posta lub reela z Instagrama.
// Podobnie jak TikTok — Instagram wymaga skryptu embed.js, który zamienia
// blockquote na pełen widget. Skrypt ładowany raz per strona w RichContent.

type Props = {
  postId: string;
  url: string;
};

export default function InstagramEmbed({ postId, url }: Props) {
  return (
    <div className="embed-wrapper instagram-embed-wrapper">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{
          background: "#FFF",
          border: 0,
          borderRadius: 12,
          margin: "0 auto",
          maxWidth: 540,
          minWidth: 326,
          padding: 0,
          width: "100%",
        }}
      >
        <a href={url} target="_blank" rel="noopener noreferrer">
          Zobacz na Instagramie ({postId})
        </a>
      </blockquote>
    </div>
  );
}
