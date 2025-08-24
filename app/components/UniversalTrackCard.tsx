import React from 'react';
import { type CurrentMusic, type Song } from '~/types';
import { Music } from "lucide-react"
import { cn } from '~/lib/utils';
import { Badge } from './ui/badge';
import { getTimeAgo } from '~/utils/helpers';

const isCurrentMusic = (song: Song): boolean => {
  return (song as CurrentMusic).isPlaying !== undefined;
};

type Track = Song & Partial<CurrentMusic>;

interface UniversalTrackCardProps {
  track: Track
  variant?: "default" | "compact" | "now-playing"
  showRank?: boolean
  rank?: number
  showPlays?: boolean
  isTopThree?: boolean
  className?: string
  style?: React.CSSProperties
}

export function UniversalTrackCard({
  track,
  variant = "default",
  showRank = false,
  rank = 0,
  showPlays = false,
  isTopThree = false,
  className,
  style,
}: UniversalTrackCardProps) {
  const isCompact = variant === "compact"
  const isNowPlaying = variant === "now-playing"

  const albumArt = isCurrentMusic(track) ? track.albumArt : track.thumb;
  return (
    <div
      className={cn(
        "group relative w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300",
        isTopThree
          ? "bg-linear-to-r from-amber-500/10 via-music-card-bg to-music-card-bg/80 hover:from-amber-500/20 hover:via-music-card-hover hover:to-music-card-hover/80 border-amber-500/30 hover:border-amber-500/50"
          : "bg-linear-to-r from-music-card-bg to-music-card-bg/80 hover:from-music-card-hover hover:to-music-card-hover/80 border-border/30 hover:border-primary/40",
        "backdrop-blur-xs hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02]",
        isNowPlaying && "bg-linear-to-r from-primary/10 to-primary/5 border-primary/50 shadow-lg shadow-primary/20",
        isCompact && "p-3 gap-3",
        className,
      )}
      style={style}
    >
      {/* Rank Number - LEFT SIDE */}
      {showRank && rank && (
        <div className="shrink-0 w-8">
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
      {/* Album Art with enhanced styling */}
      <div
        className={cn(
          "relative shrink-0 rounded-lg overflow-hidden ring-2 transition-all duration-300",
          isTopThree ? "ring-amber-500/40 group-hover:ring-amber-500/60" : "ring-border/30 group-hover:ring-primary/40",
          isCompact ? "w-12 h-12" : "w-14 h-14",
          isNowPlaying && "w-16 h-16 ring-primary/50",
        )}
      >
        <img
          src={albumArt}
          alt={`${track.grandparentThumb} cover`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Audio visualizer for playing tracks */}
        {isCurrentMusic(track) && (
          <div className="absolute bottom-1 left-1 flex items-end gap-0.5">
            <div className="w-0.5 h-2 bg-primary rounded-full animate-pulse" />
            <div className="w-0.5 h-3 bg-primary/80 rounded-full animate-pulse delay-100" />
            <div className="w-0.5 h-1.5 bg-primary/60 rounded-full animate-pulse delay-200" />
          </div>
        )}
      </div>

      {/* Track Info with enhanced typography */}
      <div className="flex-1 min-w-0 space-y-1">
        <h3
          className={cn(
            "font-sans font-bold text-foreground truncate leading-tight",
            isCompact ? "text-sm" : "text-base",
            isNowPlaying && "text-lg",
          )}
        >
          {track.title}
        </h3>
        <p className={cn("text-muted-foreground truncate font-medium", isCompact ? "text-xs" : "text-sm")}>
          {track.grandparentTitle}
        </p>
        {!isCompact && <p className="text-xs text-muted-foreground/70 truncate font-mono">{track.parentTitle}</p>}
      </div>

      {/* Enhanced Play Count - RIGHT SIDE */}
      {showPlays && track.viewCount && (
        <div className="shrink-0 text-right">
          <div className="flex items-center gap-1">
            <Music className="w-3 h-3 text-primary/70" />
            <span className="text-sm font-mono text-primary font-semibold">{track.viewCount}</span>
          </div>
          <span className="text-xs text-muted-foreground/70 font-mono">plays</span>
        </div>
      )}

      {/* Last Played Time */}
      {isCurrentMusic(track) && <div className="absolute -left-35 shrink-0 w-8 text-right">
        <Badge
          variant="outline"
          className={cn(
            "font-mono text-xs border-primary/30",
            isTopThree ? "bg-amber-500/20 border-amber-500/50 text-amber-200" : "bg-muted/50",
          )}
        >
          {getTimeAgo(track.lastViewedAt!)}
        </Badge>
      </div>}

      {/* Duration for Now Playing */}
      {isNowPlaying && track.duration && (
        <div className="shrink-0 text-right">
          <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded-sm">
            {track.duration}
          </span>
        </div>
      )}
    </div>
  )
}
