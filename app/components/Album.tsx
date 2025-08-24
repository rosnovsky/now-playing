import { cn } from "~/lib/utils"
import { Badge } from "~/components/ui/badge"
import { Disc3, Calendar } from "lucide-react"
import { Album } from "~/types"

interface UniversalAlbumCardProps {
  album: Album
  variant?: "default" | "compact"
  showRank?: boolean
  rank?: number
  showPlays?: boolean
  isTopThree?: boolean
  className?: string
}

export function UniversalAlbumCard({
  album,
  variant = "default",
  rank = 0,
  showRank = false,
  showPlays = false,
  isTopThree = false,
  className,
}: UniversalAlbumCardProps) {
  const isCompact = variant === "compact"

  return (
    <div
      className={cn(
        "group flex items-center gap-4 p-4 rounded-xl transition-all duration-300",
        isTopThree
          ? "bg-gradient-to-r from-amber-500/10 via-music-card-bg to-music-card-bg/80 hover:from-amber-500/20 hover:via-music-card-hover hover:to-music-card-hover/80 border-amber-500/30 hover:border-amber-500/50"
          : "bg-gradient-to-r from-music-card-bg to-music-card-bg/80 hover:from-music-card-hover hover:to-music-card-hover/80 border-border/30 hover:border-primary/40",
        "backdrop-blur-sm hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02]",
        "min-h-[80px]",
        isCompact && "p-3 gap-3 min-h-[64px]",
        className,
      )}
    >
      {/* Rank Number with enhanced styling */}
      {showRank && rank && (
        <div className="flex-shrink-0 w-8 text-right">
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-xs border-primary/30",
              isTopThree ? "bg-amber-500/20 border-amber-500/50 text-amber-200" : "bg-muted/50",
            )}
          >
            #{rank.toString().padStart(2, "0")}
          </Badge>
        </div>
      )}

      {/* Album Cover with enhanced styling */}
      <div
        className={cn(
          "relative flex-shrink-0 rounded-lg overflow-hidden ring-2 transition-all duration-300",
          isTopThree ? "ring-amber-500/40 group-hover:ring-amber-500/60" : "ring-border/30 group-hover:ring-primary/40",
          isCompact ? "w-12 h-12" : "w-14 h-14",
        )}
      >
        <img
          src={album.art || "/placeholder.svg"}
          alt={`${album.title} cover`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Album icon overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Disc3 className="w-4 h-4 text-white animate-spin-slow" />
        </div>
      </div>

      {/* Album Info with enhanced typography */}
      <div className="flex-1 min-w-0 space-y-1">
        <h3
          className={cn(
            "font-sans font-bold text-foreground truncate leading-tight",
            isCompact ? "text-sm" : "text-base",
          )}
        >
          {album.title}
        </h3>
        <p className={cn("text-muted-foreground truncate font-medium", isCompact ? "text-xs" : "text-sm")}>
          {album.parentTitle}
        </p>
        {album.year && !isCompact && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-muted-foreground/70" />
            <span className="text-xs text-muted-foreground/70 font-mono">{album.year}</span>
          </div>
        )}
      </div>

      {/* Enhanced Play Count */}
      {showPlays && album.viewCount && (
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center gap-1">
            <Disc3 className="w-3 h-3 text-primary/70" />
            <span className="text-sm font-mono text-primary font-semibold">{album.viewCount}</span>
          </div>
          <span className="text-xs text-muted-foreground/70 font-mono">plays</span>
        </div>
      )}
    </div>
  )
}
