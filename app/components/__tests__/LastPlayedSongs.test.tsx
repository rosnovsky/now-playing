import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LastPlayedSongsSkeleton, LastPlayedSongsError, LastPlayedSongsEmpty } from '../LastPlayedSongs';

describe('LastPlayedSongs Component States', () => {
  it('renders skeleton state correctly', () => {
    render(<LastPlayedSongsSkeleton />);
    // Check for basic skeleton structure in grid layout
    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();

    // Should render 50 skeleton items for last played songs
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBe(50);
  });

  it('renders error state with message', () => {
    const errorMessage = 'Failed to load recently played songs';
    render(<LastPlayedSongsError error={errorMessage} />);

    expect(screen.getByText('Unable to load recently played songs')).toBeInTheDocument();
    expect(screen.getByText('There was an error loading your recently played songs. Please try again later.')).toBeInTheDocument();
  });

  it('renders empty state correctly', () => {
    render(<LastPlayedSongsEmpty />);

    expect(screen.getByText('No recently played songs')).toBeInTheDocument();
    expect(screen.getByText('Start listening to some music to see your recently played songs here!')).toBeInTheDocument();
  });

  it('applies className prop to skeleton state', () => {
    const { container } = render(<LastPlayedSongsSkeleton className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('applies className prop to error state', () => {
    const { container } = render(<LastPlayedSongsError error="test error" className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('applies className prop to empty state', () => {
    const { container } = render(<LastPlayedSongsEmpty className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('skeleton shows proper grid layout', () => {
    render(<LastPlayedSongsSkeleton />);

    // Check that grid layout classes are applied
    const gridContainer = document.querySelector('.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-3');
    expect(gridContainer).toBeInTheDocument();
  });

  it('skeleton shows proper loading animation', () => {
    render(<LastPlayedSongsSkeleton />);

    // Check that skeleton elements have the animate-pulse class
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('error state shows proper error icon', () => {
    render(<LastPlayedSongsError error="test error" />);

    // The error icon should be present
    const errorIcon = document.querySelector('svg');
    expect(errorIcon).toBeInTheDocument();
  });

  it('empty state shows proper empty icon', () => {
    render(<LastPlayedSongsEmpty />);

    // The music icon should be present
    const musicIcon = document.querySelector('svg');
    expect(musicIcon).toBeInTheDocument();
  });

  it('skeleton renders proper number of items in grid', () => {
    render(<LastPlayedSongsSkeleton />);

    // Should have exactly 50 skeleton items for recently played songs
    const skeletonCards = document.querySelectorAll('.bg-gray-800\\/50');
    expect(skeletonCards.length).toBe(50);
  });
});
