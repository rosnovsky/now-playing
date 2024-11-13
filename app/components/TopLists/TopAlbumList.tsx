import { usePollData } from "~/hooks/usePollingData";
import { Album, albumsSchema } from "~/types";
import { TopAlbumsListSkeleton } from "./TopAlbumsListSkeleton";

interface TopAlbumsListProps {
  timeRange: string;
}

export function TopAlbumsList({ timeRange }: TopAlbumsListProps) {
  const { data: albums, isLoading, error } = usePollData<Album[]>(
    `albums?sort=viewCount%3Adesc&limit=10&lastViewedAt>=${timeRange}&viewCount>=1`,
    {
      schema: albumsSchema,
      interval: 120000
    }
  );

  if (isLoading) {
    return <TopAlbumsListSkeleton />;
  }

  if (error) {
    return <div>Error loading albums</div>;
  }

  return (
    <ul className="space-y-4">
      {albums?.map((album, index) => (
        <li key={album.ratingKey} className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center">
            <img
              src={album.thumb}
              alt={album.title}
              className="w-16 h-16 object-cover rounded-md mr-4"
            />
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-white">{album.title}</h3>
              <p className="text-gray-400">{album.parentTitle}</p>
              <p className="text-gray-500 text-sm">#{index + 1}</p>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-semibold">
                {album.viewCount} plays
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
