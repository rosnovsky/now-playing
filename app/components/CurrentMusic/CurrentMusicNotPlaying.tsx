import { Card } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Music, Pause } from "lucide-react"

export function CurrentMusicNotPlaying() {
  return (
    <Card className="bg-gradient-to-r from-music-card-bg to-music-card-hover border-primary/20 p-6">
      <div className="flex items-center gap-6">
        {/* Placeholder Album Art */}
        <div className="relative group">
          <div className="w-20 h-20 rounded-lg bg-muted/20 shadow-lg ring-2 ring-primary/30 flex items-center justify-center">
            <Music className="w-8 h-8 text-muted-foreground/50" />
          </div>
        </div>

        {/* Status Info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-muted/20 text-muted-foreground font-mono text-xs">
              ...quiet in here...
            </Badge>
            <div className="flex items-center gap-1">
              <Pause className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-mono">No activity</span>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-sans font-bold text-muted-foreground leading-tight mb-3">Nothing playing</h3>

            <p className="text-sm text-muted-foreground/50 font-mono">Check the stats below or come back later to see what I&apos;m listening to LIVE!</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
