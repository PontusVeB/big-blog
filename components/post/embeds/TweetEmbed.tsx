// Osadzenie tweeta z X (dawniej Twitter).
// Używamy biblioteki react-tweet, która server-side fetchuje dane tweeta z Twitter
// Syndication API (publiczne, bez autoryzacji) i renderuje statyczny HTML.
// Brak skryptu z twitter.com — szybciej i bez problemów z prywatnością.

import { Suspense } from "react";
import { Tweet } from "react-tweet";

export default function TweetEmbed({ tweetId }: { tweetId: string }) {
  return (
    <div className="embed-wrapper tweet-embed-wrapper" data-theme="dark">
      <Suspense fallback={<div className="embed-loading">Ładowanie tweeta…</div>}>
        <Tweet id={tweetId} />
      </Suspense>
    </div>
  );
}
