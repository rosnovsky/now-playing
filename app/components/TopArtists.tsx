import type { Artist } from "~/routes/api.artists";

interface TopArtistsProps {
  artists: Artist[];
}

export const TopArtists: React.FC<TopArtistsProps> = ({ artists }: TopArtistsProps) => {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4 text-green-400">Top 5 Artists</h2>
      <ul className="space-y-4">
        {artists.slice(0, 5).map((artist, index) => (
          <li key={artist.ratingKey} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-4">
                <img src={artist.thumb} alt={`${artist.title} thumbnail`} className="w-16 h-16 object-cover rounded-full" />
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-semibold text-white">{artist.title}</h3>
                <p className="text-gray-400 text-sm">#{index + 1}</p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-semibold">{artist.viewCount || 0} plays</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
