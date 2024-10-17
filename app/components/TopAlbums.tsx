import { useLoaderData } from "@remix-run/react";
import React from "react";
import { usePollData } from "~/hooks/usePollingData";
import { ErrorBoundary } from "~/root";
import { albumsSchema, type Album } from "~/types";

export const TopAlbums: React.FC = () => {
  const { headers } = useLoaderData<{ headers: Record<string, string> }>();
  const { data: albums, isLoading, error } = usePollData<Album[]>('albums', {
    schema: albumsSchema,
    headers,
    interval: 1000
  });

  if (isLoading) {
    return (
      <div className="w-full mt-8 animate-pulse">
        <h2 className="text-2xl font-bold mb-4 text-green-400">Top 5 Albums</h2>
        <ul className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <li key={index} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
                </div>
                <div className="flex-grow">
                  <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-600 rounded w-1/4"></div>
                </div>
                <div className="text-right">
                  <div className="h-5 bg-green-400 rounded w-24"></div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (error) {
    return <ErrorBoundary />;
  }

  return (
    <div className="w-full mt-8">
      <h2 className="text-2xl font-bold mb-4 text-green-400">Top 5 Albums</h2>
      <ul className="space-y-4">
        {albums?.slice(0, 5).map((album, index) => (
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
