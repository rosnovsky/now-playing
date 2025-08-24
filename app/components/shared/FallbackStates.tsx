import React from 'react';
import { AlertCircle, Music, Disc3, User, Loader2 } from 'lucide-react';
import { cn } from '~/lib/utils';

interface FallbackStateProps {
  className?: string;
}

interface ErrorStateProps extends FallbackStateProps {
  error: string;
  title: string;
  description?: string;
}

interface EmptyStateProps extends FallbackStateProps {
  icon: typeof Music | typeof Disc3 | typeof User;
  title: string;
  description: string;
}

interface LoadingStateProps extends FallbackStateProps {
  message: string;
}

interface SkeletonStateProps extends FallbackStateProps {
  count: number;
  variant?: 'track' | 'album' | 'artist' | 'grid';
}

// Generic Error State
export function ErrorState({ error, title, description, className }: ErrorStateProps) {
  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <div className="flex items-center justify-center p-8 bg-red-900/20 border border-red-900/50 rounded-lg">
        <div className="text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h3 className="text-lg font-semibold text-red-400">{title}</h3>
          <p className="text-sm text-red-300/80 max-w-md">
            {description || error || "Something went wrong. Please try again later."}
          </p>
        </div>
      </div>
    </div>
  );
}

// Generic Empty State
export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <div className="flex items-center justify-center p-8 bg-muted/20 border border-muted/50 rounded-lg">
        <div className="text-center space-y-3">
          <Icon className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold text-muted-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground/80 max-w-md">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

// Generic Loading State (fallback for when skeleton is not appropriate)
export function LoadingState({ message, className }: LoadingStateProps) {
  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}

// Generic Skeleton State - all cards render identically
export function SkeletonState({ count, variant = 'track', className }: SkeletonStateProps) {
  if (variant === 'grid') {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
          {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="bg-gray-800/50 rounded-lg overflow-hidden animate-pulse">
              <div className="flex items-center gap-4 p-4">
                {/* Image skeleton */}
                <div className="w-14 h-14 bg-gray-700 rounded-lg"></div>
                {/* Content skeleton */}
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Standard list layout - all card types use identical skeleton
  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <ul className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <li key={index} className="bg-gray-800/50 rounded-lg overflow-hidden animate-pulse">
            <div className="flex items-center gap-4 p-4">
              {/* Rank badge skeleton */}
              <div className="w-8 h-6 bg-gray-700 rounded"></div>
              {/* Image skeleton */}
              <div className="w-14 h-14 bg-gray-700 rounded-lg"></div>
              {/* Content skeleton */}
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
              {/* Stats skeleton */}
              <div className="w-16 space-y-1">
                <div className="h-4 bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-700 rounded"></div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
