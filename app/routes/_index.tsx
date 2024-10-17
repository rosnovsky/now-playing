import { json } from "@remix-run/node";
import { CurrentMusicComponent } from "~/components/CurrentMusic";
import { LastPlayedSongs } from "~/components/LastPlayedSongs";
// import { LastPlayedSongs } from "~/components/LastPlayedSongs";
import { TopAlbums } from "~/components/TopAlbums";
// import { TopSongs } from "~/components/TopSongs";
import { TopArtists } from "~/components/TopArtists";
import { TopSongs } from "~/components/TopSongs";

export const loader = async ({ request }: { request: Request }) => {
  const headers = Object.fromEntries(request.headers);
  return json({ headers });
};

export default function Index() {
  return (
    <div className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-green-400">My Music Stats</h1>
        <div className="mb-8">
          <CurrentMusicComponent />
        </div>
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          <div className="lg:w-2/3">
            <h2 className="text-2xl font-bold mb-4 text-green-400">Top 10 Most Played Songs</h2>
            <TopSongs />
          </div>
          <div className="lg:w-1/3">
            <TopArtists />
            <TopAlbums />
          </div>
        </div>
        <div>
          <LastPlayedSongs />
        </div>
      </div>
    </div>
  );
}
