// Osadzenie filmu z YouTube przez iframe.
// Brak zewnętrznego skryptu, brak dodatkowych zależności.
// Aspect-ratio 16:9 (oraz responsywność) w CSS.

export default function YouTubeEmbed({ videoId }: { videoId: string }) {
  return (
    <div className="embed-wrapper">
      <div className="youtube-embed">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}
