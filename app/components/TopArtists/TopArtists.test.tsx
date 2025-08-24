import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TopArtistsSkeleton, TopArtistsError, TopArtistsEmpty } from './TopArtists';

describe('TopArtists Component States', () => {
  it('renders skeleton state correctly', () => {
    render(<TopArtistsSkeleton />);
    // Check for basic skeleton structure
    const listElement = screen.getByRole('list');
    expect(listElement).toBeInTheDocument();

    // Should render 5 skeleton items for top artists
    const skeletonItems = screen.getAllByRole('listitem');
    expect(skeletonItems).toHaveLength(5);
  });

  it('renders error state with message', () => {
    const errorMessage = 'Failed to load artists';
    render(<TopArtistsError error={errorMessage} />);

    expect(screen.getByText('Unable to load top artists')).toBeInTheDocument();
    expect(screen.getByText('There was an error loading your most played artists. Please try again later.')).toBeInTheDocument();
  });

  it('renders empty state correctly', () => {
    render(<TopArtistsEmpty />);

    expect(screen.getByText('No artists found')).toBeInTheDocument();
    expect(screen.getByText('Start listening to some music to see your top artists here!')).toBeInTheDocument();
  });

  it('applies className prop to skeleton state', () => {
    const { container } = render(<TopArtistsSkeleton className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('applies className prop to error state', () => {
    const { container } = render(<TopArtistsError error="test error" className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('applies className prop to empty state', () => {
    const { container } = render(<TopArtistsEmpty className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('skeleton shows proper loading animation', () => {
    render(<TopArtistsSkeleton />);

    // Check that skeleton elements have the animate-pulse class
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('error state shows proper error icon', () => {
    render(<TopArtistsError error="test error" />);

    // The error icon should be present
    const errorIcon = document.querySelector('svg');
    expect(errorIcon).toBeInTheDocument();
  });

  it('empty state shows proper empty icon', () => {
    render(<TopArtistsEmpty />);

    // The user icon should be present
    const userIcon = document.querySelector('svg');
    expect(userIcon).toBeInTheDocument();
  });


});
