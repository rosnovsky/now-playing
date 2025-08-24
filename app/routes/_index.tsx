import { json, type LoaderFunction, type MetaFunction } from "@remix-run/node";
import { CurrentlyPlayingCard } from "~/components/CurrentMusic/CurrentlyPlayingCard";
import { LastPlayedSongs } from "~/components/LastPlayedSongs";
import { UniversalTrackCard } from "~/components/Song";
// import { LastPlayedSongs } from "~/components/LastPlayedSongs";
// import { MoodComponent } from "~/components/MoodComponent";
// import { UniversalTrackCard } from "~/components/Song";
import { TopAlbums } from "~/components/TopAlbums";
import { TopArtists } from "~/components/TopArtists";
// import { TopArtists } from "~/components/TopArtists";
import { TopSongs } from "~/components/TopSongs";

export const loader: LoaderFunction = async ({ request }) => {
  const headers = Object.fromEntries(request.headers);

  return json({
    headers,
    ogUrl: `${import.meta.env.VITE_API_URL}/resources/og`
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: "My Music Stats | Real-time Listening History"
    },
    {
      name: "description",
      content: "Real-time music listening statistics and analytics, powered by Plex"
    },
    {
      property: "og:title",
      content: "My Music Stats"
    },
    {
      property: "og:description",
      content: "Check out my real-time music listening statistics, powered by Plex"
    },
    {
      property: "og:image",
      content: `${import.meta.env.VITE_API_URL}/resources/og`
    },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:type", content: "image/png" },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://music.rosnovsky.us" },
    { name: "twitter:card", content: "summary_large_image" },
  ];
};

export default function Index() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-sans font-black text-foreground tracking-tight">Plex Music Stats</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">
            My personal music listening insights from Plex server
          </p>
        </div>

        <CurrentlyPlayingCard />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 space-y-10 mt-10">
          {/* Top 10 Most Played Songs */}
          <div className="space-y-4">
            <h2 className="text-2xl font-sans font-bold text-primary flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">#01</span>
              Top 10 Songs
            </h2>
            <div className="w-full space-y-2">
              <TopSongs />
            </div>
          </div>
          {/* Top 10 Most Played Songs */}
          <div className="space-y-4">
            <h2 className="text-2xl font-sans font-bold text-primary flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">#02</span>
              Top 10 Albums
            </h2>
            <div className="w-full space-y-2">
              <TopAlbums />
            </div>
          </div>

          {/* Top 10 Most Played Songs */}
          <div className="space-y-4">
            <h2 className="text-2xl font-sans font-bold text-primary flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">#03</span>
              Top 10 Artists
            </h2>
            <div className="w-full space-y-2">
              <TopArtists />
            </div>
          </div>
        </div>
      </div>


          {/* Last 50 Played Songs with fade effect */}
          <div className="space-y-4">
            <h2 className="text-2xl font-sans font-bold text-primary flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">#04</span>
              Recently Played
            </h2>
            <div className="relative">
              <div className="w-full gap-4 overflow-x-auto pb-4 scrollbar-hide">
                <LastPlayedSongs />
              </div>
              <div className="absolute left-0 top-0 bottom-4 w-32 bg-gradient-to-r from-background to-transparent pointer-events-none" />
            </div>
          </div>
        <div className="absolute right-0 top-0 bottom-4 w-32 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>

  );
}
