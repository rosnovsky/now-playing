import { Clock } from "lucide-react"
import { Card } from "~/components/ui/card"

export const CurrentMusicSkeleton = () => {
  return (
    <Card className="bg-gradient-to-r from-music-card-bg to-music-card-hover border-primary/20 p-6 animate-pulse">
      <div className="flex items-center gap-6">
        {/* Album Art Skeleton */}
        <div className="relative">
          <div className="w-20 h-20 bg-muted/30 rounded-lg shadow-lg ring-2 ring-primary/30"></div>
        </div>

        {/* Track Info Skeleton */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 rounded-full px-2 py-1 flex items-center gap-1">
              <div className="h-3 bg-primary/40 rounded w-16"></div>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <div className="h-3 bg-muted/40 rounded w-12"></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-6 bg-muted/50 rounded w-3/4"></div>
            <div className="h-4 bg-muted/40 rounded w-1/2"></div>
            <div className="h-3 bg-muted/30 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    </Card>
  )
}
