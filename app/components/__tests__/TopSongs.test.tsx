import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TopSongsSkeleton, TopSongsError, TopSongsEmpty } from '../TopSongs';

describe('TopSongs Component States', () => {
  it('renders skeleton state correctly', () => {
    render(<TopSongsSkeleton />);
    // Check for basic skeleton structure
    const listElement = screen.getByRole('list');
    expect(listElement).toBeInTheDocument();

    // Should render 5 skeleton items for top songs
    const skeletonItems = screen.getAllByRole('listitem');
    expect(skeletonItems).toHaveLength(5);
  });

  it('renders error state with message', () => {
    const errorMessage = 'Failed to load songs';
    render(<TopSongsError error={errorMessage} />);

    expect(screen.getByText('Unable to load top songs')).toBeInTheDocument();
    expect(screen.getByText('There was an error loading your most played songs. Please try again later.')).toBeInTheDocument();
  });

  it('renders empty state correctly', () => {
    render(<TopSongsEmpty />);

    expect(screen.getByText('No songs found')).toBeInTheDocument();
    expect(screen.getByText('Start listening to some music to see your top songs here!')).toBeInTheDocument();
  });

  it('applies className prop to skeleton state', () => {
    const { container } = render(<TopSongsSkeleton className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('applies className prop to error state', () => {
    const { container } = render(<TopSongsError error="test error" className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('applies className prop to empty state', () => {
    const { container } = render(<TopSongsEmpty className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('skeleton shows proper loading animation', () => {
    render(<TopSongsSkeleton />);

    // Check that skeleton elements have the animate-pulse class
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('error state shows proper error icon', () => {
    render(<TopSongsError error="test error" />);

    // The error icon should be present
    const errorIcon = document.querySelector('svg');
    expect(errorIcon).toBeInTheDocument();
  });

  it('empty state shows proper empty icon', () => {
    render(<TopSongsEmpty />);

    // The music icon should be present
    const musicIcon = document.querySelector('svg');
    expect(musicIcon).toBeInTheDocument();
  });
});
