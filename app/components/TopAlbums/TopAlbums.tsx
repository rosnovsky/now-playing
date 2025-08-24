import React from 'react';
import { useLoaderData } from "@remix-run/react";
import { usePollData } from "~/hooks/usePollingData";
import { albumsSchema, type Album } from "~/types";
import { UniversalAlbumCard } from "../UniversalAlbumCard";
import { ErrorState, EmptyState, SkeletonState } from '../shared/FallbackStates';
import { Disc3 } from 'lucide-react';
import { cn } from '~/lib/utils';

interface TopAlbumsProps {
  className?: string;
}

function TopAlbumsSkeleton({ className }: { className?: string }) {
  return <SkeletonState count={5} className={className} />;
}

function TopAlbumsError({ error, className }: { error: string; className?: string }) {
  return (
    <ErrorState
      error={error}
      title="Unable to load top albums"
      description="There was an error loading your most played albums. Please try again later."
      className={className}
    />
  );
}

function TopAlbumsEmpty({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={Disc3}
      title="No albums found"
      description="Start listening to some albums to see your top albums here!"
      className={className}
    />
  );
}

export function TopAlbums({ className }: TopAlbumsProps) {
  const { headers } = useLoaderData<{ headers: Record<string, string> }>();
  const { data: albums, isLoading, error } = usePollData<Album[]>('albums', {
    schema: albumsSchema,
    headers,
    interval: 120000
  });

  if (isLoading) {
    return <TopAlbumsSkeleton className={className} />;
  }

  if (error) {
    return <TopAlbumsError error={error.message} className={className} />;
  }

  if (!albums || albums.length === 0) {
    return <TopAlbumsEmpty className={className} />;
  }

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <ul className="space-y-4">
        {albums.slice(0, 5).map((album, index) => (
          <li key={album.ratingKey} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
            <UniversalAlbumCard
              isTopThree={index + 1 <= 3}
              showPlays
              showRank
              rank={index + 1}
              album={album}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

// Export individual states for testing
export { TopAlbumsSkeleton, TopAlbumsError, TopAlbumsEmpty };
