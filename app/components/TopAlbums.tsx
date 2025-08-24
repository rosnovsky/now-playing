import { useLoaderData } from "@remix-run/react";
import React from "react";
import { usePollData } from "~/hooks/usePollingData";
import { albumsSchema, type Album } from "~/types";
import { UniversalAlbumCard } from "./Album";

export const TopAlbums: React.FC = () => {
  const { headers } = useLoaderData<{ headers: Record<string, string> }>();
  const { data: albums, isLoading, error } = usePollData<Album[]>('albums', {
    schema: albumsSchema,
    headers,
    interval: 120000
  });

  if (isLoading) {
    return (
      <div className="w-full mt-8 animate-pulse">
        <h2 className="text-2xl font-bold mb-4 text-green-400">Top 5 Albums</h2>
        <ul className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <li key={index} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg p-4">
              <div className="flex items-center">
                <div className="shrink-0 mr-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
                </div>
                <div className="grow">
                  <div className="h-6 bg-gray-700 rounded-sm w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-600 rounded-sm w-1/4"></div>
                </div>
                <div className="text-right">
                  <div className="h-5 bg-green-400 rounded-sm w-24"></div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (error || !albums) {
    return "ERROR!"
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <ul className="space-y-4">
        {albums.slice(0, 5).map((album, index) => (
          <li key={album.ratingKey} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
            {/* TODO: How it should work: */}
            <UniversalAlbumCard isTopThree={index + 1 <= 3}   showPlays showRank rank={index +1 } album={album} />
          </li>
        ))}
      </ul>
    </div>
  );
};
