import { usePollData } from "~/hooks/usePollingData";
import { Artist, artistsSchema } from "~/types";
import { TopArtistsListSkeleton } from "./TopArtistsListSkeleton";

interface TopArtistsListProps {
  timeRange: string;
}

export function TopArtistsList({ timeRange }: TopArtistsListProps) {
  const { data: artists, isLoading, error } = usePollData<Artist[]>(
    `artists?sort=viewCount%3Adesc&limit=10&lastViewedAt>=${timeRange}&viewCount>=1`,
    {
      schema: artistsSchema,
      interval: 120000
    }
  );

  if (isLoading) {
    return <TopArtistsListSkeleton />;
  }

  if (error) {
    return <div>Error loading artists</div>;
  }

  return (
    <ul className="space-y-4">
      {artists?.map((artist, index) => (
        <li key={artist.ratingKey} className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center">
            <img
              src={artist.thumb}
              alt={artist.title}
              className="w-16 h-16 object-cover rounded-full mr-4"
            />
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-white">{artist.title}</h3>
              <p className="text-gray-500 text-sm">#{index + 1}</p>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-semibold">
                {artist.viewCount} plays
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
