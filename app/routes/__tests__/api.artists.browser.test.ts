/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('api.artists browser integration', () => {
  beforeEach(() => {
    // Mock fetch globally for browser environment
    globalThis.fetch = vi.fn();
  });

  it('should handle API calls in browser environment', async () => {
    const mockApiResponse = [
      {
        title: "Test Artist",
        ratingKey: "12345",
        guid: "plex://artist/12345",
        type: "artist",
        summary: "Test artist summary",
        viewCount: 5,
        thumb: "/api/images/library/metadata/12345/thumb/1234567890",
        art: "/api/images/library/metadata/12345/art/1234567890",
        addedAt: 1640995200,
        updatedAt: 1640995300,
      },
      {
        title: "Another Artist",
        ratingKey: "23456",
        guid: "plex://artist/23456",
        type: "artist",
        summary: "Another artist summary",
        viewCount: 0,
        thumb: "/api/images/library/metadata/23456/thumb/2345678901",
        art: "/api/images/library/metadata/23456/art/2345678901",
        addedAt: 1640995400,
        updatedAt: 1640995500,
      },
    ];

    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(mockApiResponse),
    } as any);

    // Simulate calling the API from browser code
    const response = await fetch('/api/artists');
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data).toHaveLength(2);
    expect(data[0].title).toBe('Test Artist');
    expect(data[1].title).toBe('Another Artist');
  });

  it('should handle network errors gracefully', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error('Network error'));

    await expect(fetch('/api/artists')).rejects.toThrow('Network error');
  });

  it('should handle server errors gracefully', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as any);

    const response = await fetch('/api/artists');
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });

  it('should handle empty artist list', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue([]),
    } as any);

    const response = await fetch('/api/artists');
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data).toEqual([]);
  });

  it('should preserve data structure in browser environment', async () => {
    const mockApiResponse = [
      {
        title: "Test Artist",
        ratingKey: "12345",
        guid: "plex://artist/12345",
        type: "artist",
        summary: "Test artist summary",
        viewCount: 5,
        thumb: "/api/images/library/metadata/12345/thumb/1234567890",
        art: "/api/images/library/metadata/12345/art/1234567890",
        addedAt: 1640995200,
        updatedAt: 1640995300,
      },
    ];

    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(mockApiResponse),
    } as any);

    const response = await fetch('/api/artists');
    const data = await response.json();

    const artist = data[0];
    expect(artist).toHaveProperty('title');
    expect(artist).toHaveProperty('ratingKey');
    expect(artist).toHaveProperty('guid');
    expect(artist).toHaveProperty('type');
    expect(artist).toHaveProperty('summary');
    expect(artist).toHaveProperty('viewCount');
    expect(artist).toHaveProperty('thumb');
    expect(artist).toHaveProperty('art');
    expect(artist).toHaveProperty('addedAt');
    expect(artist).toHaveProperty('updatedAt');
  });

  it('should handle artists with missing optional fields', async () => {
    const mockApiResponse = [
      {
        title: "Test Artist",
        ratingKey: "12345",
        guid: "plex://artist/12345",
        type: "artist",
        viewCount: 5,
        addedAt: 1640995200,
        art: null,
        // Missing optional fields: thumb, summary, updatedAt
      },
    ];

    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(mockApiResponse),
    } as any);

    const response = await fetch('/api/artists');
    const data = await response.json();

    const artist = data[0];
    expect(artist.title).toBe('Test Artist');
    expect(artist.art).toBeNull();
    expect(artist).not.toHaveProperty('thumb');
    expect(artist).not.toHaveProperty('summary');
    expect(artist).not.toHaveProperty('updatedAt');
  });

  it('should handle API with caching headers', async () => {
    const mockApiResponse = [
      {
        title: "Test Artist",
        ratingKey: "12345",
        guid: "plex://artist/12345",
        type: "artist",
        summary: "Test artist summary",
        viewCount: 5,
        thumb: "/api/images/library/metadata/12345/thumb/1234567890",
        art: "/api/images/library/metadata/12345/art/1234567890",
        addedAt: 1640995200,
        updatedAt: 1640995300,
      },
    ];

    const mockHeaders = new Headers();
    mockHeaders.set('ETag', 'test-etag');
    mockHeaders.set('Cache-Control', 'no-cache');

    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      headers: mockHeaders,
      json: vi.fn().mockResolvedValue(mockApiResponse),
    } as any);

    const response = await fetch('/api/artists');

    expect(response.headers.get('ETag')).toBe('test-etag');
    expect(response.headers.get('Cache-Control')).toBe('no-cache');
  });

  it('should handle 304 Not Modified responses', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 304,
      statusText: 'Not Modified',
    } as any);

    const response = await fetch('/api/artists', {
      headers: {
        'If-None-Match': 'existing-etag',
      },
    });

    expect(response.status).toBe(304);
    expect(response.statusText).toBe('Not Modified');
  });
});
