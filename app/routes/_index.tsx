import { json, type LoaderFunction, type MetaFunction } from "@remix-run/node";
import { CurrentlyPlayingCard } from "~/components/CurrentMusic";
import { LastPlayedSongs } from "~/components/LastPlayedSongs";
import { TopAlbums } from "~/components/TopAlbums";
import { TopArtists } from "~/components/TopArtists";
import { TopSongs } from "~/components/TopSongs";
import { fetcher } from "~/utils/fetcher";
import { songsSchema, currentMusicResponseSchema, albumsSchema } from "~/types";

export const loader: LoaderFunction = async ({ request }) => {
  const headers = Object.fromEntries(request.headers);

  try {
    // Fetch initial data for components
    const [songsResponse, currentMusicResponse, albumsResponse] = await Promise.allSettled([
      // Top songs data
      fetcher(
        `${process.env.VITE_PLEX_SERVER_URL}/library/sections/3/search?X-Plex-Token=${process.env.VITE_PLEX_TOKEN}&type=10&sort=viewCount%3Adesc&limit=10`,
        { headers: { Accept: 'application/json' } }
      ),
      // Current music data
      fetcher(
        `${process.env.VITE_PLEX_SERVER_URL}/status/sessions?X-Plex-Token=${process.env.VITE_PLEX_TOKEN}`,
        { headers: { Accept: 'application/json' } }
      ),
      // Albums data
      fetcher(
        `${process.env.VITE_PLEX_SERVER_URL}/library/sections/3/search?X-Plex-Token=${process.env.VITE_PLEX_TOKEN}&type=9&sort=viewCount%3Adesc&limit=5`,
        { headers: { Accept: 'application/json' } }
      )
    ]);

    // Process songs data
    let initialSongs = [];
    if (songsResponse.status === 'fulfilled' && songsResponse.value?.data?.MediaContainer?.Metadata) {
      try {
        const songsData = songsResponse.value.data.MediaContainer.Metadata.map((song: any) => ({
          ...song,
          lastViewedAt: song.lastViewedAt ? parseInt(song.lastViewedAt) * 1000 : null,
          addedAt: song.addedAt ? parseInt(song.addedAt) * 1000 : null,
          updatedAt: song.updatedAt ? parseInt(song.updatedAt) * 1000 : null,
          art: song.art ? `${process.env.VITE_API_URL}/api/images${song.art}` : null,
          parentThumb: song.parentThumb ? `${process.env.VITE_API_URL}/api/images${song.parentThumb}` : null,
          grandparentThumb: song.grandparentThumb ? `${process.env.VITE_API_URL}/api/images${song.grandparentThumb}` : null,
        }));
        initialSongs = songsSchema.parse(songsData);
      } catch (error) {
        console.warn('Failed to parse initial songs data:', error);
      }
    }

    // Process current music data
    let initialCurrentMusic = null;
    if (currentMusicResponse.status === 'fulfilled' && currentMusicResponse.value?.data) {
      try {
        const data = currentMusicResponse.value.data;
        const session = data?.MediaContainer?.Metadata?.[0];

        if (session) {
          const currentMusic = {
            ratingKey: session.ratingKey,
            title: session.title,
            parentTitle: session.parentTitle,
            grandparentTitle: session.grandparentTitle,
            albumArt: session.thumb ? `${process.env.VITE_API_URL}/api/images${session.thumb}` : null,
            lastViewedAt: session.lastViewedAt ? parseInt(session.lastViewedAt) * 1000 : Date.now(),
            isPlaying: session.Player?.state === 'playing',
          };
          initialCurrentMusic = { currentMusic };
        } else {
          initialCurrentMusic = { currentMusic: null };
        }
      } catch (error) {
        console.warn('Failed to parse initial current music data:', error);
        initialCurrentMusic = { currentMusic: null };
      }
    } else {
      initialCurrentMusic = { currentMusic: null };
    }

    return json({
      headers,
      ogUrl: `${import.meta.env.VITE_API_URL}/resources/og`,
      initialSongs,
      initialCurrentMusic,
    });
  } catch (error) {
    console.error('Failed to fetch initial data:', error);

    return json({
      headers,
      ogUrl: `${import.meta.env.VITE_API_URL}/resources/og`,
      initialSongs: [],
      initialCurrentMusic: { currentMusic: null },
    });
  }
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
          {/* Top 5 Most Played Songs */}
          <div className="space-y-4">
            <h2 className="text-2xl font-sans font-bold text-primary flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">#01</span>
              Most Played Songs
            </h2>
            <div className="w-full space-y-2">
              <TopSongs />
            </div>
          </div>
          {/* Top 5 Most Played Albums */}
          <div className="space-y-4">
            <h2 className="text-2xl font-sans font-bold text-primary flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">#02</span>
              Most Played Albums
            </h2>
            <div className="w-full space-y-2">
              <TopAlbums />
            </div>
          </div>

          {/* Top 10 Most Played Artists */}
          <div className="space-y-4">
            <h2 className="text-2xl font-sans font-bold text-primary flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">#03</span>
              Most Played Artists
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
