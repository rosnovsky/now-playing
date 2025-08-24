import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TopAlbumsSkeleton, TopAlbumsError, TopAlbumsEmpty } from '../TopAlbums';

describe('TopAlbums Component States', () => {
  it('renders skeleton state correctly', () => {
    render(<TopAlbumsSkeleton />);
    // Check for basic skeleton structure
    const listElement = screen.getByRole('list');
    expect(listElement).toBeInTheDocument();

    // Should render 5 skeleton items for top albums
    const skeletonItems = screen.getAllByRole('listitem');
    expect(skeletonItems).toHaveLength(5);
  });

  it('renders error state with message', () => {
    const errorMessage = 'Failed to load albums';
    render(<TopAlbumsError error={errorMessage} />);

    expect(screen.getByText('Unable to load top albums')).toBeInTheDocument();
    expect(screen.getByText('There was an error loading your most played albums. Please try again later.')).toBeInTheDocument();
  });

  it('renders empty state correctly', () => {
    render(<TopAlbumsEmpty />);

    expect(screen.getByText('No albums found')).toBeInTheDocument();
    expect(screen.getByText('Start listening to some albums to see your top albums here!')).toBeInTheDocument();
  });

  it('applies className prop to skeleton state', () => {
    const { container } = render(<TopAlbumsSkeleton className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('applies className prop to error state', () => {
    const { container } = render(<TopAlbumsError error="test error" className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('applies className prop to empty state', () => {
    const { container } = render(<TopAlbumsEmpty className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('skeleton shows proper loading animation', () => {
    render(<TopAlbumsSkeleton />);

    // Check that skeleton elements have the animate-pulse class
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('error state shows proper error icon', () => {
    render(<TopAlbumsError error="test error" />);

    // The error icon should be present
    const errorIcon = document.querySelector('svg');
    expect(errorIcon).toBeInTheDocument();
  });

  it('empty state shows proper empty icon', () => {
    render(<TopAlbumsEmpty />);

    // The disc icon should be present
    const discIcon = document.querySelector('svg');
    expect(discIcon).toBeInTheDocument();
  });
});
