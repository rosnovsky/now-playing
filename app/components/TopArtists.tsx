import { useLoaderData } from "@remix-run/react";
import React from "react";
import { usePollData } from "~/hooks/usePollingData";
import { artistsSchema, type Artist } from "~/types";

export const TopArtists: React.FC = () => {
  const { headers } = useLoaderData<{ headers: Record<string, string> }>();
  const { data: artists, isLoading, error } = usePollData<Artist[]>('artists', {
    schema: artistsSchema,
    headers,
    interval: 120000
  });

  if (isLoading) {
    return (
      <div className="w-full animate-pulse">
        <h2 className="text-2xl font-bold mb-4 text-green-400">Top 5 Artists</h2>
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
    return "ERROR!"
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4 text-green-400">Top 5 Artists</h2>
      <ul className="space-y-4">
        {artists?.slice(0, 5).map((artist, index) => (
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
