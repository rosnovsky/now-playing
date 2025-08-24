import { useLoaderData } from "@remix-run/react";
import React from "react";
import { usePollData } from "~/hooks/usePollingData";
import { artistsSchema, type Artist } from "~/types";
import { UniversalArtistCard } from "./Artist";

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
        <ul className="space-y-4">
          {[...Array(10)].map((_, index) => (
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

  if (error || !artists) {
    return "ERROR!"
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <ul className="space-y-4">
        {artists.slice(0, 5).map((artist, index) => (
          <li key={artist.ratingKey} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
            {/* TODO: How it should work: */}
            <UniversalArtistCard showPlays isTopThree={index + 1 <= 3}  showRank rank={index +1 } artist={artist} />
          </li>
        ))}
      </ul>
    </div>
  );
};
