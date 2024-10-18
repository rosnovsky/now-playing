import { isRouteErrorResponse, useLoaderData, useRouteError } from '@remix-run/react';
import { AlertCircle, Music, Pause, Play, RefreshCcw } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { usePollData } from '~/hooks/usePollingData';
import { useStore } from '~/store';
import { currentMusicSchema, type CurrentMusic } from '~/types';
import { SongComponent } from './Song';

export const CurrentMusicComponent: React.FC = () => {
  const { headers, initialCurrentMusic } = useLoaderData<{ headers: Record<string, string>, initialCurrentMusic: CurrentMusic | null }>();
  const { data: currentMusic, isLoading, error } = usePollData<CurrentMusic | null>('currentMusic', {
    schema: currentMusicSchema,
    headers,
    initialData: initialCurrentMusic,
    interval: 30000
  });
  const { setCurrentMusic } = useStore();
  const [progress, setProgress] = useState(0);
  const [smoothProgress, setSmoothProgress] = useState(0);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (currentMusic) {
      console.log(currentMusic)
      setCurrentMusic(currentMusic);
    }
  }, [currentMusic, setCurrentMusic]);

  useEffect(() => {
    if (currentMusic?.isPlaying && currentMusic.duration && currentMusic.currentTime) {
      const currentProgress = (currentMusic.currentTime / currentMusic.duration) * 100;
      setProgress(currentProgress);
      setSmoothProgress(currentProgress);
      lastUpdateTimeRef.current = Date.now();

      const updateSmoothProgress = () => {
        const now = Date.now();
        const timePassed = (now - lastUpdateTimeRef.current) / 1000;
        const newProgress = ((currentMusic.currentTime + timePassed) / currentMusic.duration) * 100;

        if (newProgress <= 100) {
          setSmoothProgress(newProgress);
          animationFrameRef.current = requestAnimationFrame(updateSmoothProgress);
        } else {
          setSmoothProgress(100);
        }
      };

      animationFrameRef.current = requestAnimationFrame(updateSmoothProgress);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      setProgress(0);
      setSmoothProgress(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [currentMusic]);

  if (isLoading) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg animate-pulse">
        <h2 className="h-6 flex items-center mb-3">
          <Pause className="w-5 h-5 mr-2" />
          <div className="h-7 bg-gray-600 rounded w-36"></div>
        </h2>
        <div className="flex items-center mt-3">
          <div className="w-16 h-16 bg-gray-700 rounded-md mr-4"></div>
          <div className="flex-grow">
            <div className="h-6 bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
        <div className="mt-3">
          <div className="bg-gray-700 rounded-full h-2 mt-2"></div>
          <div className="flex justify-between mt-1">
            <div className="h-3 bg-gray-700 rounded w-10"></div>
            <div className="h-3 bg-gray-700 rounded w-10"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    console.error(error)
    return (
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-red-400 mb-3 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Shit!..
        </h2>
        <div className="flex items-center mt-3">
          <div className="w-16 h-16 bg-gray-700 rounded-md mr-4 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <div className="flex-grow">
            <p className="text-white mb-2">Well, something is clearly broken.</p>
            <p className="text-gray-400 text-sm">I mean, it worked on my machine, you know? ;)</p>
          </div>
        </div>
        <div className="mt-4">
          <button

            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            How about now?
          </button>
        </div>
      </div>
    )
  }

  if (!currentMusic || !currentMusic.isPlaying) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center">
        <Music className="w-8 h-8 text-gray-400 mr-3" />
        <div className="text-gray-400">Nothing playing right now</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-green-400 mb-2 flex items-center">
        {currentMusic.isPlaying ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
        Now Playing
      </h2>
      {currentMusic ? <SongComponent song={currentMusic} /> : "Loading..."}
      <div className="mt-2">
        <div className="bg-gray-700 rounded-full h-2 mt-2 overflow-hidden">
          <div
            className="bg-green-500 h-full rounded-full transition-none"
            style={{
              width: `${smoothProgress}%`,
              transition: `width ${currentMusic?.isPlaying ? '15s' : '0s'} linear`
            }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{formatTime((currentMusic?.duration ?? 0) * (smoothProgress / 100))}</span>
          <span>{formatTime(currentMusic?.duration ?? 0)}</span>
        </div>
      </div>
    </div>
  );
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60 / 1000);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export function ErrorBoundary() {
  const error = useRouteError();
  console.log(error)

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        ERROR!
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <div>
          ERROR!
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      </div>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
}
