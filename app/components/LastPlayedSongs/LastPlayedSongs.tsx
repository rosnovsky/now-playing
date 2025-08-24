import React from 'react';
import { useLoaderData } from '@remix-run/react';
import { usePollData } from '~/hooks/usePollingData';
import { songsSchema, type Song } from "~/types";
import { UniversalTrackCard } from '../UniversalTrackCard';
import { ErrorState, EmptyState, SkeletonState } from '../shared/FallbackStates';
import { Music } from 'lucide-react';
import { cn } from '~/lib/utils';

interface LastPlayedSongsProps {
  className?: string;
}

function LastPlayedSongsSkeleton({ className }: { className?: string }) {
  return <SkeletonState count={50} variant="grid" className={className} />;
}

function LastPlayedSongsError({ error, className }: { error: string; className?: string }) {
  return (
    <ErrorState
      error={error}
      title="Unable to load recently played songs"
      description="There was an error loading your recently played songs. Please try again later."
      className={className}
    />
  );
}

function LastPlayedSongsEmpty({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={Music}
      title="No recently played songs"
      description="Start listening to some music to see your recently played songs here!"
      className={className}
    />
  );
}

export function LastPlayedSongs({ className }: LastPlayedSongsProps) {
  const { headers } = useLoaderData<{ headers: Record<string, string> }>();
  const { data: songs, isLoading, error } = usePollData<Song[]>('songs?sort=lastViewedAt:desc&limit=50', {
    schema: songsSchema,
    headers,
    interval: 60000
  });

  if (isLoading) {
    return <LastPlayedSongsSkeleton className={className} />;
  }

  if (error) {
    return <LastPlayedSongsError error={error.message} className={className} />;
  }

  if (!songs || songs.length === 0) {
    return <LastPlayedSongsEmpty className={className} />;
  }

  const sortedSongs = [...songs]
    .sort((a, b) => (b.lastViewedAt || 0) - (a.lastViewedAt || 0))
    .slice(0, 50);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4 scrollbar-hide justify-between">
        {sortedSongs.map((track) => (
          <UniversalTrackCard
            key={track.ratingKey}
            showRank={false}
            track={track}
            variant="default"
            className="flex-shrink-0 max-w-100 transition-opacity duration-300"
          />
        ))}
      </div>
    </div>
  );
}

// Export individual states for testing
export { LastPlayedSongsSkeleton, LastPlayedSongsError, LastPlayedSongsEmpty };
