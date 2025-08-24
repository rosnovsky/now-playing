import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment variables globally
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_PLEX_SERVER_URL: 'https://test-plex-server.com',
    VITE_PLEX_TOKEN: 'test-token'
  },
  writable: true
});

// Mock the fetcher utility
vi.mock('~/utils/fetcher', () => ({
  fetcher: vi.fn(),
}));

// Mock the drizzle.server module
vi.mock('~/utils/drizzle.server', () => ({
  upsertPlexData: vi.fn(),
  syncStats: vi.fn(),
}));

// Mock the db/index module
vi.mock('~/db/index', () => {
  const mockReturning = vi.fn(() => [{ id: 1 }]);
  const mockValues = vi.fn(() => ({ returning: mockReturning }));
  const mockInsert = vi.fn(() => ({ values: mockValues }));
  const mockDelete = vi.fn(() => Promise.resolve());

  return {
    db: {
      insert: mockInsert,
      delete: mockDelete,
      query: {
        syncEvents: {
          findFirst: vi.fn(),
        },
        songs: {
          findFirst: vi.fn(),
        },
        artists: {
          findFirst: vi.fn(),
        },
        albums: {
          findFirst: vi.fn(),
        },
      },
    },
  };
});

describe('api.updateStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader', () => {
    it('should perform full sync when no previous sync exists', async () => {
      const { loader } = await import('../api.updateStats');
      const { db } = await import('~/db/index');
      const { upsertPlexData, syncStats } = await import('~/utils/drizzle.server');
      const { fetcher } = await import('~/utils/fetcher');

      // Mock no previous sync
      vi.mocked(db.query.syncEvents.findFirst).mockResolvedValue(undefined);

      // Mock Plex API responses
      const mockLibraryCountResponse = {
        data: {
          MediaContainer: {
            totalSize: 1
          }
        },
        status: 200
      };

      const mockLibraryResponse = {
        data: {
          MediaContainer: {
            Metadata: [
              {
                ratingKey: '123',
                key: '/library/metadata/123',
                parentRatingKey: '456',
                grandparentRatingKey: '789',
                type: 'track',
                title: 'Test Song',
                parentTitle: 'Test Album',
                grandparentTitle: 'Test Artist',
                viewCount: 5,
              }
            ]
          }
        },
        status: 200
      };

      const mockHistoryResponse = {
        data: {
          MediaContainer: {
            Metadata: [
              {
                ratingKey: '123',
                key: '/library/metadata/123',
                parentRatingKey: '456',
                grandparentRatingKey: '789',
                type: 'track',
                title: 'Test Song',
                parentTitle: 'Test Album',
                grandparentTitle: 'Test Artist',
                viewCount: 5,
                viewedAt: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
              }
            ]
          }
        },
        status: 200
      };

      const mockTrackResponse = {
        data: {
          MediaContainer: {
            Metadata: [{
              ratingKey: '123',
              key: '/library/metadata/123',
              parentRatingKey: '456',
              grandparentRatingKey: '789',
              type: 'track',
              title: 'Test Song',
              parentTitle: 'Test Album',
              grandparentTitle: 'Test Artist',
              viewCount: 5,
            }]
          }
        },
        status: 200
      };

      const mockArtistResponse = {
        data: {
          MediaContainer: {
            Metadata: [{
              ratingKey: '789',
              type: 'artist',
              title: 'Test Artist',
              viewCount: 10,
            }]
          }
        },
        status: 200
      };

      const mockAlbumResponse = {
        data: {
          MediaContainer: {
            Metadata: [{
              ratingKey: '456',
              type: 'album',
              title: 'Test Album',
              parentTitle: 'Test Artist',
              viewCount: 7,
            }]
          }
        },
        status: 200
      };

      vi.mocked(fetcher)
        .mockResolvedValueOnce(mockLibraryCountResponse)
        .mockResolvedValueOnce(mockLibraryResponse)
        .mockResolvedValueOnce(mockArtistResponse)
        .mockResolvedValueOnce(mockAlbumResponse);

      // Mock database queries - artist and album don't exist initially (so they get upserted)
      // But song exists after upsert
      vi.mocked(db.query.artists.findFirst)
        .mockResolvedValueOnce(undefined) // First call returns undefined (doesn't exist)
        .mockResolvedValue({ id: 2, ratingKey: '789' }); // Subsequent calls return existing

      vi.mocked(db.query.albums.findFirst)
        .mockResolvedValueOnce(undefined) // First call returns undefined (doesn't exist)
        .mockResolvedValue({ id: 3, ratingKey: '456' }); // Subsequent calls return existing

      vi.mocked(db.query.songs.findFirst).mockResolvedValue({ id: 1, ratingKey: '123' });

      // Mock syncStats to return successful sync
      vi.mocked(syncStats).mockResolvedValue({
        itemType: 'songs',
        ratingKey: '123',
        plexViewCount: 5,
        dbViewCount: 3,
        playEventsCount: 1,
        playEventsCreated: 1
      });

      const request = new Request('http://localhost/api/updateStats');
      const response = await loader({ request });
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.syncType).toBe('full');
      expect(result.itemsProcessed).toBe(1);
      expect(result.playEventsCreated).toBe(1);
      expect(upsertPlexData).toHaveBeenCalledTimes(3); // artist, album, song
      expect(syncStats).toHaveBeenCalledWith('songs', '123', 5);
      expect(db.insert).toHaveBeenCalledTimes(1); // sync event
    });

    it('should perform incremental sync when previous sync exists', async () => {
      const { loader } = await import('../api.updateStats');
      const { db } = await import('~/db/index');
      const { fetcher } = await import('~/utils/fetcher');

      // Mock previous sync
      const lastSyncDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      vi.mocked(db.query.syncEvents.findFirst).mockResolvedValue({
        id: 1,
        syncedAt: lastSyncDate,
        syncType: 'incremental',
        itemsProcessed: 5,
        notes: 'Previous sync'
      });

      // Mock library count and empty history response
      const mockLibraryCountResponse = {
        data: {
          MediaContainer: {
            totalSize: 0
          }
        },
        status: 200
      };

      const mockHistoryResponse = {
        data: {
          MediaContainer: {
            Metadata: []
          }
        },
        status: 200
      };

      vi.mocked(fetcher)
        .mockResolvedValueOnce(mockLibraryCountResponse)
        .mockResolvedValueOnce(mockHistoryResponse);

      const request = new Request('http://localhost/api/updateStats');
      const response = await loader({ request });
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.syncType).toBe('incremental');
      expect(result.playEventsCreated).toBe(0);
      expect(result.historyItemsFound).toBe(0);
    });

    it('should force full sync when full=true parameter is provided', async () => {
      const { loader } = await import('../api.updateStats');
      const { db } = await import('~/db/index');
      const { fetcher } = await import('~/utils/fetcher');

      // Mock previous sync exists
      const lastSyncDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      vi.mocked(db.query.syncEvents.findFirst).mockResolvedValue({
        id: 1,
        syncedAt: lastSyncDate,
        syncType: 'incremental',
        itemsProcessed: 5,
        notes: 'Previous sync'
      });

      // Mock library count and empty history response
      const mockLibraryCountResponse = {
        data: {
          MediaContainer: {
            totalSize: 0
          }
        },
        status: 200
      };

      const mockHistoryResponse = {
        data: {
          MediaContainer: {
            Metadata: []
          }
        },
        status: 200
      };

      vi.mocked(fetcher)
        .mockResolvedValueOnce(mockLibraryCountResponse)
        .mockResolvedValueOnce(mockHistoryResponse);

      const request = new Request('http://localhost/api/updateStats?full=true');
      const response = await loader({ request });
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.syncType).toBe('full');
    });

    it('should handle Plex API errors gracefully', async () => {
      const { loader } = await import('../api.updateStats');
      const { db } = await import('~/db/index');
      const { fetcher } = await import('~/utils/fetcher');

      // Mock no previous sync
      vi.mocked(db.query.syncEvents.findFirst).mockResolvedValue(undefined);

      // Mock failed Plex API response (library count call fails)
      vi.mocked(fetcher).mockRejectedValueOnce(new Error('HTTP error! status: 500'));

      const request = new Request('http://localhost/api/updateStats');
      const response = await loader({ request });
      const result = await response.json();

      expect(result.success).toBe(false);
      expect(result.error).toContain('HTTP error! status: 500');
      expect(response.status).toBe(500);
    });

    it('should handle missing environment variables', async () => {
      const { loader } = await import('../api.updateStats');
      const { db } = await import('~/db/index');
      const { fetcher } = await import('~/utils/fetcher');

      // Mock no previous sync
      vi.mocked(db.query.syncEvents.findFirst).mockResolvedValue(undefined);

      // Mock fetcher to throw an error that would happen when env vars are missing
      vi.mocked(fetcher).mockRejectedValueOnce(new Error('Cannot read properties of undefined (reading \'trim\')'));

      const request = new Request('http://localhost/api/updateStats');
      const response = await loader({ request });
      const result = await response.json();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot read properties of undefined');
      expect(response.status).toBe(500);
    });

    it('should throw error when song not found in database after upsert', async () => {
      const { loader } = await import('../api.updateStats');
      const { db } = await import('~/db/index');
      const { upsertPlexData } = await import('~/utils/drizzle.server');
      const { fetcher } = await import('~/utils/fetcher');

      // Mock no previous sync
      vi.mocked(db.query.syncEvents.findFirst).mockResolvedValue(undefined);

      // Mock Plex API responses
      const mockLibraryCountResponse = {
        data: {
          MediaContainer: {
            totalSize: 1
          }
        },
        status: 200
      };

      const mockLibraryResponse = {
        data: {
          MediaContainer: {
            Metadata: [
              {
                ratingKey: '123',
                key: '/library/metadata/123',
                parentRatingKey: '456',
                grandparentRatingKey: '789',
                type: 'track',
                title: 'Test Song',
                viewCount: 5,
              }
            ]
          }
        },
        status: 200
      };

      vi.mocked(fetcher)
        .mockResolvedValueOnce(mockLibraryCountResponse)
        .mockResolvedValueOnce(mockLibraryResponse)
        .mockResolvedValueOnce({
          data: { MediaContainer: { Metadata: [{ ratingKey: '789' }] } },
          status: 200
        })
        .mockResolvedValueOnce({
          data: { MediaContainer: { Metadata: [{ ratingKey: '456' }] } },
          status: 200
        });

      // Mock database queries - artist and album don't exist initially
      vi.mocked(db.query.artists.findFirst)
        .mockResolvedValueOnce(undefined) // First call returns undefined (doesn't exist)
        .mockResolvedValue({ id: 2, ratingKey: '789' }); // Subsequent calls return existing

      vi.mocked(db.query.albums.findFirst)
        .mockResolvedValueOnce(undefined) // First call returns undefined (doesn't exist)
        .mockResolvedValue({ id: 3, ratingKey: '456' }); // Subsequent calls return existing

      // Mock database queries to return null for song (simulating upsert failure)
      vi.mocked(db.query.songs.findFirst).mockResolvedValue(null);

      const request = new Request('http://localhost/api/updateStats');
      const response = await loader({ request });
      const result = await response.json();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Song not found in database after upsert');
      expect(response.status).toBe(500);
    });

    it('should handle network errors during track metadata fetch', async () => {
      const { loader } = await import('../api.updateStats');
      const { db } = await import('~/db/index');
      const { fetcher } = await import('~/utils/fetcher');

      // Mock no previous sync
      vi.mocked(db.query.syncEvents.findFirst).mockResolvedValue(undefined);

      // Mock library count and track fetch failure
      const mockLibraryCountResponse = {
        data: {
          MediaContainer: {
            totalSize: 1
          }
        },
        status: 200
      };

      const mockLibraryResponse = {
        data: {
          MediaContainer: {
            Metadata: [
              {
                ratingKey: '123',
                key: '/library/metadata/123',
                type: 'track',
                title: 'Test Song',
                viewCount: 5,
                grandparentRatingKey: '456', // This will trigger ensureArtistExists
                parentRatingKey: '789'       // This will trigger ensureAlbumExists
              }
            ]
          }
        },
        status: 200
      };

      // Mock the first artist metadata fetch to fail
      vi.mocked(fetcher)
        .mockResolvedValueOnce(mockLibraryCountResponse)
        .mockResolvedValueOnce(mockLibraryResponse)
        .mockRejectedValueOnce(new Error('Network error during artist metadata fetch'));

      const request = new Request('http://localhost/api/updateStats');
      const response = await loader({ request });
      const result = await response.json();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Song not found in database after upsert');
    });
  });

  describe('action', () => {
    it('should handle POST requests by calling loader', async () => {
      const { action } = await import('../api.updateStats');
      const { db } = await import('~/db/index');
      const { fetcher } = await import('~/utils/fetcher');

      // Mock no previous sync
      vi.mocked(db.query.syncEvents.findFirst).mockResolvedValue(undefined);

      // Mock library count and empty history response
      const mockLibraryCountResponse = {
        data: {
          MediaContainer: {
            totalSize: 0
          }
        },
        status: 200
      };

      const mockHistoryResponse = {
        data: {
          MediaContainer: {
            Metadata: []
          }
        },
        status: 200
      };

      vi.mocked(fetcher)
        .mockResolvedValueOnce(mockLibraryCountResponse)
        .mockResolvedValueOnce(mockHistoryResponse);

      const request = new Request('http://localhost/api/updateStats', {
        method: 'POST'
      });
      const response = await action({ request });
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.syncType).toBe('full');
    });
  });
});
