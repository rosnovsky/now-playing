import { describe, it, expect, vi, beforeEach } from 'vitest';
import { upsertPlexData, syncStats } from '../drizzle.server';

// Mock the db/index module
vi.mock('~/db/index', () => {
  const mockValues = vi.fn();
  const mockInsert = vi.fn(() => ({ values: mockValues }));
  const mockSelect = vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => [{ value: 0 }]) })) }));

  return {
    db: {
      insert: mockInsert,
      select: mockSelect,
      query: {
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

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  sql: vi.fn(),
  count: vi.fn(() => 'mocked_count'),
}));

// Mock schema
vi.mock('~/db/schema', () => ({
  songs: {},
  artists: {},
  albums: {},
  playEvents: {},
}));

describe('drizzle.server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('upsertPlexData', () => {
    it('should insert new song when it does not exist', async () => {
      const { db } = await import('~/db/index');

      // Mock that song doesn't exist (new song)
      vi.mocked(db.query.songs.findFirst).mockResolvedValue(undefined);

      const mockSongData = [
        {
          ratingKey: '1',
          title: 'Song 1',
          grandparentTitle: 'Artist 1',
          parentTitle: 'Album 1',
          albumArt: 'art1',
          duration: 100,
          key: 'key1',
          parentRatingKey: 'prk1',
          grandparentRatingKey: 'gprk1',
          viewCount: 5,
          lastViewedAt: 12345,
          thumb: 'thumb1',
          art: 'art1',
          parentThumb: 'pthumb1',
          grandparentThumb: 'gpthumb1',
          addedAt: 123,
          updatedAt: 456,
          userRating: 5,
        },
      ];

      await expect(upsertPlexData('songs', mockSongData)).resolves.not.toThrow();

      // Should insert the song
      expect(db.insert).toHaveBeenCalledTimes(1);
    });

    it('should not insert song when it already exists (no-op)', async () => {
      const { db } = await import('~/db/index');

      // Mock existing song
      vi.mocked(db.query.songs.findFirst).mockResolvedValue({
        id: 1,
        ratingKey: '1',
        title: 'Song 1',
        viewCount: 3
      });

      const mockSongData = [
        {
          ratingKey: '1',
          title: 'Song 1',
          grandparentTitle: 'Artist 1',
          parentTitle: 'Album 1',
          albumArt: 'art1',
          duration: 100,
          key: 'key1',
          parentRatingKey: 'prk1',
          grandparentRatingKey: 'gprk1',
          viewCount: 5,
          lastViewedAt: 12345,
          thumb: 'thumb1',
          art: 'art1',
          parentThumb: 'pthumb1',
          grandparentThumb: 'gpthumb1',
          addedAt: 123,
          updatedAt: 456,
          userRating: 5,
        },
      ];

      await expect(upsertPlexData('songs', mockSongData)).resolves.not.toThrow();

      // Should not insert anything (no-op)
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('should insert new artist when it does not exist', async () => {
      const { db } = await import('~/db/index');

      // Mock that artist doesn't exist
      vi.mocked(db.query.artists.findFirst).mockResolvedValue(undefined);

      const mockArtistData = [
        {
          ratingKey: '2',
          guid: 'guid2',
          type: 'artist',
          title: 'Artist 2',
          summary: 'Summary 2',
          viewCount: 10,
          thumb: 'thumb2',
          art: 'art2',
          addedAt: 789,
          updatedAt: 1011,
        },
      ];

      await expect(upsertPlexData('artists', mockArtistData)).resolves.not.toThrow();
      expect(db.insert).toHaveBeenCalledTimes(1);
    });

    it('should not insert artist when it already exists (no-op)', async () => {
      const { db } = await import('~/db/index');

      // Mock existing artist
      vi.mocked(db.query.artists.findFirst).mockResolvedValue({
        id: 2,
        ratingKey: '2',
        title: 'Artist 2',
        viewCount: 5
      });

      const mockArtistData = [
        {
          ratingKey: '2',
          guid: 'guid2',
          type: 'artist',
          title: 'Artist 2',
          summary: 'Summary 2',
          viewCount: 10,
          thumb: 'thumb2',
          art: 'art2',
          addedAt: 789,
          updatedAt: 1011,
        },
      ];

      await expect(upsertPlexData('artists', mockArtistData)).resolves.not.toThrow();
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('should insert new album when it does not exist', async () => {
      const { db } = await import('~/db/index');

      // Mock that album doesn't exist
      vi.mocked(db.query.albums.findFirst).mockResolvedValue(undefined);

      const mockAlbumData = [
        {
          ratingKey: '3',
          key: 'key3',
          parentRatingKey: 'prk3',
          guid: 'guid3',
          parentGuid: 'pguid3',
          type: 'album',
          title: 'Album 3',
          parentTitle: 'Artist 3',
          summary: 'Summary 3',
          index: 1,
          viewCount: 15,
          year: 2020,
          thumb: 'thumb3',
          art: 'art3',
          parentThumb: 'pthumb3',
          addedAt: 1213,
          updatedAt: 1415,
        },
      ];

      await expect(upsertPlexData('albums', mockAlbumData)).resolves.not.toThrow();
      expect(db.insert).toHaveBeenCalledTimes(1);
    });

    it('should not insert album when it already exists (no-op)', async () => {
      const { db } = await import('~/db/index');

      // Mock existing album
      vi.mocked(db.query.albums.findFirst).mockResolvedValue({
        id: 3,
        ratingKey: '3',
        title: 'Album 3',
        viewCount: 10
      });

      const mockAlbumData = [
        {
          ratingKey: '3',
          key: 'key3',
          parentRatingKey: 'prk3',
          guid: 'guid3',
          parentGuid: 'pguid3',
          type: 'album',
          title: 'Album 3',
          parentTitle: 'Artist 3',
          summary: 'Summary 3',
          index: 1,
          viewCount: 15,
          year: 2020,
          thumb: 'thumb3',
          art: 'art3',
          parentThumb: 'pthumb3',
          addedAt: 1213,
          updatedAt: 1415,
        },
      ];

      await expect(upsertPlexData('albums', mockAlbumData)).resolves.not.toThrow();
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('should handle undefined art property when upserting album data', async () => {
      const { db } = await import('~/db/index');

      // Mock that album doesn't exist
      vi.mocked(db.query.albums.findFirst).mockResolvedValue(undefined);

      const mockAlbumData = [
        {
          ratingKey: '4',
          key: 'key4',
          parentRatingKey: 'prk4',
          guid: 'guid4',
          parentGuid: 'pguid4',
          type: 'album',
          title: 'Album 4',
          parentTitle: 'Artist 4',
          summary: 'Summary 4',
          index: 1,
          viewCount: 20,
          year: 2021,
          thumb: 'thumb4',
          art: undefined,
          parentThumb: 'pthumb4',
          addedAt: 1617,
          updatedAt: 1819,
        },
      ];

      // The main test is that this doesn't throw an error due to undefined art
      await expect(upsertPlexData('albums', mockAlbumData)).resolves.not.toThrow();
    });

    it('should handle undefined art and grandparentThumb properties when upserting song data', async () => {
      const { db } = await import('~/db/index');

      // Mock that song doesn't exist
      vi.mocked(db.query.songs.findFirst).mockResolvedValue(undefined);

      const mockSongData = [
        {
          ratingKey: '5',
          title: 'Song 5',
          grandparentTitle: 'Artist 5',
          parentTitle: 'Album 5',
          albumArt: 'art5',
          duration: 200,
          key: 'key5',
          parentRatingKey: 'prk5',
          grandparentRatingKey: 'gprk5',
          viewCount: 8,
          lastViewedAt: 56789,
          thumb: 'thumb5',
          art: undefined,
          parentThumb: 'pthumb5',
          grandparentThumb: undefined,
          addedAt: 2021,
          updatedAt: 2223,
          userRating: 4,
        },
      ];

      // The main test is that this doesn't throw an error due to undefined art and grandparentThumb
      await expect(upsertPlexData('songs', mockSongData)).resolves.not.toThrow();
    });
  });

  describe('syncStats', () => {
    it('should create play events when Plex has more plays than our records', async () => {
      const { db } = await import('~/db/index');

      // Mock song exists
      vi.mocked(db.query.songs.findFirst).mockResolvedValue({
        id: 1,
        ratingKey: 'song1',
        viewCount: 5,
        grandparentRatingKey: 'artist1',
        parentRatingKey: 'album1'
      });

      // Mock artist and album exist
      vi.mocked(db.query.artists.findFirst).mockResolvedValue({
        id: 2,
        ratingKey: 'artist1'
      });

      vi.mocked(db.query.albums.findFirst).mockResolvedValue({
        id: 3,
        ratingKey: 'album1'
      });

      // Mock play events count query - return 2 existing play events
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ value: 2 }])
        })
      } as any);

      const result = await syncStats('songs', 'song1', 10); // Plex says 10 plays

      // Expected: DB viewCount (5) + existing playEvents (2) = 7, but Plex has 10
      // So we should create 3 new play events
      expect(result.playEventsCreated).toBe(3);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should not create play events when counts match', async () => {
      const { db } = await import('~/db/index');

      // Mock song exists
      vi.mocked(db.query.songs.findFirst).mockResolvedValue({
        id: 1,
        ratingKey: 'song1',
        viewCount: 5,
        grandparentRatingKey: 'artist1',
        parentRatingKey: 'album1'
      });

      // Mock artist and album exist
      vi.mocked(db.query.artists.findFirst).mockResolvedValue({
        id: 2,
        ratingKey: 'artist1'
      });

      vi.mocked(db.query.albums.findFirst).mockResolvedValue({
        id: 3,
        ratingKey: 'album1'
      });

      // Mock play events count query - return 2 existing play events
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ value: 2 }])
        })
      } as any);

      const result = await syncStats('songs', 'song1', 7); // Plex says 7 plays (5 + 2 = 7)

      // No new play events should be created
      expect(result.playEventsCreated).toBe(0);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('should throw error when song not found in database', async () => {
      const { db } = await import('~/db/index');

      // Mock song doesn't exist
      vi.mocked(db.query.songs.findFirst).mockResolvedValue(undefined);

      await expect(syncStats('songs', 'nonexistent', 10)).rejects.toThrow(
        'songs with ratingKey nonexistent not found in database'
      );
    });

    it('should throw error when required artist is missing for song', async () => {
      const { db } = await import('~/db/index');

      // Mock song exists but artist doesn't
      vi.mocked(db.query.songs.findFirst).mockResolvedValue({
        id: 1,
        ratingKey: 'song1',
        viewCount: 5,
        grandparentRatingKey: 'artist1',
        parentRatingKey: 'album1'
      });

      vi.mocked(db.query.artists.findFirst).mockResolvedValue(undefined);

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ value: 0 }])
        })
      } as any);

      await expect(syncStats('songs', 'song1', 10)).rejects.toThrow(
        'Cannot create play events: missing artist or album for song song1'
      );
    });

    it('should handle artists sync without creating play events', async () => {
      const { db } = await import('~/db/index');

      // Mock artist exists
      vi.mocked(db.query.artists.findFirst).mockResolvedValue({
        id: 2,
        ratingKey: 'artist1',
        viewCount: 5
      });

      // Mock play events count query
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ value: 3 }])
        })
      } as any);

      const result = await syncStats('artists', 'artist1', 10);

      // For artists, we don't create play events directly
      expect(result.playEventsCreated).toBe(0);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('should handle albums sync without creating play events', async () => {
      const { db } = await import('~/db/index');

      // Mock album exists
      vi.mocked(db.query.albums.findFirst).mockResolvedValue({
        id: 3,
        ratingKey: 'album1',
        viewCount: 8
      });

      // Mock play events count query
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ value: 2 }])
        })
      } as any);

      const result = await syncStats('albums', 'album1', 15);

      // For albums, we don't create play events directly
      expect(result.playEventsCreated).toBe(0);
      expect(db.insert).not.toHaveBeenCalled();
    });
  });
});
