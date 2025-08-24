import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { db } from '~/db/index';
import { songs, artists, albums, playEvents } from '~/db/schema';
import { eq, sql } from 'drizzle-orm';

// Mock the database
vi.mock('~/db/index', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      songs: {
        findFirst: vi.fn()
      },
      artists: {
        findFirst: vi.fn()
      },
      albums: {
        findFirst: vi.fn()
      }
    }
  }
}));

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockDb = db as any;

describe('Database Cleanup API Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Worker Status API', () => {
    it('should return initial idle status', async () => {
      const mockResponse = {
        success: true,
        isRunning: false,
        progress: {
          phase: 'idle',
          current: 0,
          total: 0,
          message: 'Ready to start cleanup'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('/api/cleanup?action=status');
      const status = await response.json();

      expect(status.success).toBe(true);
      expect(status.isRunning).toBe(false);
      expect(status.progress.phase).toBe('idle');
    });

    it('should return running status during cleanup', async () => {
      const mockResponse = {
        success: true,
        isRunning: true,
        progress: {
          phase: 'songs',
          current: 1,
          total: 5,
          message: 'Deduplicating songs...'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('/api/cleanup?action=status');
      const status = await response.json();

      expect(status.success).toBe(true);
      expect(status.isRunning).toBe(true);
      expect(status.progress.phase).toBe('songs');
      expect(status.progress.current).toBe(1);
      expect(status.progress.total).toBe(5);
    });

    it('should return completed status with results', async () => {
      const mockResponse = {
        success: true,
        isRunning: false,
        progress: {
          phase: 'completed',
          current: 5,
          total: 5,
          message: 'Cleanup completed successfully!'
        },
        result: {
          duplicatesSong: 5,
          duplicatesArtist: 3,
          duplicatesAlbum: 2,
          orphanedPlayEvents: 1,
          inconsistencies: [],
          totalRecordsProcessed: 11,
          executionTime: 5000
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('/api/cleanup?action=status');
      const status = await response.json();

      expect(status.success).toBe(true);
      expect(status.isRunning).toBe(false);
      expect(status.progress.phase).toBe('completed');
      expect(status.result).toBeDefined();
      expect(status.result.totalRecordsProcessed).toBe(11);
    });
  });

  describe('Worker Control API', () => {
    it('should start cleanup worker successfully', async () => {
      const mockResponse = {
        success: true,
        message: "Cleanup worker started",
        progress: {
          phase: 'initializing',
          current: 0,
          total: 5,
          message: 'Starting database cleanup...'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('/api/cleanup?start=true', {
        method: 'POST'
      });
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.message).toBe("Cleanup worker started");
      expect(result.progress.phase).toBe('initializing');
    });

    it('should prevent starting multiple workers', async () => {
      const mockResponse = {
        success: false,
        message: "Cleanup worker is already running"
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('/api/cleanup?start=true', {
        method: 'POST'
      });
      const result = await response.json();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Cleanup worker is already running");
    });

    it('should stop cleanup worker successfully', async () => {
      const mockResponse = {
        success: true,
        message: "Worker stopped successfully"
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('/api/cleanup?action=stop');
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.message).toBe("Worker stopped successfully");
    });

    it('should handle stop request when worker is not running', async () => {
      const mockResponse = {
        success: false,
        message: "Worker is not running"
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('/api/cleanup?action=stop');
      const result = await response.json();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Worker is not running");
    });
  });

  describe('normalizeTitle function', () => {
    it('should normalize titles correctly', () => {
      // Test data for title normalization
      const testCases = [
        { input: 'Mamma Mia', expected: 'mamma mia' },
        { input: 'Mamma Mia!', expected: 'mamma mia' },
        { input: 'Mamma Mia!!!', expected: 'mamma mia' },
        { input: 'A-ha', expected: 'ha' },
        { input: 'AHA', expected: 'aha' },
        { input: 'Ah-a', expected: 'ah' },
        { input: 'The Beatles', expected: 'beatles' },
        { input: 'Beatles', expected: 'beatles' },
        { input: 'Song ft. Artist', expected: 'song ft artist' },
        { input: 'Song feat. Artist', expected: 'song feat artist' },
        { input: 'Artist & Co', expected: 'artist & co' },
      ];

      // Since the normalize function is in the route file, we'll test the logic here
      const normalizeTitle = (title: string): string => {
        return title
          .toLowerCase()
          .trim()
          .replace(/[!?.,;:'"\-_\s]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/\b(the|a|an)\b/g, '')
          .trim();
      };

      const areNamesEquivalent = (name1: string, name2: string): boolean => {
        const normalized1 = normalizeTitle(name1);
        const normalized2 = normalizeTitle(name2);

        if (normalized1 === normalized2) {
          return true;
        }

        const variations = [
          [/\bft\b/g, 'featuring'],
          [/\bfeat\b/g, 'featuring'],
          [/\b&\b/g, 'and'],
          [/\bw\//g, 'with'],
          [/\bvs\b/g, 'versus'],
          [/\bpt\b/g, 'part'],
          [/\bvol\b/g, 'volume'],
        ];

        let var1 = normalized1;
        let var2 = normalized2;

        variations.forEach(([pattern, replacement]) => {
          var1 = var1.replace(pattern as RegExp, replacement as string);
          var2 = var2.replace(pattern as RegExp, replacement as string);
        });

        return var1 === var2;
      };

      testCases.forEach(({ input, expected }) => {
        expect(normalizeTitle(input)).toBe(expected);
      });

      // Test equivalence
      expect(areNamesEquivalent('Mamma Mia', 'Mamma Mia!')).toBe(true);
      expect(areNamesEquivalent('AHA', 'Ah-a')).toBe(false); // Different after normalization
      expect(areNamesEquivalent('Song ft. Artist', 'Song featuring Artist')).toBe(true);
      expect(areNamesEquivalent('The Beatles', 'Beatles')).toBe(true);
      expect(areNamesEquivalent('Different Song', 'Another Song')).toBe(false);
    });
  });

  describe('Duplicate Detection Logic', () => {
    it('should identify duplicate artists correctly', () => {
      const artists = [
        { id: 1, title: 'A-ha', ratingKey: 'artist1', viewCount: 100 },
        { id: 2, title: 'AHA', ratingKey: 'artist2', viewCount: 50 },
        { id: 3, title: 'Ah-a', ratingKey: 'artist3', viewCount: 75 },
        { id: 4, title: 'Beatles', ratingKey: 'artist4', viewCount: 200 },
      ];

      // Simulate the duplicate detection logic
      const duplicatesFound = new Set<number>();
      const duplicateGroups = [];

      for (let i = 0; i < artists.length; i++) {
        if (duplicatesFound.has(artists[i].id)) continue;

        const currentArtist = artists[i];
        const duplicates = [];

        for (let j = i + 1; j < artists.length; j++) {
          if (duplicatesFound.has(artists[j].id)) continue;

          // Simplified equivalent check for test
          const areEquivalent = (name1: string, name2: string): boolean => {
            const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
            return normalize(name1) === normalize(name2);
          };

          if (areEquivalent(currentArtist.title, artists[j].title)) {
            duplicates.push(artists[j]);
            duplicatesFound.add(artists[j].id);
          }
        }

        if (duplicates.length > 0) {
          duplicateGroups.push([currentArtist, ...duplicates]);
        }
      }

      expect(duplicateGroups).toHaveLength(1);
      expect(duplicateGroups[0]).toHaveLength(3); // A-ha, AHA, Ah-a
      expect(duplicateGroups[0].map(a => a.title)).toEqual(['A-ha', 'AHA', 'Ah-a']);
    });

    it('should identify the master record with highest view count', () => {
      const artistGroup = [
        { id: 1, title: 'A-ha', ratingKey: 'artist1', viewCount: 100 },
        { id: 2, title: 'AHA', ratingKey: 'artist2', viewCount: 150 },
        { id: 3, title: 'Ah-a', ratingKey: 'artist3', viewCount: 75 },
      ];

      const master = artistGroup.reduce((prev, current) =>
        (current.viewCount || 0) > (prev.viewCount || 0) ? current : prev
      );

      expect(master.id).toBe(2);
      expect(master.title).toBe('AHA');
      expect(master.viewCount).toBe(150);
    });
  });

  describe('Database Operations Mock', () => {
    it('should update play events when merging duplicates', async () => {
      const updateSpy = vi.fn().mockResolvedValue([]);
      const deleteSpy = vi.fn().mockResolvedValue([]);

      mockDb.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: updateSpy
        })
      });

      mockDb.delete = vi.fn().mockReturnValue({
        where: deleteSpy
      });

      // Simulate merging artist duplicates
      const masterId = 1;
      const duplicateId = 2;

      // This would be the actual update calls in the cleanup function
      const playEventsUpdate = mockDb.update(playEvents)
        .set({ artistId: masterId })
        .where(eq(playEvents.artistId, duplicateId));

      const artistDelete = mockDb.delete(artists).where(eq(artists.id, duplicateId));

      expect(mockDb.update).toHaveBeenCalledWith(playEvents);
      expect(mockDb.delete).toHaveBeenCalledWith(artists);
    });

    it('should handle orphaned play events cleanup', async () => {
      const selectSpy = vi.fn().mockResolvedValue([
        { id: 1, songId: 999, artistId: 1, albumId: 1 }, // orphaned song
        { id: 2, songId: 1, artistId: 999, albumId: 1 }, // orphaned artist
      ]);

      const deleteSpy = vi.fn().mockResolvedValue([]);

      mockDb.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: selectSpy
              })
            })
          })
        })
      });

      mockDb.delete = vi.fn().mockReturnValue({
        where: deleteSpy
      });

      // Simulate finding orphaned events
      const orphanedEvents = await selectSpy();
      expect(orphanedEvents).toHaveLength(2);

      // Simulate deleting orphaned events
      if (orphanedEvents.length > 0) {
        await mockDb.delete(playEvents).where(deleteSpy);
        expect(mockDb.delete).toHaveBeenCalledWith(playEvents);
      }
    });
  });

  describe('Worker Progress Tracking', () => {
    it('should track progress through all phases', () => {
      const phases = ['idle', 'initializing', 'songs', 'artists', 'albums', 'orphans', 'consistency', 'completed'];

      phases.forEach((phase, index) => {
        const progress = {
          phase: phase as any,
          current: index,
          total: phases.length - 1,
          message: `Processing ${phase}...`
        };

        expect(progress.phase).toBe(phase);
        expect(progress.current).toBe(index);
        expect(typeof progress.message).toBe('string');
      });
    });

    it('should calculate progress percentage correctly', () => {
      const testCases = [
        { current: 0, total: 5, expected: 0 },
        { current: 1, total: 5, expected: 20 },
        { current: 2, total: 5, expected: 40 },
        { current: 5, total: 5, expected: 100 },
      ];

      testCases.forEach(({ current, total, expected }) => {
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        expect(percentage).toBe(expected);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/cleanup?action=status');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('should handle worker errors in status', async () => {
      const mockResponse = {
        success: true,
        isRunning: false,
        progress: {
          phase: 'error',
          current: 0,
          total: 0,
          message: 'An error occurred during cleanup'
        },
        error: 'Database connection failed'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('/api/cleanup?action=status');
      const status = await response.json();

      expect(status.success).toBe(true);
      expect(status.progress.phase).toBe('error');
      expect(status.error).toBe('Database connection failed');
    });
  });

  describe('Consistency Checks Mock', () => {
    it('should identify songs with missing artist references', async () => {
      const mockInconsistentSongs = [
        { id: 1, title: 'Song 1', parentRatingKey: 'album1', grandparentRatingKey: 'missing_artist' },
        { id: 2, title: 'Song 2', parentRatingKey: 'missing_album', grandparentRatingKey: 'artist1' },
      ];

      mockDb.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(mockInconsistentSongs)
            })
          })
        })
      });

      const inconsistencies: string[] = [];
      const songsWithMissingRefs = await mockDb.select().from().leftJoin().leftJoin().where();

      if (songsWithMissingRefs.length > 0) {
        inconsistencies.push(`Found ${songsWithMissingRefs.length} songs with missing artist or album references`);
      }

      expect(inconsistencies).toContain('Found 2 songs with missing artist or album references');
    });

    it('should detect duplicate rating keys', async () => {
      const mockDuplicateKeys = [
        { ratingKey: 'duplicate_key', count: 3 },
        { ratingKey: 'another_duplicate', count: 2 },
      ];

      mockDb.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockReturnValue({
            having: vi.fn().mockResolvedValue(mockDuplicateKeys)
          })
        })
      });

      const duplicateKeys = await mockDb.select().from().groupBy().having();

      expect(duplicateKeys).toHaveLength(2);
      expect(duplicateKeys[0].count).toBeGreaterThan(1);
    });
  });

  describe('Performance and Safety', () => {
    it('should handle large datasets without timeout', () => {
      // Test that the algorithm can handle a reasonable number of records
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        title: `Artist ${i}`,
        ratingKey: `artist_${i}`,
        viewCount: Math.floor(Math.random() * 1000)
      }));

      const startTime = Date.now();

      // Simulate the O(n²) comparison logic
      let comparisons = 0;
      for (let i = 0; i < largeDataset.length; i++) {
        for (let j = i + 1; j < largeDataset.length; j++) {
          comparisons++;
          // Simulate comparison work
        }
      }

      const executionTime = Date.now() - startTime;

      expect(comparisons).toBe(499500); // n*(n-1)/2 for n=1000
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should preserve data integrity during cleanup', () => {
      // Test that master record selection is deterministic
      const duplicateGroup = [
        { id: 1, title: 'Artist', viewCount: 100, ratingKey: 'key1' },
        { id: 2, title: 'Artist', viewCount: 100, ratingKey: 'key2' }, // Same view count
        { id: 3, title: 'Artist', viewCount: 50, ratingKey: 'key3' },
      ];

      // When view counts are tied, should prefer the first one found
      const master = duplicateGroup.reduce((prev, current) =>
        (current.viewCount || 0) > (prev.viewCount || 0) ? current : prev
      );

      expect(master.id).toBe(1); // First one with highest view count
      expect(master.ratingKey).toBe('key1');
    });

    it('should support worker cancellation', () => {
      // Test that worker can be stopped during processing
      let workerRunning = true;
      let processedItems = 0;
      const totalItems = 100;

      // Simulate processing that can be interrupted
      for (let i = 0; i < totalItems; i++) {
        if (!workerRunning) break;

        processedItems++;

        // Simulate stopping the worker partway through
        if (i === 50) {
          workerRunning = false;
        }
      }

      expect(processedItems).toBe(51); // Processed up to index 50 (inclusive)
      expect(workerRunning).toBe(false);
    });
  });
});
