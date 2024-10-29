import { useLoaderData } from '@remix-run/react';
import { AlertCircle, Braces, Music } from 'lucide-react';
import useMoodStatement from '~/hooks/useGenerateMood';
import { usePollData } from '~/hooks/usePollingData';
import { Song, songsSchema } from '~/types';

export const MoodComponent = () => {
  const { headers, initialSongs } = useLoaderData<{ headers: Record<string, string>, initialSongs: Song[] }>();
  const { data: songs, isLoading, error } = usePollData<Song[]>('songs?sort=lastViewedAt:desc&limit=50', {
    schema: songsSchema,
    headers,
    initialData: initialSongs,
    interval: 9000000
  });

  const { moodStatement, loading: moodLoading, error: moodError } = useMoodStatement(songs);

  if (moodLoading || isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 animate-pulse">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mr-3">
            <Braces className="w-6 h-6 text-gray-600" />
          </div>
          <div className="flex-grow">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (moodError || error) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-red-900/20 rounded-full flex items-center justify-center mr-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-red-400">Failed to analyze mood</p>
            <p className="text-sm text-gray-400">Try again later</p>
          </div>
        </div>
      </div>
    );
  }

  if (!songs?.length) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mr-3">
            <Music className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <p className="text-gray-400">No recent songs</p>
            <p className="text-sm text-gray-500">Wait till I play some music to see the mood</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-start">
        <div>
          <p className="text-green-400 font-medium mb-1">Current Mood</p>
          <p className="text-gray-600 text-xs mb-1">Based on the recent listening history, by <a href="https://claude.ai" target="_blank" rel="noreferrer">Claude</a> LLM</p>
          <blockquote className="text-sm text-gray-300 italic">&ldquo;{moodStatement}&rdquo;</blockquote>
        </div>
      </div>
    </div>
  );
};
