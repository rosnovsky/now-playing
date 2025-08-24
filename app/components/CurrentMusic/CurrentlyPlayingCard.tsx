import { Clock, AlertCircle, Music, Loader2 } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { isRouteErrorResponse, useLoaderData, useRouteError } from "@remix-run/react";
import { useEffect } from "react";
import { usePollData } from "~/hooks/usePollingData";
import { useStore } from "~/store";
import { CurrentMusicResponse, currentMusicResponseSchema } from "~/types";
import { getTimeAgo } from "~/utils/helpers";
import { cn } from "~/lib/utils";

interface CurrentlyPlayingCardProps {
  className?: string;
}

function CurrentMusicSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("bg-gradient-to-r from-music-card-bg to-music-card-hover border-primary/20 p-6", className)}>
      <div className="flex items-center gap-6 animate-pulse">
        {/* Album Art Skeleton */}
        <div className="w-20 h-20 bg-gray-700 rounded-lg"></div>

        {/* Track Info Skeleton */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-20 bg-gray-700 rounded"></div>
            <div className="h-4 w-16 bg-gray-700 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="h-3 bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CurrentMusicError({ className }: { className?: string }) {
  return (
    <Card className={cn("bg-gradient-to-r from-red-900/20 to-red-800/20 border-red-900/50 p-6", className)}>
      <div className="flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h3 className="text-lg font-semibold text-red-400">Unable to load current music</h3>
          <p className="text-sm text-red-300/80">
            There was an error loading your current music status. Please try again later.
          </p>
        </div>
      </div>
    </Card>
  );
}

function CurrentMusicNotPlaying({ className }: { className?: string }) {
  return (
    <Card className={cn("bg-gradient-to-r from-muted/20 to-muted/10 border-muted/50 p-6", className)}>
      <div className="flex items-center justify-center">
        <div className="text-center space-y-3">
          <Music className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold text-muted-foreground">Nothing playing right now</h3>
          <p className="text-sm text-muted-foreground/80">
            Start playing some music to see it here!
          </p>
        </div>
      </div>
    </Card>
  );
}

function CurrentMusicLoading({ className }: { className?: string }) {
  return (
    <Card className={cn("bg-gradient-to-r from-music-card-bg to-music-card-hover border-primary/20 p-6", className)}>
      <div className="flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading current music...</p>
        </div>
      </div>
    </Card>
  );
}

export function CurrentlyPlayingCard({ className }: CurrentlyPlayingCardProps) {
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
    return <CurrentMusicLoading className={className} />;
  }

  if (error) {
    return <CurrentMusicError className={className} />;
  }

  if (!currentMusic || !currentMusic.isPlaying) {
    return <CurrentMusicNotPlaying className={className} />;
  }

  return (
    <Card className={cn("bg-gradient-to-r from-music-card-bg to-music-card-hover border-primary/20 p-6", className)}>
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
              <span className="text-xs text-muted-foreground font-mono">
                {getTimeAgo(currentMusic.lastViewedAt)}
              </span>
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
}

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

// Export individual states for testing
export { CurrentMusicSkeleton, CurrentMusicError, CurrentMusicNotPlaying, CurrentMusicLoading };
