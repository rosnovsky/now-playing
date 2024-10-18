import { useLoaderData } from '@remix-run/react';
import React from 'react';
import { usePollData } from '~/hooks/usePollingData';
import { songsSchema, type Song } from "~/types";
import { StarRating } from './StarRating';

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

export const LastPlayedSongs: React.FC = () => {
  const { headers, initialSongs } = useLoaderData<{ headers: Record<string, string>, initialSongs: Song[] }>();
  const { data: songs, isLoading, error } = usePollData<Song[]>('songs?sort=lastViewedAt:desc&limit=50', {
    schema: songsSchema,
    headers,
    initialData: initialSongs,
    interval: 60000
  });

  if (isLoading) {
    const totalItems = 50;
    const columns = 3
    const itemsPerColumn = Math.ceil(totalItems / columns);
    return (
      <div className="w-full min-h-svh animate-pulse">
        <h2 className="text-2xl font-bold mb-4 text-green-400">Last 50 Played Songs</h2>
        <div className={`flex flex-col lg:flex-row`}>
          {[...Array(3)].map((_, columnIndex) => (
            <div key={columnIndex} className={`lg:w-1/${columns} flex flex-col`}>
              {[...Array(itemsPerColumn)].map((_, itemIndex) => (
                <div key={itemIndex} className="bg-gray-800 rounded-lg overflow-hidden shadow-sm m-2 py-12 px-2 flex items-center h-28">
                  <div className="w-16 h-16 bg-gray-700 rounded-md mr-3"></div>
                  <div className="flex-grow overflow-hidden my-5">
                    <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded w-2/3 mb-2"></div>
                    <div className="flex">
                      {[...Array(5)].map((_, starIndex) => (
                        <div key={starIndex} className="w-4 h-4 bg-gray-600 rounded-full mr-1"></div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right ml-2 flex flex-col items-end">
                    <div className="h-3 bg-gray-600 rounded w-20 mb-2"></div>
                    <div className="h-5 bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return "ERROR!"
  }

  if (!songs) {
    return <div>No songs data available</div>;
  }

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

  return (
    <div className="w-full min-h-svh">
      <h2 className="text-2xl font-bold mb-4 text-green-400">Last 50 Played Songs</h2>
      <div className={`flex flex-col lg:flex-row`}>
        {distributeItems().map((columnItems, columnIndex) => (
          <div key={columnIndex} className={`lg:w-1/${columns} flex flex-col`}>
            {columnItems.map((song) => (
              <div key={song.ratingKey} className="bg-gray-800 rounded-lg overflow-hidden shadow-sm m-2 py-8 px-2 flex items-center h-24">
                <img src={song.thumb} alt={`${song.title} cover`} className="w-16 h-16 object-cover rounded-md mr-3" />
                <div className="flex-grow overflow-hidden my-5">
                  <h3 className="text-md font-semibold text-white truncate">{song.title}</h3>
                  <p className="text-xs text-gray-400 truncate">{song.grandparentTitle}</p>
                  <p className="text-xs text-gray-500 truncate">{song.parentTitle}</p>
                  <StarRating rating={song.userRating ?? 0} />
                </div>
                <div className="text-right ml-2 flex flex-col items-end">
                  <p className="text-xs text-gray-600 font-thin truncate mb-1">
                    {song.lastViewedAt ? getTimeAgo(song.lastViewedAt) : 'Never played'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
