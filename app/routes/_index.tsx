import { json, type LoaderFunction, type MetaFunction } from "@remix-run/node";
import { CurrentlyPlayingCard } from "~/components/CurrentMusic/CurrentMusic";
import { LastPlayedSongs } from "~/components/LastPlayedSongs";
import { MoodComponent } from "~/components/MoodComponent";
import { UniversalTrackCard } from "~/components/Song";
import { TopAlbums } from "~/components/TopAlbums";
import { TopArtists } from "~/components/TopArtists";
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
            Your personal music listening insights from Plex server
          </p>
        </div>
        <CurrentlyPlayingCard />
        <div className="absolute right-0 top-0 bottom-4 w-32 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
// <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
//           {/* Top 10 Most Played Songs */}
//           <div className="space-y-4">
//             <h2 className="text-2xl font-sans font-bold text-primary flex items-center gap-2">
//               <span className="font-mono text-sm text-muted-foreground">#01</span>
//               Top 10 Songs
//             </h2>
//             <div className="space-y-2">
//               {mockTracks.map((track) => (
//                 <UniversalTrackCard key={track.id} track={track} showRank showPlays isTopThree={track.rank <= 3} />
//               ))}
//             </div>
//           </div>

//           {/* Top 10 Albums */}
//           <div className="space-y-4">
//             <h2 className="text-2xl font-sans font-bold text-primary flex items-center gap-2">
//               <span className="font-mono text-sm text-muted-foreground">#02</span>
//               Top 10 Albums
//             </h2>
//             <div className="space-y-2">
//               {mockAlbums.map((album) => (
//                 <UniversalAlbumCard key={album.id} album={album} showRank showPlays isTopThree={album.rank <= 3} />
//               ))}
//             </div>
//           </div>

//           {/* Top 10 Artists */}
//           <div className="space-y-4">
//             <h2 className="text-2xl font-sans font-bold text-primary flex items-center gap-2">
//               <span className="font-mono text-sm text-muted-foreground">#03</span>
//               Top 10 Artists
//             </h2>
//             <div className="space-y-2">
//               {mockArtists.map((artist) => (
//                 <UniversalArtistCard key={artist.id} artist={artist} showRank showPlays isTopThree={artist.rank <= 3} />
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Last 50 Played Songs with fade effect */}
//         <div className="space-y-4">
//           <h2 className="text-2xl font-sans font-bold text-primary flex items-center gap-2">
//             <span className="font-mono text-sm text-muted-foreground">#04</span>
//             Recently Played
//           </h2>
//           <div className="relative">
//             <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
//               {mockRecentTracks.map((track, index) => {
//                 const isFading = index >= mockRecentTracks.length - 10
//                 const fadeOpacity = isFading ? Math.max(0.1, 1 - (index - (mockRecentTracks.length - 10)) / 10) : 1

//                 return (
//                   <UniversalTrackCard
//                     key={track.id}
//                     track={track}
//                     variant="compact"
//                     className="flex-shrink-0 w-80 transition-opacity duration-300"
//                     style={{ opacity: fadeOpacity }}
//                   />
//                 )
//               })}
//             </div>
//                   </div>
//                 </div>
