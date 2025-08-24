import { Card } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { AlertCircle, RefreshCcw } from "lucide-react"

interface CurrentMusicErrorProps {
  onRetry?: () => void
  error?: string
}

export function CurrentMusicError({ onRetry, error = "Connection failed" }: CurrentMusicErrorProps) {
  return (
    <Card className="bg-gradient-to-r from-music-card-bg to-music-card-hover border-destructive/20 p-6">
      <div className="flex items-center gap-6">
        {/* Error Icon */}
        <div className="relative group">
          <div className="w-20 h-20 rounded-lg bg-destructive/10 shadow-lg ring-2 ring-destructive/30 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
        </div>

        {/* Error Info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="bg-destructive/20 text-destructive font-mono text-xs">
              ERROR
            </Badge>
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-destructive" />
              <span className="text-xs text-destructive font-mono">Connection issue</span>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-sans font-bold text-destructive leading-tight">Unable to connect</h3>
            <p className="text-muted-foreground font-sans font-medium">Failed to reach Plex server</p>
            <p className="text-sm text-muted-foreground/70 font-mono">{error}</p>
          </div>

          {onRetry && (
            <div className="pt-2">
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 font-mono bg-transparent"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Retry connection
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
