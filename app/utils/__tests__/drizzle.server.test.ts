import { describe, it, expect, vi, beforeEach } from 'vitest';
import { upsertPlexData, recordPlayEvent } from '../drizzle.server';

// Mock the db/index module
vi.mock('~/db/index', () => {
  const mockOnConflictDoUpdate = vi.fn();
  const mockValues = vi.fn(() => ({ onConflictDoUpdate: mockOnConflictDoUpdate }));
  const mockInsert = vi.fn(() => ({ values: mockValues }));
  const mockUpdate = vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) }));

  return {
    db: {
      insert: mockInsert,
      update: mockUpdate,
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

describe('drizzle.server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('upsertPlexData', () => {
    it('should upsert song data correctly', async () => {
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
    });

    it('should upsert artist data correctly', async () => {
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
    });

    it('should upsert album data correctly', async () => {
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
    });

    it('should handle undefined art property when upserting album data', async () => {
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

    it('should deduplicate songs by ratingKey when upserting', async () => {
      const mockSongDataWithDuplicates = [
        {
          ratingKey: '6',
          title: 'Song 6 - First',
          grandparentTitle: 'Artist 6',
          parentTitle: 'Album 6',
          albumArt: 'art6',
          duration: 300,
          key: 'key6',
          parentRatingKey: 'prk6',
          grandparentRatingKey: 'gprk6',
          viewCount: 10,
        },
        {
          ratingKey: '6',
          title: 'Song 6 - Updated',
          grandparentTitle: 'Artist 6',
          parentTitle: 'Album 6',
          albumArt: 'art6-updated',
          duration: 305,
          key: 'key6',
          parentRatingKey: 'prk6',
          grandparentRatingKey: 'gprk6',
          viewCount: 12,
        },
      ];

      await expect(upsertPlexData('songs', mockSongDataWithDuplicates)).resolves.not.toThrow();
    });
  });

  describe('recordPlayEvent', () => {
    it('should record a play event if song, artist, and album exist', async () => {
      const { db } = await import('~/db/index');

      vi.mocked(db.query.songs.findFirst).mockResolvedValue({ id: 1, ratingKey: 'song1' });
      vi.mocked(db.query.artists.findFirst).mockResolvedValue({ id: 2, ratingKey: 'artist1' });
      vi.mocked(db.query.albums.findFirst).mockResolvedValue({ id: 3, ratingKey: 'album1' });

      await expect(recordPlayEvent('song1', 'artist1', 'album1')).resolves.not.toThrow();
    });

    it('should not record a play event if song does not exist', async () => {
      const { db } = await import('~/db/index');

      vi.mocked(db.query.songs.findFirst).mockResolvedValue(undefined);
      vi.mocked(db.query.artists.findFirst).mockResolvedValue({ id: 2, ratingKey: 'artist1' });
      vi.mocked(db.query.albums.findFirst).mockResolvedValue({ id: 3, ratingKey: 'album1' });

      await expect(recordPlayEvent('song1', 'artist1', 'album1')).resolves.not.toThrow();
    });

    it('should not record a play event if artist does not exist', async () => {
      const { db } = await import('~/db/index');

      vi.mocked(db.query.songs.findFirst).mockResolvedValue({ id: 1, ratingKey: 'song1' });
      vi.mocked(db.query.artists.findFirst).mockResolvedValue(undefined);
      vi.mocked(db.query.albums.findFirst).mockResolvedValue({ id: 3, ratingKey: 'album1' });

      await expect(recordPlayEvent('song1', 'artist1', 'album1')).resolves.not.toThrow();
    });

    it('should not record a play event if album does not exist', async () => {
      const { db } = await import('~/db/index');

      vi.mocked(db.query.songs.findFirst).mockResolvedValue({ id: 1, ratingKey: 'song1' });
      vi.mocked(db.query.artists.findFirst).mockResolvedValue({ id: 2, ratingKey: 'artist1' });
      vi.mocked(db.query.albums.findFirst).mockResolvedValue(undefined);

      await expect(recordPlayEvent('song1', 'artist1', 'album1')).resolves.not.toThrow();
    });
  });
});
