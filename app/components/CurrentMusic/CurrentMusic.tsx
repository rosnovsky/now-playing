import { isRouteErrorResponse, useLoaderData, useRouteError } from "@remix-run/react";
import { Pause, Play } from "lucide-react";
import { useEffect } from "react";
import { CurrentMusicError, CurrentMusicNotPlaying, CurrentMusicSkeleton } from "~/components/CurrentMusic/";
import { SongComponent } from "~/components/Song";
import { usePollData } from "~/hooks/usePollingData";
import { useStore } from "~/store";
import { CurrentMusicResponse, currentMusicResponseSchema } from "~/types";

export const CurrentMusicComponent: React.FC = () => {
  const { headers, initialCurrentMusic } = useLoaderData<{ headers: Record<string, string>; initialCurrentMusic: CurrentMusicResponse | null }>();
  const { data: currentMusicResponse, isLoading, error } = usePollData<CurrentMusicResponse | null>('currentMusic', {
    schema: currentMusicResponseSchema,
    headers,
    initialData: initialCurrentMusic,
    interval: 30000
  });
  const { currentMusic, setCurrentMusic } = useStore();


  useEffect(() => {
    if (currentMusicResponse) {
      setCurrentMusic(currentMusicResponse.currentMusic);
    }
  }, [currentMusicResponse, setCurrentMusic]);

  if (isLoading) {
    return <CurrentMusicSkeleton />;
  }

  if (error) {
    return <CurrentMusicError />;
  }

  if (!currentMusic || !currentMusic.isPlaying) {
    return (
      <CurrentMusicNotPlaying />
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-green-400 mb-2 flex items-center">
        {currentMusic.isPlaying ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
        Now Playing
      </h2>
      <SongComponent song={currentMusic} />
    </div>
  );
};

export function ErrorBoundary() {
  const error = useRouteError();

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
