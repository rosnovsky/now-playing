/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loader } from '../api.artists';
import { artistsSchema } from '~/types';

// Mock the crypto module
vi.mock('crypto', () => ({
  createHash: vi.fn(() => ({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn(() => 'mock-etag-hash'),
  })),
}));

// Mock the drizzle server
vi.mock('~/utils/drizzle.server', () => ({
  upsertPlexData: vi.fn(),
}));

describe('api.artists loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables
    process.env.VITE_PLEX_SERVER_URL = 'http://localhost:32400';
    process.env.VITE_PLEX_TOKEN = 'test-token';
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully fetch and transform artists', async () => {
    const mockPlexResponse = {
      MediaContainer: {
        Metadata: [
          {
            title: "Test Artist",
            thumb: "/library/metadata/12345/thumb/1234567890",
            art: "/library/metadata/12345/art/1234567890",
            ratingKey: "12345",
            guid: "plex://artist/12345",
            type: "artist",
            summary: "Test artist summary",
            viewCount: 5,
            addedAt: 1640995200,
            updatedAt: 1640995300,
          },
          {
            title: "Another Artist",
            thumb: "/library/metadata/23456/thumb/2345678901",
            art: "/library/metadata/23456/art/2345678901",
            ratingKey: "23456",
            guid: "plex://artist/23456",
            type: "artist",
            summary: "Another artist summary",
            viewCount: 0,
            addedAt: 1640995400,
            updatedAt: 1640995500,
          },
        ],
      },
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockPlexResponse),
    } as any);

    const request = new Request('http://localhost:3000/api/artists');
    const response = await loader({ request });

    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData).toHaveLength(2);

    const firstArtist = responseData[0];
    expect(firstArtist).toEqual({
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
    });

    const secondArtist = responseData[1];
    expect(secondArtist).toEqual({
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
    });
  });

  it('should include search parameters in the request URL', async () => {
    const mockPlexResponse = {
      MediaContainer: {
        Metadata: [],
      },
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockPlexResponse),
    } as any);

    const request = new Request('http://localhost:3000/api/artists');
    await loader({ request });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:32400/library/sections/3/all?X-Plex-Token=test-token&sort=viewCount%3Adesc&limit=10',
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
  });

  it('should handle 304 Not Modified when ETags match', async () => {
    const mockPlexResponse = {
      MediaContainer: {
        Metadata: [
          {
            title: "Test Artist",
            thumb: "/library/metadata/12345/thumb/1234567890",
            ratingKey: "12345",
            guid: "plex://artist/12345",
            type: "artist",
            summary: "Test artist summary",
            viewCount: 5,
            addedAt: 1640995200,
            updatedAt: 1640995300,
          },
        ],
      },
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockPlexResponse),
    } as any);

    const request = new Request('http://localhost:3000/api/artists', {
      headers: {
        'If-None-Match': 'mock-etag-hash',
      },
    });

    const response = await loader({ request });
    expect(response.status).toBe(304);
  });

  it('should return ETag and Cache-Control headers on successful response', async () => {
    const mockPlexResponse = {
      MediaContainer: {
        Metadata: [
          {
            title: "Test Artist",
            thumb: "/library/metadata/12345/thumb/1234567890",
            ratingKey: "12345",
            guid: "plex://artist/12345",
            type: "artist",
            summary: "Test artist summary",
            viewCount: 5,
            addedAt: 1640995200,
            updatedAt: 1640995300,
          },
        ],
      },
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockPlexResponse),
    } as any);

    const request = new Request('http://localhost:3000/api/artists');
    const response = await loader({ request });

    expect(response.headers.get('ETag')).toBe('mock-etag-hash');
    expect(response.headers.get('Cache-Control')).toBe('no-cache');
  });

  it('should handle HTTP errors from Plex server', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as any);

    const request = new Request('http://localhost:3000/api/artists');

    await expect(loader({ request })).rejects.toThrow();
  });

  it('should handle network errors', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    const request = new Request('http://localhost:3000/api/artists');

    await expect(loader({ request })).rejects.toThrow('Network error');
  });

  it('should handle invalid JSON response', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
    } as any);

    const request = new Request('http://localhost:3000/api/artists');

    await expect(loader({ request })).rejects.toThrow('Invalid JSON');
  });

  it('should handle validation errors from Zod schema', async () => {
    const invalidPlexResponse = {
      MediaContainer: {
        Metadata: [
          {
            // Missing required title field
            thumb: "/library/metadata/12345/thumb/1234567890",
            ratingKey: "12345",
            guid: "plex://artist/12345",
            type: "artist",
            summary: "Test artist summary",
            viewCount: 5,
            addedAt: 1640995200,
            updatedAt: 1640995300,
          },
        ],
      },
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(invalidPlexResponse),
    } as any);

    const request = new Request('http://localhost:3000/api/artists');

    await expect(loader({ request })).rejects.toThrow();
  });

  it('should handle artists without optional fields', async () => {
    const mockPlexResponse = {
      MediaContainer: {
        Metadata: [
          {
            title: "Test Artist",
            ratingKey: "12345",
            guid: "plex://artist/12345",
            type: "artist",
            viewCount: 5,
            addedAt: 1640995200,
            // Missing optional fields: thumb, art, summary, updatedAt
          },
        ],
      },
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockPlexResponse),
    } as any);

    const request = new Request('http://localhost:3000/api/artists');
    const response = await loader({ request });

    expect(response.status).toBe(200);
    const responseData = await response.json();
    const artist = responseData[0];

    expect(artist.thumb).toBeUndefined();
    expect(artist.art).toBeNull();
    expect(artist.summary).toBeUndefined();
    expect(artist.updatedAt).toBeUndefined();
  });

  it('should correctly rewrite image URLs', async () => {
    const mockPlexResponse = {
      MediaContainer: {
        Metadata: [
          {
            title: "Test Artist",
            thumb: "library/metadata/12345/thumb/1234567890", // No leading slash
            art: "library/metadata/12345/art/1234567890", // No leading slash
            ratingKey: "12345",
            guid: "plex://artist/12345",
            type: "artist",
            summary: "Test artist summary",
            viewCount: 5,
            addedAt: 1640995200,
            updatedAt: 1640995300,
          },
        ],
      },
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockPlexResponse),
    } as any);

    const request = new Request('http://localhost:3000/api/artists');
    const response = await loader({ request });

    expect(response.status).toBe(200);
    const responseData = await response.json();
    const artist = responseData[0];

    expect(artist.thumb).toBe(
      "/api/images/library/metadata/12345/thumb/1234567890"
    );
    expect(artist.art).toBe(
      "/api/images/library/metadata/12345/art/1234567890"
    );
  });

  it('should validate the response against the artists schema', async () => {
    const mockPlexResponse = {
      MediaContainer: {
        Metadata: [
          {
            title: "Test Artist",
            thumb: "/library/metadata/12345/thumb/1234567890",
            art: "/library/metadata/12345/art/1234567890",
            ratingKey: "12345",
            guid: "plex://artist/12345",
            type: "artist",
            summary: "Test artist summary",
            viewCount: 5,
            addedAt: 1640995200,
            updatedAt: 1640995300,
          },
        ],
      },
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockPlexResponse),
    } as any);

    const request = new Request('http://localhost:3000/api/artists');
    const response = await loader({ request });
    const responseData = await response.json();

    // Verify the response matches the schema
    const validationResult = artistsSchema.safeParse(responseData);
    expect(validationResult.success).toBe(true);
  });

  it('should handle art field correctly', async () => {
    const mockPlexResponse = {
      MediaContainer: {
        Metadata: [
          {
            title: "Test Artist",
            thumb: "/library/metadata/12345/thumb/1234567890",
            art: "/library/metadata/12345/art/1234567890",
            ratingKey: "12345",
            guid: "plex://artist/12345",
            type: "artist",
            summary: "Test artist summary",
            viewCount: 5,
            addedAt: 1640995200,
            updatedAt: 1640995300,
          },
        ],
      },
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockPlexResponse),
    } as any);

    const request = new Request('http://localhost:3000/api/artists');
    const response = await loader({ request });

    expect(response.status).toBe(200);
    const responseData = await response.json();
    const artist = responseData[0];

    expect(artist.art).toBe(
      "/api/images/library/metadata/12345/art/1234567890"
    );
  });

  it('should handle missing art gracefully', async () => {
    const mockPlexResponse = {
      MediaContainer: {
        Metadata: [
          {
            title: "Test Artist",
            thumb: "/library/metadata/12345/thumb/1234567890",
            ratingKey: "12345",
            guid: "plex://artist/12345",
            type: "artist",
            summary: "Test artist summary",
            viewCount: 5,
            addedAt: 1640995200,
            updatedAt: 1640995300,
            // No art field
          },
        ],
      },
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockPlexResponse),
    } as any);

    const request = new Request('http://localhost:3000/api/artists');
    const response = await loader({ request });

    expect(response.status).toBe(200);
    const responseData = await response.json();
    const artist = responseData[0];

    expect(artist.art).toBeNull();
  });

  it('should handle zero viewCount correctly', async () => {
    const mockPlexResponse = {
      MediaContainer: {
        Metadata: [
          {
            title: "Test Artist",
            ratingKey: "12345",
            guid: "plex://artist/12345",
            type: "artist",
            summary: "Test artist summary",
            // viewCount is missing, should default to 0
            addedAt: 1640995200,
          },
        ],
      },
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockPlexResponse),
    } as any);

    const request = new Request('http://localhost:3000/api/artists');
    const response = await loader({ request });

    expect(response.status).toBe(200);
    const responseData = await response.json();
    const artist = responseData[0];

    expect(artist.viewCount).toBe(0);
  });
});
