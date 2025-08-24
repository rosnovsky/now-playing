import { useLoaderData } from '@remix-run/react';
import React from 'react';
import { usePollData } from '~/hooks/usePollingData';
import { songsSchema, type Song } from "~/types";
import { UniversalTrackCard } from './Song';

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
                <div key={itemIndex} className="bg-gray-800 rounded-lg overflow-hidden shadow-xs m-2 py-12 px-2 flex items-center h-28">
                  <div className="w-16 h-16 bg-gray-700 rounded-md mr-3"></div>
                  <div className="grow overflow-hidden my-5">
                    <div className="h-4 bg-gray-700 rounded-sm w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded-sm w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded-sm w-2/3 mb-2"></div>
                    <div className="flex">
                      {[...Array(5)].map((_, starIndex) => (
                        <div key={starIndex} className="w-4 h-4 bg-gray-600 rounded-full mr-1"></div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right ml-2 flex flex-col items-end">
                    <div className="h-3 bg-gray-600 rounded-sm w-20 mb-2"></div>
                    <div className="h-5 bg-gray-700 rounded-sm w-16"></div>
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

  return (
    <div className="space-y-4">
      <div className="">
        <div className="grid grid-cols-1 md:gris-cols-2 xl:grid-cols-3 gap-4  pb-4 scrollbar-hide justify-between">
          {sortedSongs.map((track) => {
            // const isFading = index >= songs.length - 10
            // const fadeOpacity = isFading ? Math.max(0.1, 1 - (index - (songs.length - 10)) / 10) : 1

            return (
              <UniversalTrackCard
                key={track.ratingKey}
                showRank={false}
                track={track}
                variant="default"
                className="flex-shrink-0 max-w-100 transition-opacity duration-300"
                // style={{ opacity: fadeOpacity }}
              />
            )
          })}
        </div>
      </div>
        <div className="absolute right-0 top-0 bottom-4 w-32 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
};
