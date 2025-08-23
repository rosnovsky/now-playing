import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { songsSchema } from "~/types";
import { loader } from "../api.songs";

// Mock the crypto module
vi.mock("crypto", () => ({
  createHash: vi.fn(() => ({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn(() => "mock-etag-hash"),
  })),
}));

// Mock the fetcher utility
vi.mock("~/utils/fetcher", () => ({
  fetcher: vi.fn(),
}));

// Mock the drizzle function
vi.mock("~/utils/drizzle.server", () => ({
  upsertPlexData: vi.fn(),
}));

import { fetcher } from "~/utils/fetcher";

describe("api.songs loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables
    process.env.VITE_PLEX_SERVER_URL = "http://localhost:32400";
    process.env.VITE_PLEX_TOKEN = "test-token-123";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockPlexResponse = {
    MediaContainer: {
      Metadata: [
        {
          title: "Test Song",
          grandparentTitle: "Test Artist",
          parentTitle: "Test Album",
          thumb: "/library/metadata/12345/thumb/1234567890",
          duration: 240000,
          ratingKey: "12345",
          key: "/library/metadata/12345",
          parentRatingKey: "67890",
          grandparentRatingKey: "54321",
          viewCount: 5,
          lastViewedAt: 1640995200,
          parentThumb: "/library/metadata/67890/thumb/1234567890",
          grandparentThumb: "/library/metadata/54321/thumb/3456789012",
          addedAt: 1640908800,
          updatedAt: 1640995200,
          userRating: 8,
          Media: [
            {
              audioCodec: "flac",
              bitrate: 1411,
            },
          ],
        },
        {
          title: "Another Song",
          grandparentTitle: "Another Artist",
          parentTitle: "Another Album",
          thumb: "/library/metadata/23456/thumb/2345678901",
          duration: 180000,
          ratingKey: "23456",
          key: "/library/metadata/23456",
          parentRatingKey: "78901",
          grandparentRatingKey: "65432",
          viewCount: 0,
          parentThumb: "/library/metadata/78901/thumb/2345678901",
          addedAt: 1640822400,
          Media: [
            {
              audioCodec: "mp3",
              bitrate: 320,
            },
          ],
        },
      ],
    },
  };

  it("should successfully fetch and transform songs", async () => {
    // Mock successful fetcher response
    vi.mocked(fetcher).mockResolvedValue({
      data: mockPlexResponse,
      status: 200,
    });

    const request = new Request("http://localhost:3000/api/songs");
    const response = await loader({ request });

    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining("http://localhost:32400/library/sections/3/search"),
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
    );

    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData).toHaveLength(2);

    // Verify the first song transformation
    const firstSong = responseData[0];
    expect(firstSong).toEqual({
      title: "Test Song",
      grandparentTitle: "Test Artist",
      parentTitle: "Test Album",
      duration: 240000,
      ratingKey: "12345",
      key: "/library/metadata/12345",
      parentRatingKey: "67890",
      grandparentRatingKey: "54321",
      viewCount: 5,
      lastViewedAt: 1640995200,
      thumb: "/api/images/library/metadata/12345/thumb/1234567890",
      parentThumb: "/api/images/library/metadata/67890/thumb/1234567890",
      grandparentThumb: "/api/images/library/metadata/54321/thumb/3456789012",
      addedAt: 1640908800,
      updatedAt: 1640995200,
      userRating: 8,
      Media: [
        {
          audioCodec: "flac",
          bitrate: 1411,
        },
      ],
    });

    // Verify the second song has default viewCount
    const secondSong = responseData[1];
    expect(secondSong.viewCount).toBe(0);
    expect(secondSong.lastViewedAt).toBeUndefined();
    expect(secondSong.updatedAt).toBeUndefined();
    expect(secondSong.userRating).toBeUndefined();
  });

  it("should include search parameters in the request URL", async () => {
    vi.mocked(fetcher).mockResolvedValue({
      data: mockPlexResponse,
      status: 200,
    });

    const request = new Request(
      "http://localhost:3000/api/songs?sort=title&limit=10"
    );
    await loader({ request });

    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining("sort=title&limit=10"),
      expect.any(Object)
    );
  });

  it("should handle 304 Not Modified when ETags match", async () => {
    vi.mocked(fetcher).mockResolvedValue({
      data: mockPlexResponse,
      status: 200,
    });

    const request = new Request("http://localhost:3000/api/songs", {
      headers: {
        "If-None-Match": "mock-etag-hash",
      },
    });

    const response = await loader({ request });
    expect(response.status).toBe(304);
  });

  it("should return ETag and Cache-Control headers on successful response", async () => {
    vi.mocked(fetcher).mockResolvedValue({
      data: mockPlexResponse,
      status: 200,
    });

    const request = new Request("http://localhost:3000/api/songs");
    const response = await loader({ request });

    expect(response.headers.get("ETag")).toBe("mock-etag-hash");
    expect(response.headers.get("Cache-Control")).toBe("no-cache");
  });

  it("should handle HTTP errors from Plex server", async () => {
    vi.mocked(fetcher).mockResolvedValue({
      data: null,
      status: 404,
    });

    const request = new Request("http://localhost:3000/api/songs");
    const response = await loader({ request });

    expect(response.status).toBe(500);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: "Failed to fetch songs" });
  });

  it("should handle network errors", async () => {
    vi.mocked(fetcher).mockRejectedValue(new Error("Network error"));

    const request = new Request("http://localhost:3000/api/songs");
    const response = await loader({ request });

    expect(response.status).toBe(500);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: "Failed to fetch songs" });
  });

  it("should handle invalid JSON response", async () => {
    vi.mocked(fetcher).mockResolvedValue({
      data: null,
      status: 200,
    });

    const request = new Request("http://localhost:3000/api/songs");
    const response = await loader({ request });

    expect(response.status).toBe(500);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: "Failed to fetch songs" });
  });

  it("should handle validation errors from Zod schema", async () => {
    // Mock response with invalid data structure
    const invalidResponse = {
      MediaContainer: {
        Metadata: [
          {
            // Missing required fields
            title: "Test Song",
            // Missing other required fields
          },
        ],
      },
    };

    vi.mocked(fetcher).mockResolvedValue({
      data: invalidResponse,
      status: 200,
    });

    const request = new Request("http://localhost:3000/api/songs");
    const response = await loader({ request });

    expect(response.status).toBe(500);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: "Invalid data structure" });
  });

  it("should handle songs without Media array", async () => {
    const responseWithoutMedia = {
      MediaContainer: {
        Metadata: [
          {
            title: "Test Song",
            grandparentTitle: "Test Artist",
            parentTitle: "Test Album",
            thumb: "/library/metadata/12345/thumb/1234567890",
            duration: 240000,
            ratingKey: "12345",
            key: "/library/metadata/12345",
            parentRatingKey: "67890",
            grandparentRatingKey: "54321",
            viewCount: 5,
            parentThumb: "/library/metadata/67890/thumb/1234567890",
            addedAt: 1640908800,
            // No Media array
          },
        ],
      },
    };

    vi.mocked(fetcher).mockResolvedValue({
      data: responseWithoutMedia,
      status: 200,
    });

    const request = new Request("http://localhost:3000/api/songs");
    const response = await loader({ request });

    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData[0].Media).toBeUndefined();
  });

  it("should correctly rewrite image URLs", async () => {
    const responseWithDifferentUrls = {
      MediaContainer: {
        Metadata: [
          {
            title: "Test Song",
            grandparentTitle: "Test Artist",
            parentTitle: "Test Album",
            thumb: "library/metadata/12345/thumb/1234567890", // No leading slash
            duration: 240000,
            ratingKey: "12345",
            key: "/library/metadata/12345",
            parentRatingKey: "67890",
            grandparentRatingKey: "54321",
            viewCount: 5,
            parentThumb: "/library/metadata/67890/thumb/1234567890", // With leading slash
            addedAt: 1640908800,
            albumArt: undefined, // Test undefined albumArt
            art: "/library/metadata/12345/art/1234567890", // Test art field
            Media: [
              {
                audioCodec: "flac",
                bitrate: 1411,
              },
            ],
          },
        ],
      },
    };

    vi.mocked(fetcher).mockResolvedValue({
      data: responseWithDifferentUrls,
      status: 200,
    });

    const request = new Request("http://localhost:3000/api/songs");
    const response = await loader({ request });

    const responseData = await response.json();
    const song = responseData[0];

    expect(song.thumb).toBe(
      "/api/images/library/metadata/12345/thumb/1234567890"
    );
    expect(song.parentThumb).toBe(
      "/api/images/library/metadata/67890/thumb/1234567890"
    );
    // albumArt should be undefined since it was explicitly set to undefined in mock
    expect(song.albumArt).toBeUndefined();
    expect(song.art).toBe("/api/images/library/metadata/12345/art/1234567890");
  });

  it("should validate the response against the songs schema", async () => {
    vi.mocked(fetcher).mockResolvedValue({
      data: mockPlexResponse,
      status: 200,
    });

    const request = new Request("http://localhost:3000/api/songs");
    const response = await loader({ request });
    const responseData = await response.json();

    // Verify the response matches our schema
    const validationResult = songsSchema.safeParse(responseData);
    expect(validationResult.success).toBe(true);
  });

  it("should handle grandparentThumb field correctly", async () => {
    const responseWithGrandparentThumb = {
      MediaContainer: {
        Metadata: [
          {
            title: "Test Song",
            grandparentTitle: "Test Artist",
            parentTitle: "Test Album",
            thumb: "/library/metadata/12345/thumb/1234567890",
            duration: 240000,
            ratingKey: "12345",
            key: "/library/metadata/12345",
            parentRatingKey: "67890",
            grandparentRatingKey: "54321",
            viewCount: 5,
            parentThumb: "/library/metadata/67890/thumb/1234567890",
            grandparentThumb: "/library/metadata/54321/thumb/3456789012",
            addedAt: 1640908800,
            Media: [
              {
                audioCodec: "flac",
                bitrate: 1411,
              },
            ],
          },
        ],
      },
    };

    vi.mocked(fetcher).mockResolvedValue({
      data: responseWithGrandparentThumb,
      status: 200,
    });

    const request = new Request("http://localhost:3000/api/songs");
    const response = await loader({ request });

    const responseData = await response.json();
    const song = responseData[0];

    expect(song.grandparentThumb).toBe(
      "/api/images/library/metadata/54321/thumb/3456789012"
    );
  });

  it("should handle missing grandparentThumb gracefully", async () => {
    const responseWithoutGrandparentThumb = {
      MediaContainer: {
        Metadata: [
          {
            title: "Test Song",
            grandparentTitle: "Test Artist",
            parentTitle: "Test Album",
            thumb: "/library/metadata/12345/thumb/1234567890",
            duration: 240000,
            ratingKey: "12345",
            key: "/library/metadata/12345",
            parentRatingKey: "67890",
            grandparentRatingKey: "54321",
            viewCount: 5,
            parentThumb: "/library/metadata/67890/thumb/1234567890",
            addedAt: 1640908800,
            Media: [
              {
                audioCodec: "flac",
                bitrate: 1411,
              },
            ],
          },
        ],
      },
    };

    vi.mocked(fetcher).mockResolvedValue({
      data: responseWithoutGrandparentThumb,
      status: 200,
    });

    const request = new Request("http://localhost:3000/api/songs");
    const response = await loader({ request });

    const responseData = await response.json();
    const song = responseData[0];

    expect(song.grandparentThumb).toBeUndefined();
  });
});
