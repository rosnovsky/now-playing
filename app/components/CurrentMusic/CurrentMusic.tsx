import { Card } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Clock } from "lucide-react"

import { isRouteErrorResponse, useLoaderData, useRouteError } from "@remix-run/react";
import { useEffect } from "react";
import { CurrentMusicError, CurrentMusicNotPlaying, CurrentMusicSkeleton } from "~/components/CurrentMusic/";
import { usePollData } from "~/hooks/usePollingData";
import { useStore } from "~/store";
import { CurrentMusicResponse, currentMusicResponseSchema } from "~/types";

export const CurrentlyPlayingCard: React.FC = () => {
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
    <Card className="bg-gradient-to-r from-music-card-bg to-music-card-hover border-primary/20 p-6">
      <div className="flex items-center gap-6">
        {/* Album Art */}
        <div className="relative group">
          <img
            src={currentMusic.albumArt || "/placeholder.svg"}
            alt={`${currentMusic.parentTitle} cover`}
            className="w-20 h-20 rounded-lg object-cover shadow-lg ring-2 ring-primary/30"
          />
        </div>

        {/* Track Info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/20 text-primary font-mono text-xs">
              LAST PLAYED
            </Badge>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-mono">{currentMusic.duration}</span>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-sans font-bold text-foreground leading-tight">{currentMusic.title}</h3>
            <p className="text-muted-foreground font-sans font-medium">{currentMusic.grandparentTitle}</p>
            <p className="text-sm text-muted-foreground/70 font-mono">{currentMusic.parentTitle}</p>
          </div>
        </div>
      </div>
    </Card>
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
