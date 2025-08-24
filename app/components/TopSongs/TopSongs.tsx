import React from 'react';
import { useLoaderData } from '@remix-run/react';
import { usePollData } from '~/hooks/usePollingData';
import { songsSchema, type Song } from "~/types";
import { UniversalTrackCard } from '../UniversalTrackCard';
import { ErrorState, EmptyState, SkeletonState } from '../shared/FallbackStates';
import { Music } from 'lucide-react';
import { cn } from '~/lib/utils';

interface TopSongsProps {
  className?: string;
}

function TopSongsSkeleton({ className }: { className?: string }) {
  return <SkeletonState count={5} className={className} />;
}

function TopSongsError({ error, className }: { error: string; className?: string }) {
  return (
    <ErrorState
      error={error}
      title="Unable to load top songs"
      description="There was an error loading your most played songs. Please try again later."
      className={className}
    />
  );
}

function TopSongsEmpty({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={Music}
      title="No songs found"
      description="Start listening to some music to see your top songs here!"
      className={className}
    />
  );
}

export function TopSongs({ className }: TopSongsProps) {
  const { headers } = useLoaderData<{ headers: Record<string, string> }>();
  const { data: songs, isLoading, error } = usePollData<Song[]>('songs?sort=viewCount%3Adesc&limit=10', {
    schema: songsSchema,
    headers,
  });

  if (isLoading) {
    return <TopSongsSkeleton className={className} />;
  }

  if (error) {
    return <TopSongsError error={error.message} className={className} />;
  }

  if (!songs || songs.length === 0) {
    return <TopSongsEmpty className={className} />;
  }

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <ul className="space-y-4">
        {songs.slice(0, 5).map((song, index) => (
          <li key={song.ratingKey} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
            <UniversalTrackCard
              isTopThree={index + 1 <= 3}
              showPlays
              showRank
              rank={index + 1}
              track={song}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

// Export individual states for testing
export { TopSongsSkeleton, TopSongsError, TopSongsEmpty };
