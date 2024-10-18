import { useLoaderData } from '@remix-run/react';
import React from 'react';
import { usePollData } from '~/hooks/usePollingData';
import { songsSchema, type Song } from "~/types";

export const TopSongs: React.FC = () => {
  const { headers, initialSongs } = useLoaderData<{ headers: Record<string, string>, initialSongs: Song[] }>();
  const { data: songs, isLoading, error } = usePollData<Song[]>('songs?sort=viewCount%3Adesc&limit=10', {
    schema: songsSchema,
    headers,
    initialData: initialSongs,
  });

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <ul className="space-y-4">
          {[...Array(10)].map((_, index) => (
            <li key={index} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg animate-pulse">
              <div className="flex items-center p-4">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-20 h-20 bg-gray-700 rounded-md"></div>
                </div>
                <div className="flex-grow">
                  <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-600 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-600 rounded w-2/3"></div>
                </div>
                <div className="flex-shrink-0 ml-4 text-right">
                  <div className="h-5 bg-gray-700 rounded w-20 mb-2"></div>
                  <div className="h-4 bg-gray-600 rounded w-10"></div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (error) {
    return "ERROR!"
  }

  if (!songs || songs.length === 0) {
    return <div>No top songs data available</div>;
  }

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
