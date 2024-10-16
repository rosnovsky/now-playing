import type { Song } from "~/routes/api.songs";

interface TopSongsProps {
  songs: Song[];
}

export const TopSongs: React.FC<TopSongsProps> = ({ songs }: TopSongsProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <ul className="space-y-4">
        {songs.slice(0, 10).map((song, index) => (
          <li key={song.ratingKey} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
            <div className="flex items-center p-4">
              <div className="flex-shrink-0 mr-4">
                <img src={song.thumb} alt={`${song.title} cover`} className="w-20 h-20 object-cover rounded-md" />
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-semibold text-white">{song.title}</h3>
                <p className="text-gray-400">{song.grandparentTitle}</p>
                <p className="text-gray-500 text-sm">{song.parentTitle}</p>
              </div>
              <div className="flex-shrink-0 ml-4 text-right">
                <p className="text-green-600 font-semibold">{song.viewCount || 0} plays</p>
                <p className="text-gray-500 text-sm">#{index + 1}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
