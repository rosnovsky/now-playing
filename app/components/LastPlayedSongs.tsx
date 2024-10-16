import { Star, StarHalf } from 'lucide-react';
import type { Song } from "~/routes/api.songs";

interface LastPlayedSongsProps {
  songs: Song[];
}

const getTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'min', seconds: 60 },
    { label: 'sec', seconds: 1 }
  ];

  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i];
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
};

export const LastPlayedSongs: React.FC<LastPlayedSongsProps> = ({ songs }: LastPlayedSongsProps) => {
  const sortedSongs = [...songs]
    .sort((a, b) => (b.lastViewedAt || 0) - (a.lastViewedAt || 0))
    .slice(0, 50);

  const columns = Math.min(sortedSongs.length, 3);
  const itemsPerColumn = Math.ceil(sortedSongs.length / columns);

  const distributeItems = () => {
    const distributed = [];
    for (let i = 0; i < columns; i++) {
      distributed.push(sortedSongs.slice(i * itemsPerColumn, (i + 1) * itemsPerColumn));
    }
    return distributed;
  };

  const convertTo5StarRating = (userRating: number) => {
    if (userRating === undefined) return 0;
    const convertedRating = userRating / 2;
    return Math.round(convertedRating * 2) / 2;
  };

  const StarRating = ({ rating }: { rating: number }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <span key={i}>
            {i < fullStars ? (
              <Star className="w-4 h-4 text-gray-100 fill-current" />
            ) : i === fullStars && hasHalfStar ? (
              <StarHalf className="w-4 h-4 text-gray-100 fill-current" />
            ) : (
              <Star className="w-4 h-4 text-gray-400" />
            )}
          </span>
        ))}
      </div>
    );
  };

  const QualityBadge = ({ audioCodec, bitrate }: { audioCodec: string, bitrate: number }) => {
    let quality = 'MP3';
    if (audioCodec === 'flac' || audioCodec === 'alac') {
      quality = bitrate > 1000 ? 'Hi-Res' : 'Lossless';
    }
    return (
      <span className="border-[1px] border-gray-500 rounded-sm text-gray-500 text-xs px-2 py-1">
        {quality}
      </span>
    );
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4 text-green-400">Last 50 Played Songs</h2>
      <div className={`flex flex-col lg:flex-row lg:h-screen`}>
        {distributeItems().map((columnItems, columnIndex) => (
          <div key={columnIndex} className={`lg:w-1/${columns} flex flex-col `}>
            {columnItems.map((song) => (
              <div key={song.ratingKey} className="bg-gray-800 rounded-lg overflow-hidden shadow-sm m-2 py-12 px-2 flex items-center">
                <img src={song.thumb} alt={`${song.title} cover`} className="w-16 h-16 object-cover rounded-md mr-3" />
                <div className="flex-grow overflow-hidden my-5">
                  <h3 className="text-sm font-semibold text-white truncate">{song.title}</h3>
                  <p className="text-xs text-gray-400 truncate">{song.grandparentTitle}</p>
                  <p className="text-xs text-gray-500 truncate">{song.parentTitle}</p>
                  <StarRating rating={convertTo5StarRating(song.userRating ?? 0)} />
                </div>
                <div className="text-right ml-2 flex flex-col items-end">
                  <p className="text-xs text-gray-600 font-thin truncate mb-1">
                    {song.lastViewedAt ? getTimeAgo(song.lastViewedAt) : 'Never played'}
                  </p>
                  <QualityBadge audioCodec={song.Media![0].audioCodec} bitrate={song.Media![0].bitrate} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
