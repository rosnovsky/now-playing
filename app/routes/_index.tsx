import { json, type LoaderFunction, type MetaFunction } from "@remix-run/node";
import { CurrentMusicComponent } from "~/components/CurrentMusic/";
import { LastPlayedSongs } from "~/components/LastPlayedSongs";
import { MoodComponent } from "~/components/MoodComponent";
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
    <div className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4 text-green-400">
          My Music Stats
        </h1>
        <p className="text-sm  text-center mb-12 text-gray-300">
          What I&apos;ve been listening to lately
        </p>
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          <div className="lg:w-2/3">
            <CurrentMusicComponent />
          </div>
          <div className="lg:w-1/3">
            <MoodComponent />
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          <div className="lg:w-2/3">
            <h2 className="text-2xl font-bold mb-4 text-green-400">
              Top 10 Most Played Songs
            </h2>
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
