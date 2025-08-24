/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '~/db/index';
import { songs, artists, albums, playEvents } from '~/db/schema';
import { eq, sql, count } from 'drizzle-orm';

export async function upsertPlexData(type: 'songs' | 'artists' | 'albums', data: any[]) {
  switch (type) {
    case 'songs': {
      for (const item of data) {
        // Check if song already exists
        const existing = await db.query.songs.findFirst({
          where: eq(songs.ratingKey, item.ratingKey)
        });

        // If it doesn't exist, insert it
        if (!existing) {
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

          await db.insert(songs).values(songData);
        }
        // If it exists, do nothing (no-op)
      }
      break;
    }
    case 'artists': {
      for (const item of data) {
        // Check if artist already exists
        const existing = await db.query.artists.findFirst({
          where: eq(artists.ratingKey, item.ratingKey)
        });

        // If it doesn't exist, insert it
        if (!existing) {
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

          await db.insert(artists).values(artistData);
        }
        // If it exists, do nothing (no-op)
      }
      break;
    }
    case 'albums': {
      for (const item of data) {
        // Check if album already exists
        const existing = await db.query.albums.findFirst({
          where: eq(albums.ratingKey, item.ratingKey)
        });

        // If it doesn't exist, insert it
        if (!existing) {
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

          await db.insert(albums).values(albumData);
        }
        // If it exists, do nothing (no-op)
      }
      break;
    }
  }
}

export async function syncStats(itemType: 'songs' | 'artists' | 'albums', ratingKey: string, plexViewCount: number) {
  let dbItem;
  let playEventsCount = 0;

  console.log(`[syncStats] Starting sync for ${itemType} ${ratingKey} with Plex view count: ${plexViewCount}`);

  switch (itemType) {
    case 'songs':
      dbItem = await db.query.songs.findFirst({
        where: eq(songs.ratingKey, ratingKey)
      });
      if (dbItem) {
        // Use the count function properly
        const result = await db.select({ value: count() })
          .from(playEvents)
          .where(eq(playEvents.songId, dbItem.id));
        playEventsCount = Number(result[0]?.value) || 0;
        console.log(`[syncStats] Song ${ratingKey}: DB view count = ${dbItem.viewCount}, Play events count = ${playEventsCount}`);
      }
      break;
    case 'artists':
      dbItem = await db.query.artists.findFirst({
        where: eq(artists.ratingKey, ratingKey)
      });
      if (dbItem) {
        const result = await db.select({ value: count() })
          .from(playEvents)
          .where(eq(playEvents.artistId, dbItem.id));
        playEventsCount = Number(result[0]?.value) || 0;
        console.log(`[syncStats] Artist ${ratingKey}: DB view count = ${dbItem.viewCount}, Play events count = ${playEventsCount}`);
      }
      break;
    case 'albums':
      dbItem = await db.query.albums.findFirst({
        where: eq(albums.ratingKey, ratingKey)
      });
      if (dbItem) {
        const result = await db.select({ value: count() })
          .from(playEvents)
          .where(eq(playEvents.albumId, dbItem.id));
        playEventsCount = Number(result[0]?.value) || 0;
        console.log(`[syncStats] Album ${ratingKey}: DB view count = ${dbItem.viewCount}, Play events count = ${playEventsCount}`);
      }
      break;
  }

  if (!dbItem) {
    throw new Error(`${itemType} with ratingKey ${ratingKey} not found in database`);
  }

  // The correct logic: total plays should equal Plex view count
  // Total plays = DB viewCount + playEvents count
  // If Plex shows more plays than our total, create the difference
  const dbViewCount = dbItem.viewCount || 0;
  const totalPlays = dbViewCount + playEventsCount;
  const playEventsDifference = plexViewCount - totalPlays;

  console.log(`[syncStats] ${itemType} ${ratingKey}: Plex=${plexViewCount}, DB=${dbViewCount}, PlayEvents=${playEventsCount}, Total=${totalPlays}, Difference=${playEventsDifference}`);

  // If Plex has more plays than our total, create new play events
  if (playEventsDifference > 0 && itemType === 'songs') {
    console.log(`[syncStats] Creating ${playEventsDifference} new play events for ${itemType} ${ratingKey}`);

    // For songs, we need to create play events with all required IDs
    if (itemType === 'songs') {
      const song = await db.query.songs.findFirst({
        where: eq(songs.ratingKey, ratingKey)
      });

      if (!song) {
        throw new Error(`Song with ratingKey ${ratingKey} not found in database`);
      }

      // Get artist and album for this song
      const artist = song.grandparentRatingKey
        ? await db.query.artists.findFirst({
            where: eq(artists.ratingKey, song.grandparentRatingKey)
          })
        : null;

      const album = song.parentRatingKey
        ? await db.query.albums.findFirst({
            where: eq(albums.ratingKey, song.parentRatingKey)
          })
        : null;

      if (!artist || !album) {
        const missing = [];
        if (!artist) missing.push('artist');
        if (!album) missing.push('album');
        const errorMsg = `Cannot create play events: missing ${missing.join(' or ')} for song ${ratingKey}`;
        console.error(`[syncStats] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      console.log(`[syncStats] Found artist ${artist.title} (ID: ${artist.id}) and album ${album.title} (ID: ${album.id}) for song`);

      // Create the missing play events
      const newPlayEvents: Array<{
        songId: number;
        artistId: number;
        albumId: number;
        playedAt: Date;
      }> = [];

      for (let i = 0; i < playEventsDifference; i++) {
        newPlayEvents.push({
          songId: song.id,
          artistId: artist.id,
          albumId: album.id,
          playedAt: new Date() // Default to now, as we don't have exact timestamps
        });
      }

      if (newPlayEvents.length > 0) {
        console.log(`[syncStats] Inserting ${newPlayEvents.length} play events for song ${song.title}`);
        await db.insert(playEvents).values(newPlayEvents);
        console.log(`[syncStats] Successfully created ${newPlayEvents.length} play events`);
      }
    }

  } else if (playEventsDifference > 0) {
    // For artists and albums, we don't create play events directly
    console.log(`[syncStats] ${itemType} ${ratingKey}: Not creating play events for ${itemType} type`);
  } else if (playEventsDifference < 0) {
    console.warn(`[syncStats] Warning: ${itemType} ${ratingKey} has more total plays (${totalPlays}) than Plex shows (${plexViewCount}). This suggests data inconsistency.`);
  } else {
    console.log(`[syncStats] ${itemType} ${ratingKey} is already in sync`);
  }

  const playEventsCreated = (itemType === 'songs' && playEventsDifference > 0) ? playEventsDifference : 0;

  return {
    itemType,
    ratingKey,
    plexViewCount,
    dbViewCount,
    playEventsCount,
    playEventsCreated
  };
}

export async function getTableStats() {
  const [songsCount, artistsCount, albumsCount, playEventsCount] = await Promise.all([
    db.select({ count: count() }).from(songs),
    db.select({ count: count() }).from(artists),
    db.select({ count: count() }).from(albums),
    db.select({ count: count() }).from(playEvents),
  ]);

  return {
    songs: songsCount[0].count,
    artists: artistsCount[0].count,
    albums: albumsCount[0].count,
    playEvents: playEventsCount[0].count,
  };
}

export async function validateDatabaseIntegrity() {
  const issues: string[] = [];

  // Check for songs with missing references
  const songsWithoutArtists = await db
    .select({ count: count() })
    .from(songs)
    .leftJoin(artists, eq(songs.grandparentRatingKey, artists.ratingKey))
    .where(sql`${artists.id} IS NULL`);

  if (songsWithoutArtists[0].count > 0) {
    issues.push(`${songsWithoutArtists[0].count} songs reference non-existent artists`);
  }

  const songsWithoutAlbums = await db
    .select({ count: count() })
    .from(songs)
    .leftJoin(albums, eq(songs.parentRatingKey, albums.ratingKey))
    .where(sql`${albums.id} IS NULL`);

  if (songsWithoutAlbums[0].count > 0) {
    issues.push(`${songsWithoutAlbums[0].count} songs reference non-existent albums`);
  }

  // Check for albums with missing artists
  const albumsWithoutArtists = await db
    .select({ count: count() })
    .from(albums)
    .leftJoin(artists, eq(albums.parentRatingKey, artists.ratingKey))
    .where(sql`${artists.id} IS NULL`);

  if (albumsWithoutArtists[0].count > 0) {
    issues.push(`${albumsWithoutArtists[0].count} albums reference non-existent artists`);
  }

  // Check for orphaned play events
  const orphanedPlayEvents = await db
    .select({ count: count() })
    .from(playEvents)
    .leftJoin(songs, eq(playEvents.songId, songs.id))
    .leftJoin(artists, eq(playEvents.artistId, artists.id))
    .leftJoin(albums, eq(playEvents.albumId, albums.id))
    .where(
      sql`${songs.id} IS NULL OR ${artists.id} IS NULL OR ${albums.id} IS NULL`
    );

  if (orphanedPlayEvents[0].count > 0) {
    issues.push(`${orphanedPlayEvents[0].count} play events reference non-existent records`);
  }

  return issues;
}

export async function findPotentialDuplicates() {
  // Find potential duplicate artists (case-insensitive title comparison)
  const duplicateArtists = await db
    .select({
      title: artists.title,
      count: count(),
      ids: sql<string>`array_agg(${artists.id})`,
      ratingKeys: sql<string>`array_agg(${artists.ratingKey})`
    })
    .from(artists)
    .groupBy(sql`LOWER(TRIM(${artists.title}))`)
    .having(sql`count(*) > 1`);

  // Find potential duplicate albums (same title and artist)
  const duplicateAlbums = await db
    .select({
      title: albums.title,
      parentTitle: albums.parentTitle,
      count: count(),
      ids: sql<string>`array_agg(${albums.id})`,
      ratingKeys: sql<string>`array_agg(${albums.ratingKey})`
    })
    .from(albums)
    .groupBy(sql`LOWER(TRIM(${albums.title})), ${albums.parentRatingKey}`)
    .having(sql`count(*) > 1`);

  // Find potential duplicate songs (same title, artist, and album)
  const duplicateSongs = await db
    .select({
      title: songs.title,
      artistTitle: songs.grandparentTitle,
      albumTitle: songs.parentTitle,
      count: count(),
      ids: sql<string>`array_agg(${songs.id})`,
      ratingKeys: sql<string>`array_agg(${songs.ratingKey})`
    })
    .from(songs)
    .groupBy(sql`LOWER(TRIM(${songs.title})), ${songs.grandparentRatingKey}, ${songs.parentRatingKey}`)
    .having(sql`count(*) > 1`);

  return {
    artists: duplicateArtists,
    albums: duplicateAlbums,
    songs: duplicateSongs
  };
}
