import { useLoaderData } from '@remix-run/react';
import { Music, Pause, Play } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { usePollData } from '~/hooks/usePollingData';
import { ErrorBoundary } from '~/root';
import { useStore } from '~/store';
import { currentMusicSchema, type CurrentMusic } from '~/types';

export const CurrentMusicComponent: React.FC = () => {
  const { headers, initialCurrentMusic } = useLoaderData<{ headers: Record<string, string>, initialCurrentMusic: CurrentMusic | null }>();
  const { data: currentMusic, isLoading, error } = usePollData<CurrentMusic | null>('currentMusic', {
    schema: currentMusicSchema,
    headers,
    initialData: initialCurrentMusic,
    interval: 30000
  });
  const storeData = useStore();
  const [progress, setProgress] = useState(0);
  const [smoothProgress, setSmoothProgress] = useState(0);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (currentMusic && currentMusic.isPlaying) {
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
  }, [currentMusic, storeData]);

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
    return <ErrorBoundary />;
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
      <div className="flex items-center">
        <img src={currentMusic.albumArt} alt={`${currentMusic.album} cover`} className="w-16 h-16 object-cover rounded-md mr-4" />
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-white truncate">{currentMusic.title}</h3>
          <p className="text-gray-400 truncate">{currentMusic.artist}</p>
          <p className="text-gray-500 text-sm truncate">{currentMusic.album}</p>
        </div>
      </div>
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
