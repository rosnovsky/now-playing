import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { CurrentMusicComponent } from "~/components/CurrentMusic";
import { LastPlayedSongs } from "~/components/LastPlayedSongs";
import { TopAlbums } from "~/components/TopAlbums";
import { TopArtists } from "~/components/TopArtists";
import { TopSongs } from "~/components/TopSongs";
import { usePollData } from "~/hooks/usePollingData";
import { ErrorBoundary } from "~/root";
import { fetcher } from "~/utils/fetcher";
import { albumsSchema, type Album } from "./api.albums";
import { artistsSchema, type Artist } from "./api.artists";
import { songsSchema, type Song } from "./api.songs";

type LoaderData = {
  songs: Song[];
  artists: Artist[];
  albums: Album[];
  recentlyPlayed: Song[];
};

export const loader = async ({ request }: { request: Request }) => {
  const headers = Object.fromEntries(request.headers);

  const fetchEntity = async (endpoint: string) => {
    const { status, data, headers: responseHeaders } = await fetcher(`${import.meta.env.VITE_API_URL}/api/${endpoint}`, { headers });
    return { status, data, headers: responseHeaders };
  };

  const [songsResponse, artistsResponse, albumsResponse, recentlyPlayedResponse] = await Promise.all([
    fetchEntity('songs?sort=viewCount%3Adesc&limit=50'),
    fetchEntity('artists'),
    fetchEntity('albums'),
    fetchEntity('songs?sort=lastViewedAt:desc&limit=50'),
  ]);

  if (songsResponse.status === 304 && artistsResponse.status === 304 && albumsResponse.status === 304 && recentlyPlayedResponse.status === 304) {
    return json(null, { status: 304 });
  }

  const validatedSongs = songsSchema.parse(songsResponse.data);
  const validatedArtists = artistsSchema.parse(artistsResponse.data);
  const validatedAlbums = albumsSchema.parse(albumsResponse.data);
  const validatedRecentlyPlayed = songsSchema.parse(recentlyPlayedResponse.data);

  const loaderData: LoaderData = {
    songs: validatedSongs,
    artists: validatedArtists,
    albums: validatedAlbums,
    recentlyPlayed: validatedRecentlyPlayed,
  };

  return json(loaderData, {
    headers: {
      'ETag': songsResponse.headers.get('ETag') || '',
      'Cache-Control': 'no-cache'
    }
  });
};

export default function Index() {
  const initialData = useLoaderData<typeof loader>();
  const { data: songs, isLoading: songsLoading, error: songsError } = usePollData<Song[]>('songs?sort=viewCount%3Adesc&limit=50');
  const { data: artists, isLoading: artistsLoading, error: artistsError } = usePollData<Artist[]>('artists');
  const { data: albums, isLoading: albumsLoading, error: albumsError } = usePollData<Album[]>('albums');
  const { data: recentlyPlayed, isLoading: recentlyPlayedLoading, error: recentlyPlayedError } = usePollData<Song[]>('songs?sort=lastViewedAt:desc&limit=50');

  if (songsLoading || artistsLoading || albumsLoading || recentlyPlayedLoading) {
    return <div>Loading...</div>;
  }

  if (songsError || artistsError || albumsError || recentlyPlayedError) {
    return <ErrorBoundary />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-green-400">My Music Stats</h1>
        <div className="mb-8">
          <CurrentMusicComponent />
        </div>
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          <div className="lg:w-2/3">
            <h2 className="text-2xl font-bold mb-4 text-green-400">Top 10 Most Played Songs</h2>
            <TopSongs songs={songs ?? initialData?.songs} />
          </div>
          <div className="lg:w-1/3">
            <TopArtists artists={artists ?? initialData?.artists} />
            <TopAlbums albums={albums ?? initialData?.albums} />
          </div>
        </div>
        <div>
          <LastPlayedSongs songs={recentlyPlayed ?? initialData?.recentlyPlayed} />
        </div>
      </div>
    </div>
  );
}
