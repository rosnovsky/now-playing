import { eq, sql } from 'drizzle-orm';
import { db } from '~/db';
import { albums, albumStats, artists, artistStats, playHistory, songs, songStats } from '~/db/schema';

type SongData = {
  addedAt: number;
  art: string;
  duration: number;
  grandparentArt: string;
  grandparentGuid: string;
  grandparentKey: string;
  grandparentRatingKey: string;
  grandparentThumb: string;
  grandparentTitle: string;
  guid: string;
  index: number;
  key: string;
  librarySectionID: string;
  librarySectionKey: string;
  librarySectionTitle: string;
  parentGuid: string;
  parentIndex: number;
  parentKey: string;
  parentRatingKey: string;
  parentThumb: string;
  parentTitle: string;
  ratingKey: string;
  sessionKey: string;
  thumb: string;
  title: string;
  type: 'track';
  updatedAt: number;
  viewOffset: number;
  User: {
    id: string;
    thumb: string;
    title: string;
  };
  Player: {
    address: string;
    device: string;
    machineIdentifier: string;
    platform: string;
    platformVersion: string;
    product: string;
    profile: string;
    remotePublicAddress: string;
    state: string;
    title: string;
    version: string;
    local: boolean;
    relayed: boolean;
    secure: boolean;
    userID: number;
  };
  albumArt: string;
  currentTime: number;
  isPlaying: boolean;
};

export async function recordPlay(songData: SongData) {
  if (!songData.ratingKey || !songData.title || !songData.parentRatingKey || !songData.parentTitle || !songData.grandparentRatingKey || !songData.grandparentTitle) {
    console.error('Missing required song data:', songData);
    throw new Error('Missing required song data');
  }

  return await db.transaction(async (tx) => {
    let artist = await tx.select().from(artists).where(eq(artists.plexId, songData.grandparentRatingKey)).limit(1);
    if (artist.length === 0) {
      const [newArtist] = await tx.insert(artists).values({
        title: songData.grandparentTitle,
        plexId: songData.grandparentRatingKey,
        addedAt: new Date(songData.addedAt * 1000), // Convert from Unix timestamp to Date
        updatedAt: new Date(songData.updatedAt * 1000),
      }).returning();
      artist = [newArtist];
    }

    // Check and create album if not exists
    let album = await tx.select().from(albums).where(eq(albums.plexId, songData.parentRatingKey)).limit(1);
    if (album.length === 0) {
      const [newAlbum] = await tx.insert(albums).values({
        artistId: artist[0].id,
        title: songData.parentTitle,
        artist: songData.grandparentTitle,
        plexId: songData.parentRatingKey,
        addedAt: new Date(songData.addedAt * 1000),
        updatedAt: new Date(songData.updatedAt * 1000),
      }).returning();
      album = [newAlbum];
    }

    // Check and create song if not exists
    let song = await tx.select().from(songs).where(eq(songs.plexId, songData.ratingKey)).limit(1);
    if (song.length === 0) {
      const [newSong] = await tx.insert(songs).values({
        albumId: album[0].id,
        title: songData.title,
        artist: songData.grandparentTitle,
        album: songData.parentTitle,
        plexId: songData.ratingKey,
        addedAt: new Date(songData.addedAt * 1000),
        updatedAt: new Date(songData.updatedAt * 1000),
      }).returning();
      song = [newSong];
    }

    // Record play history
    await tx.insert(playHistory).values({
      songId: song[0].id,
      title: songData.title,
      artist: songData.grandparentTitle,
      album: songData.parentTitle,
      playedAt: new Date(),
    });

    // Update song stats
    await tx.insert(songStats)
      .values({
        songId: song[0].id,
        title: songData.title,
        artist: songData.grandparentTitle,
        album: songData.parentTitle,
        playCount: 1,
        lastPlayedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: songStats.songId,
        set: {
          playCount: sql`${songStats.playCount} + 1`,
          lastPlayedAt: new Date(),
        },
      });

    // Update album stats
    await tx.insert(albumStats)
      .values({
        albumId: album[0].id,
        artist: songData.grandparentTitle,
        title: songData.parentTitle,
        playCount: 1,
        lastPlayedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: albumStats.albumId,
        set: {
          playCount: sql`${albumStats.playCount} + 1`,
          lastPlayedAt: new Date(),
        },
      });

    // Update artist stats
    await tx.insert(artistStats)
      .values({
        artistId: artist[0].id,
        title: songData.grandparentTitle,
        playCount: 1,
        lastPlayedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: artistStats.artistId,
        set: {
          playCount: sql`${artistStats.playCount} + 1`,
          lastPlayedAt: new Date(),
        },
      });

    return song[0];
  });
}
