import { db } from '~/db/index';
import { songs, artists, albums, playEvents } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { Artist, Song } from '~/types';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Helper to upsert songs, artists, or albums
export async function upsertPlexData(type: 'songs' | 'artists' | 'albums', data: any[]) {
  switch (type) {
    case 'songs': {
      // Deduplicate songs by ratingKey
      const uniqueSongs = data.reduce((acc, item) => {
        acc[item.ratingKey] = item;
        return acc;
      }, {} as Record<string, any>);

      for (const item of Object.values(uniqueSongs) as Song[]) {
        // Check if song already exists
        const existing = await db.query.songs.findFirst({
          where: eq(songs.ratingKey, item.ratingKey)
        });

        const songData = {
          ratingKey: item.ratingKey,
          title: item.title,
          grandparentTitle: item.grandparentTitle,
          parentTitle: item.parentTitle,
          albumArt: item.albumArt,
          duration: item.duration,
          key: item.key,
          parentRatingKey: item.parentRatingKey,
          grandparentRatingKey: item.grandparentRatingKey,
          viewCount: item.viewCount,
          lastViewedAt: item.lastViewedAt,
          thumb: item.thumb,
          art: item.art ?? null,
          parentThumb: item.parentThumb,
          grandparentThumb: item.grandparentThumb ?? null,
          addedAt: item.addedAt,
          updatedAt: item.updatedAt,
          userRating: item.userRating,
        };

        if (existing) {
          // Update existing song
          await db.update(songs)
            .set(songData)
            .where(eq(songs.ratingKey, item.ratingKey));
        } else {
          // Insert new song
          await db.insert(songs).values(songData);
        }
      }
      break;
    }
    case 'artists': {
      // Deduplicate artists by ratingKey
      const uniqueArtists = data.reduce((acc, item) => {
        acc[item.ratingKey] = item;
        return acc;
      }, {} as Record<string, any>);

      for (const item of Object.values(uniqueArtists) as Artist[]) {
        // Check if artist already exists
        const existing = await db.query.artists.findFirst({
          where: eq(artists.ratingKey, item.ratingKey)
        });

        const artistData = {
          ratingKey: item.ratingKey,
          guid: item.guid,
          type: item.type,
          title: item.title,
          summary: item.summary,
          viewCount: item.viewCount,
          thumb: item.thumb,
          art: item.art ?? null,
          addedAt: item.addedAt,
          updatedAt: item.updatedAt,
        };

        if (existing) {
          // Update existing artist
          await db.update(artists)
            .set(artistData)
            .where(eq(artists.ratingKey, item.ratingKey));
        } else {
          // Insert new artist
          await db.insert(artists).values(artistData);
        }
      }
      break;
    }
    case 'albums': {
      for (const item of data) {
        // Check if album already exists
        const existing = await db.query.albums.findFirst({
          where: eq(albums.ratingKey, item.ratingKey)
        });

        const albumData = {
          ratingKey: item.ratingKey,
          key: item.key,
          parentRatingKey: item.parentRatingKey,
          guid: item.guid,
          parentGuid: item.parentGuid,
          type: item.type,
          title: item.title,
          parentTitle: item.parentTitle,
          summary: item.summary,
          index: item.index,
          viewCount: item.viewCount,
          year: item.year,
          thumb: item.thumb,
          art: item.art ?? null,
          parentThumb: item.parentThumb,
          addedAt: item.addedAt,
          updatedAt: item.updatedAt,
        };

        if (existing) {
          // Update existing album
          await db.update(albums)
            .set(albumData)
            .where(eq(albums.ratingKey, item.ratingKey));
        } else {
          // Insert new album
          await db.insert(albums).values(albumData);
        }
      }
      break;
    }
  }
}

// Helper to record a play event
export async function recordPlayEvent(songRatingKey: string, artistRatingKey: string, albumRatingKey: string) {
  const song = await db.query.songs.findFirst({ where: eq(songs.ratingKey, songRatingKey) });
  const artist = await db.query.artists.findFirst({ where: eq(artists.ratingKey, artistRatingKey) });
  const album = await db.query.albums.findFirst({ where: eq(albums.ratingKey, albumRatingKey) });

  if (song && artist && album) {
    await db.insert(playEvents).values({
      songId: song.id,
      artistId: artist.id,
      albumId: album.id,
    });
  } else {
    console.warn('Could not record play event: song, artist, or album not found in DB.', { songRatingKey, artistRatingKey, albumRatingKey });
  }
}
