import type { Album } from "~/routes/api.albums";

interface TopAlbumsProps {
  albums: Album[];
}

export const TopAlbums: React.FC<TopAlbumsProps> = ({ albums }: TopAlbumsProps) => {
  return (
    <div className="w-full mt-8">
      <h2 className="text-2xl font-bold mb-4 text-green-400">Top 5 Albums</h2>
      <ul className="space-y-4">
        {albums.slice(0, 5).map((album, index) => (
          <li key={album.ratingKey} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-4">
                <img src={album.thumb} alt={`${album.title} cover`} className="w-16 h-16 object-cover rounded-md" />
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-white">{album.title}</h3>
                <p className="text-gray-400 text-sm">{album.parentTitle}</p>
                <p className="text-gray-500 text-xs">#{index + 1}</p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-semibold">{album.viewCount || 0} plays</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
