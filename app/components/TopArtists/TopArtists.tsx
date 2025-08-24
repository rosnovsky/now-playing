import React from 'react';
import { useLoaderData } from "@remix-run/react";
import { usePollData } from "~/hooks/usePollingData";
import { artistsSchema, type Artist } from "~/types";
import { UniversalArtistCard } from "../UniversalArtistCard";
import { ErrorState, EmptyState, SkeletonState } from '../shared/FallbackStates';
import { User } from 'lucide-react';
import { cn } from '~/lib/utils';

interface TopArtistsProps {
  className?: string;
}

function TopArtistsSkeleton({ className }: { className?: string }) {
  return <SkeletonState count={5} className={className} />;
}

function TopArtistsError({ error, className }: { error: string; className?: string }) {
  return (
    <ErrorState
      error={error}
      title="Unable to load top artists"
      description="There was an error loading your most played artists. Please try again later."
      className={className}
    />
  );
}

function TopArtistsEmpty({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={User}
      title="No artists found"
      description="Start listening to some music to see your top artists here!"
      className={className}
    />
  );
}

export function TopArtists({ className }: TopArtistsProps) {
  const { headers } = useLoaderData<{ headers: Record<string, string> }>();
  const { data: artists, isLoading, error } = usePollData<Artist[]>('artists', {
    schema: artistsSchema,
    headers,
    interval: 120000
  });

  if (isLoading) {
    return <TopArtistsSkeleton className={className} />;
  }

  if (error) {
    return <TopArtistsError error={error.message} className={className} />;
  }

  if (!artists || artists.length === 0) {
    return <TopArtistsEmpty className={className} />;
  }

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <ul className="space-y-4">
        {artists.slice(0, 5).map((artist, index) => (
          <li key={artist.ratingKey} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
            <UniversalArtistCard
              showPlays
              isTopThree={index + 1 <= 3}
              showRank
              rank={index + 1}
              artist={artist}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

// Export individual states for testing
export { TopArtistsSkeleton, TopArtistsError, TopArtistsEmpty };
