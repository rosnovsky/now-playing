import { useFetcher } from '@remix-run/react';
import { useEffect, useState } from 'react';
import type { CurrentMusic } from '~/routes/api.currentMusic';
import { useStore } from '~/store';

export const CurrentMusicComponent: React.FC = () => {
  const fetcher = useFetcher<CurrentMusic>();
  const [progress, setProgress] = useState(0);
  const data = useStore();

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetcher.load('/api/currentMusic');
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetcher]);

  useEffect(() => {
    if (fetcher.data && fetcher.data.isPlaying) {
      const intervalId = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = (fetcher.data!.currentTime / fetcher.data!.duration) * 100;
          data.setData('songs', [fetcher.data!]);
          return newProgress > 100 ? 0 : newProgress;
        });
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [fetcher.data, data]);

  if (!fetcher.data || !fetcher.data.isPlaying) {
    return <div className="text-gray-400">Nothing playing right now</div>;
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-green-400 mb-2">Now Playing</h2>
      <div className="flex items-center">
        <img src={fetcher.data.albumArt} alt={`${fetcher.data.album} cover`} className="w-16 h-16 object-cover rounded-md mr-4" />
        <div>
          <h3 className="text-lg font-semibold text-white">{fetcher.data.title}</h3>
          <p className="text-gray-400">{fetcher.data.artist}</p>
          <p className="text-gray-500 text-sm">{fetcher.data.album}</p>
        </div>
      </div>
      <div className="mt-2">
        <div className="bg-gray-700 rounded-full h-2 mt-2">
          <div
            className="bg-green-500 h-2 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
