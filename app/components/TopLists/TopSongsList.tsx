import { usePollData } from "~/hooks/usePollingData";
import { Song, songsSchema } from "~/types";
import { TopSongsListSkeleton } from "./TopSongsListSkeleton";

interface TopSongsListProps {
  timeRange: string;
}

export function TopSongsList({ timeRange }: TopSongsListProps) {
  const { data: songs, isLoading, error } = usePollData<Song[]>(
    `songs?sort=viewCount%3Adesc&limit=10&timeRange=${timeRange}`,
    {
      schema: songsSchema,
      interval: 120000
    }
  );

  if (isLoading) {
    return <TopSongsListSkeleton />;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <ul className="space-y-4">
      {songs?.map((song, index) => (
        <li key={song.ratingKey} className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center">
            <img
              src={song.thumb}
              alt={song.title}
              className="w-16 h-16 object-cover rounded-md mr-4"
            />
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-white">{song.title}</h3>
              <p className="text-gray-400">{song.grandparentTitle}</p>
              <p className="text-gray-500 text-sm">{song.parentTitle}</p>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-semibold">
                {song.viewCount} plays
              </p>
              <p className="text-gray-500 text-sm">#{index + 1}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
