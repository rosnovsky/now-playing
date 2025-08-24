import { json } from "@remix-run/node";
import { db } from "~/db/index";
import { songs, artists, albums, playEvents } from "~/db/schema";
import { eq, sql, or, isNull } from "drizzle-orm";

interface CleanupResult {
  duplicatesSong: number;
  duplicatesArtist: number;
  duplicatesAlbum: number;
  orphanedPlayEvents: number;
  inconsistencies: string[];
  totalRecordsProcessed: number;
  executionTime: number;
}

interface WorkerState {
  isRunning: boolean;
  progress: {
    phase: 'idle' | 'initializing' | 'songs' | 'artists' | 'albums' | 'orphans' | 'consistency' | 'completed' | 'error';
    current: number;
    total: number;
    message: string;
  };
  result?: CleanupResult;
  error?: string;
  startTime?: number;
}

// Global worker state
let workerState: WorkerState = {
  isRunning: false,
  progress: {
    phase: 'idle',
    current: 0,
    total: 0,
    message: 'Ready to start cleanup'
  }
};

// const WORKER_CONFIG = {
//   requestTimeout: 30000, // 30 seconds for API requests
//   chunkSize: 100, // Process items in chunks
//   retryAttempts: 3,
//   retryDelay: 1000,
//   logErrors: true
// };

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  try {
    switch (action) {
      case 'status':
        return json(await getWorkerStatus());
      case 'stop':
        return json(await stopWorker());
      default:
        return json(await getWorkerStatus());
    }
  } catch (error) {
    console.error('Cleanup API error:', error);
    return json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function action({ request }: { request: Request }) {
  const url = new URL(request.url);
  const start = url.searchParams.get('start') === 'true';

  if (start) {
    return json(await startWorker());
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

async function getWorkerStatus() {
  return {
    success: true,
    isRunning: workerState.isRunning,
    progress: workerState.progress,
    result: workerState.result,
    error: workerState.error
  };
}

async function stopWorker() {
  if (!workerState.isRunning) {
    return {
      success: false,
      message: "Worker is not running"
    };
  }

  workerState.isRunning = false;
  workerState.progress = {
    phase: 'idle',
    current: 0,
    total: 0,
    message: 'Cleanup stopped by user'
  };

  console.log('Cleanup worker stopped by user');

  return {
    success: true,
    message: "Worker stopped successfully"
  };
}

async function startWorker() {
  if (workerState.isRunning) {
    return {
      success: false,
      message: "Cleanup worker is already running"
    };
  }

  // Reset state
  workerState = {
    isRunning: true,
    progress: {
      phase: 'initializing',
      current: 0,
      total: 0,
      message: 'Starting database cleanup...'
    },
    startTime: Date.now()
  };

  // Start the worker in the background
  runWorker().catch(error => {
    console.error('Worker error:', error);
    workerState.isRunning = false;
    workerState.progress.phase = 'error';
    workerState.error = error instanceof Error ? error.message : String(error);
  });

  return {
    success: true,
    message: "Cleanup worker started",
    progress: workerState.progress
  };
}

async function runWorker() {
  const startTime = Date.now();

  try {
    console.log("Starting database cleanup process...");

    // Update progress
    workerState.progress = {
      phase: 'initializing',
      current: 0,
      total: 5, // 5 phases: songs, artists, albums, orphans, consistency
      message: 'Initializing cleanup process...'
    };

    // Get initial counts
    const initialCounts = {
      songs: await db.select({ count: sql<number>`count(*)` }).from(songs),
      artists: await db.select({ count: sql<number>`count(*)` }).from(artists),
      albums: await db.select({ count: sql<number>`count(*)` }).from(albums),
      playEvents: await db.select({ count: sql<number>`count(*)` }).from(playEvents),
    };

    console.log("Initial counts:", {
      songs: initialCounts.songs[0].count,
      artists: initialCounts.artists[0].count,
      albums: initialCounts.albums[0].count,
      playEvents: initialCounts.playEvents[0].count,
    });

    // Phase 1: Deduplicate songs
    if (!workerState.isRunning) return;
    workerState.progress = {
      phase: 'songs',
      current: 1,
      total: 5,
      message: 'Deduplicating songs...'
    };
    const duplicatesSong = await deduplicateSongs();
    console.log(`Processed ${duplicatesSong} duplicate songs`);

    // Phase 2: Deduplicate artists
    if (!workerState.isRunning) return;
    workerState.progress = {
      phase: 'artists',
      current: 2,
      total: 5,
      message: 'Deduplicating artists...'
    };
    const duplicatesArtist = await deduplicateArtists();
    console.log(`Processed ${duplicatesArtist} duplicate artists`);

    // Phase 3: Deduplicate albums
    if (!workerState.isRunning) return;
    workerState.progress = {
      phase: 'albums',
      current: 3,
      total: 5,
      message: 'Deduplicating albums...'
    };
    const duplicatesAlbum = await deduplicateAlbums();
    console.log(`Processed ${duplicatesAlbum} duplicate albums`);

    // Phase 4: Clean up orphaned play events
    if (!workerState.isRunning) return;
    workerState.progress = {
      phase: 'orphans',
      current: 4,
      total: 5,
      message: 'Cleaning up orphaned play events...'
    };
    const orphanedPlayEvents = await cleanupOrphanedPlayEvents();
    console.log(`Cleaned up ${orphanedPlayEvents} orphaned play events`);

    // Phase 5: Check for inconsistencies
    if (!workerState.isRunning) return;
    workerState.progress = {
      phase: 'consistency',
      current: 5,
      total: 5,
      message: 'Checking for inconsistencies...'
    };
    const inconsistencies = await findInconsistencies();
    console.log(`Found ${inconsistencies.length} inconsistencies`);

    // Get final counts
    const finalCounts = {
      songs: await db.select({ count: sql<number>`count(*)` }).from(songs),
      artists: await db.select({ count: sql<number>`count(*)` }).from(artists),
      albums: await db.select({ count: sql<number>`count(*)` }).from(albums),
      playEvents: await db.select({ count: sql<number>`count(*)` }).from(playEvents),
    };

    const totalRecordsProcessed = duplicatesSong + duplicatesArtist + duplicatesAlbum + orphanedPlayEvents;
    const executionTime = Date.now() - startTime;

    const result: CleanupResult = {
      duplicatesSong,
      duplicatesArtist,
      duplicatesAlbum,
      orphanedPlayEvents,
      inconsistencies,
      totalRecordsProcessed,
      executionTime,
    };

    // Update worker state
    workerState.isRunning = false;
    workerState.progress = {
      phase: 'completed',
      current: 5,
      total: 5,
      message: `Cleanup completed successfully! Processed ${totalRecordsProcessed} records in ${executionTime}ms`
    };
    workerState.result = result;

    console.log("Cleanup completed:", result);
    console.log("Final counts:", {
      songs: finalCounts.songs[0].count,
      artists: finalCounts.artists[0].count,
      albums: finalCounts.albums[0].count,
      playEvents: finalCounts.playEvents[0].count,
    });

  } catch (error) {
    console.error("Error during cleanup:", error);
    workerState.isRunning = false;
    workerState.progress.phase = 'error';
    workerState.error = error instanceof Error ? error.message : String(error);
    throw error;
  }
}

// Helper function to normalize names for comparison
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Remove common punctuation that might vary
    .replace(/[!?.,;:'"\-_\s]+/g, ' ')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    .trim()
    // Remove common words that might be inconsistent
    .replace(/\b(the|a|an)\b/g, '')
    .trim();
}

// Helper function to check if two titles are similar enough to be duplicates
function areNamesEquivalent(name1: string, name2: string): boolean {
  const normalized1 = normalizeTitle(name1);
  const normalized2 = normalizeTitle(name2);

  // Direct match after normalization
  if (normalized1 === normalized2) {
    return true;
  }

  // Check for common abbreviations and variations
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
}

async function deduplicateArtists(): Promise<number> {
  const allArtists = await db.select().from(artists);
  const duplicatesFound = new Set<number>();
  let duplicatesProcessed = 0;

  for (let i = 0; i < allArtists.length; i++) {
    if (!workerState.isRunning) break;
    if (duplicatesFound.has(allArtists[i].id)) continue;

    const currentArtist = allArtists[i];
    const duplicates = [];

    for (let j = i + 1; j < allArtists.length; j++) {
      if (duplicatesFound.has(allArtists[j].id)) continue;

      if (areNamesEquivalent(currentArtist.title, allArtists[j].title)) {
        duplicates.push(allArtists[j]);
        duplicatesFound.add(allArtists[j].id);
      }
    }

    if (duplicates.length > 0) {
      // Keep the artist with the most view count as the master
      const allVersions = [currentArtist, ...duplicates];
      const master = allVersions.reduce((prev, current) =>
        (current.viewCount || 0) > (prev.viewCount || 0) ? current : prev
      );

      const toMerge = allVersions.filter(a => a.id !== master.id);

      // Update all play events to point to the master
      for (const duplicate of toMerge) {
        await db.update(playEvents)
          .set({ artistId: master.id })
          .where(eq(playEvents.artistId, duplicate.id));

        // Update songs that reference this artist
        await db.update(songs)
          .set({ grandparentRatingKey: master.ratingKey })
          .where(eq(songs.grandparentRatingKey, duplicate.ratingKey));

        // Update albums that reference this artist
        await db.update(albums)
          .set({ parentRatingKey: master.ratingKey })
          .where(eq(albums.parentRatingKey, duplicate.ratingKey));

        // Delete the duplicate
        await db.delete(artists).where(eq(artists.id, duplicate.id));
        duplicatesProcessed++;
      }
    }
  }

  return duplicatesProcessed;
}

async function deduplicateAlbums(): Promise<number> {
  const allAlbums = await db.select().from(albums);
  const duplicatesFound = new Set<number>();
  let duplicatesProcessed = 0;

  for (let i = 0; i < allAlbums.length; i++) {
    if (!workerState.isRunning) break;
    if (duplicatesFound.has(allAlbums[i].id)) continue;

    const currentAlbum = allAlbums[i];
    const duplicates = [];

    for (let j = i + 1; j < allAlbums.length; j++) {
      if (duplicatesFound.has(allAlbums[j].id)) continue;

      // Albums are duplicates if they have the same title and same parent artist
      if (areNamesEquivalent(currentAlbum.title, allAlbums[j].title) &&
          currentAlbum.parentRatingKey === allAlbums[j].parentRatingKey) {
        duplicates.push(allAlbums[j]);
        duplicatesFound.add(allAlbums[j].id);
      }
    }

    if (duplicates.length > 0) {
      // Keep the album with the most view count as the master
      const allVersions = [currentAlbum, ...duplicates];
      const master = allVersions.reduce((prev, current) =>
        (current.viewCount || 0) > (prev.viewCount || 0) ? current : prev
      );

      const toMerge = allVersions.filter(a => a.id !== master.id);

      // Update all play events to point to the master
      for (const duplicate of toMerge) {
        await db.update(playEvents)
          .set({ albumId: master.id })
          .where(eq(playEvents.albumId, duplicate.id));

        // Update songs that reference this album
        await db.update(songs)
          .set({ parentRatingKey: master.ratingKey })
          .where(eq(songs.parentRatingKey, duplicate.ratingKey));

        // Delete the duplicate
        await db.delete(albums).where(eq(albums.id, duplicate.id));
        duplicatesProcessed++;
      }
    }
  }

  return duplicatesProcessed;
}

async function deduplicateSongs(): Promise<number> {
  const allSongs = await db.select().from(songs);
  const duplicatesFound = new Set<number>();
  let duplicatesProcessed = 0;

  for (let i = 0; i < allSongs.length; i++) {
    if (!workerState.isRunning) break;
    if (duplicatesFound.has(allSongs[i].id)) continue;

    const currentSong = allSongs[i];
    const duplicates = [];

    for (let j = i + 1; j < allSongs.length; j++) {
      if (duplicatesFound.has(allSongs[j].id)) continue;

      // Songs are duplicates if they have the same title, artist, and album
      if (areNamesEquivalent(currentSong.title, allSongs[j].title) &&
          currentSong.grandparentRatingKey === allSongs[j].grandparentRatingKey &&
          currentSong.parentRatingKey === allSongs[j].parentRatingKey) {
        duplicates.push(allSongs[j]);
        duplicatesFound.add(allSongs[j].id);
      }
    }

    if (duplicates.length > 0) {
      // Keep the song with the most view count as the master
      const allVersions = [currentSong, ...duplicates];
      const master = allVersions.reduce((prev, current) =>
        (current.viewCount || 0) > (prev.viewCount || 0) ? current : prev
      );

      const toMerge = allVersions.filter(s => s.id !== master.id);

      // Update all play events to point to the master
      for (const duplicate of toMerge) {
        await db.update(playEvents)
          .set({ songId: master.id })
          .where(eq(playEvents.songId, duplicate.id));

        // Delete the duplicate
        await db.delete(songs).where(eq(songs.id, duplicate.id));
        duplicatesProcessed++;
      }
    }
  }

  return duplicatesProcessed;
}

async function cleanupOrphanedPlayEvents(): Promise<number> {
  // Find play events that reference non-existent songs, artists, or albums
  const orphanedEvents = await db.select({
    id: playEvents.id,
    songId: playEvents.songId,
    artistId: playEvents.artistId,
    albumId: playEvents.albumId
  })
  .from(playEvents)
  .leftJoin(songs, eq(playEvents.songId, songs.id))
  .leftJoin(artists, eq(playEvents.artistId, artists.id))
  .leftJoin(albums, eq(playEvents.albumId, albums.id))
  .where(
    or(
      isNull(songs.id),
      isNull(artists.id),
      isNull(albums.id)
    )
  );

  if (orphanedEvents.length > 0) {
    const orphanedIds = orphanedEvents.map(event => event.id);
    await db.delete(playEvents).where(
      sql`${playEvents.id} IN (${sql.join(orphanedIds, sql`, `)})`
    );
  }

  return orphanedEvents.length;
}

async function findInconsistencies(): Promise<string[]> {
  const inconsistencies: string[] = [];

  // Check for songs without valid artist/album references
  const songsWithMissingRefs = await db.select({
    id: songs.id,
    title: songs.title,
    parentRatingKey: songs.parentRatingKey,
    grandparentRatingKey: songs.grandparentRatingKey
  })
  .from(songs)
  .leftJoin(artists, eq(songs.grandparentRatingKey, artists.ratingKey))
  .leftJoin(albums, eq(songs.parentRatingKey, albums.ratingKey))
  .where(
    or(
      isNull(artists.id),
      isNull(albums.id)
    )
  );

  if (songsWithMissingRefs.length > 0) {
    inconsistencies.push(`Found ${songsWithMissingRefs.length} songs with missing artist or album references`);
  }

  // Check for albums without valid artist references
  const albumsWithMissingArtists = await db.select({
    id: albums.id,
    title: albums.title,
    parentRatingKey: albums.parentRatingKey
  })
  .from(albums)
  .leftJoin(artists, eq(albums.parentRatingKey, artists.ratingKey))
  .where(isNull(artists.id));

  if (albumsWithMissingArtists.length > 0) {
    inconsistencies.push(`Found ${albumsWithMissingArtists.length} albums with missing artist references`);
  }

  // Check for duplicate rating keys (which should be unique)
  const duplicateArtistKeys = await db.select({
    ratingKey: artists.ratingKey,
    count: sql<number>`count(*)`
  })
  .from(artists)
  .groupBy(artists.ratingKey)
  .having(sql`count(*) > 1`);

  if (duplicateArtistKeys.length > 0) {
    inconsistencies.push(`Found ${duplicateArtistKeys.length} duplicate artist rating keys`);
  }

  const duplicateAlbumKeys = await db.select({
    ratingKey: albums.ratingKey,
    count: sql<number>`count(*)`
  })
  .from(albums)
  .groupBy(albums.ratingKey)
  .having(sql`count(*) > 1`);

  if (duplicateAlbumKeys.length > 0) {
    inconsistencies.push(`Found ${duplicateAlbumKeys.length} duplicate album rating keys`);
  }

  const duplicateSongKeys = await db.select({
    ratingKey: songs.ratingKey,
    count: sql<number>`count(*)`
  })
  .from(songs)
  .groupBy(songs.ratingKey)
  .having(sql`count(*) > 1`);

  if (duplicateSongKeys.length > 0) {
    inconsistencies.push(`Found ${duplicateSongKeys.length} duplicate song rating keys`);
  }

  return inconsistencies;
}
