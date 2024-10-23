import { desc, eq } from 'drizzle-orm';
import { db } from '~/db';
import { recordPlay } from '~/db/queries';
import { processingRuns, processingState } from '~/db/schema';

interface ProcessingResult {
  songsProcessed: number;
  startTime: Date;
  endTime: Date;
  error?: string;
  batchesProcessed: number;
  failedSongs: number;
}

export interface ProcessingStatus {
  currentStatus: {
    status: string;
    progress: number;
    startedAt: Date;
    completedAt?: Date;
    duration?: number | null;
    error?: string;
    songsProcessed: number;
  } | null;
  lastSuccessful: {
    completedAt: Date;
    songsProcessed: number;
    duration: number;
  } | null;
  recentRuns: {
    startedAt: Date;
    completedAt?: Date;
    status: string;
    songsProcessed: number;
    duration?: number | null;
    error?: string;
  }[];
  processingState: {
    lastProcessedAt: Date;
    updatedAt: Date;
  } | null;
}

// Helper function to safely convert Unix timestamp to Date
function unixTimestampToDate(timestamp: number | undefined): Date {
  if (!timestamp) return new Date();
  // Plex timestamps are in seconds, JavaScript needs milliseconds
  return new Date(timestamp * 1000);
}

// Helper function to ensure we have a valid Date object
function ensureValidDate(date: Date | null | undefined): Date {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return new Date();
  }
  return date;
}

// Helper function to convert track to songData
function trackToSongData(track: any) {
  return {
    addedAt: unixTimestampToDate(track.addedAt).getTime() / 1000,
    art: track.art,
    duration: track.duration,
    grandparentArt: track.grandparentArt,
    grandparentGuid: track.grandparentGuid,
    grandparentKey: track.grandparentKey,
    grandparentRatingKey: track.grandparentRatingKey,
    grandparentThumb: track.grandparentThumb,
    grandparentTitle: track.grandparentTitle,
    guid: track.guid,
    index: track.index,
    key: track.key,
    librarySectionID: track.librarySectionID,
    librarySectionKey: track.librarySectionKey,
    librarySectionTitle: track.librarySectionTitle,
    parentGuid: track.parentGuid,
    parentIndex: track.parentIndex,
    parentKey: track.parentKey,
    parentRatingKey: track.parentRatingKey,
    parentThumb: track.parentThumb,
    parentTitle: track.parentTitle,
    ratingKey: track.ratingKey,
    sessionKey: '',
    thumb: track.thumb,
    title: track.title,
    type: 'track' as const,
    updatedAt: unixTimestampToDate(track.updatedAt).getTime() / 1000,
    viewOffset: 0,
    User: {
      id: '1',
      thumb: '',
      title: 'System',
    },
    Player: {
      address: '',
      device: '',
      machineIdentifier: '',
      platform: '',
      platformVersion: '',
      product: '',
      profile: '',
      remotePublicAddress: '',
      state: '',
      title: '',
      version: '',
      local: true,
      relayed: false,
      secure: true,
      userID: 1,
    },
    albumArt: track.parentThumb,
    currentTime: 0,
    isPlaying: false,
  };
}

export async function processPlays(forceReprocess: boolean = false): Promise<ProcessingResult> {
  const startTime = new Date();
  let runId: string | undefined;
  let failedSongs = 0;
  let batchesProcessed = 0;

  try {
    // Get last processed time
    const lastProcessed = await db
      .select()
      .from(processingState)
      .limit(1);

    const processingPeriodStart = ensureValidDate(lastProcessed[0]?.lastProcessedAt ?? new Date(0));
    const processingPeriodEnd = new Date();

    // Create processing run record
    const [run] = await db
      .insert(processingRuns)
      .values({
        startedAt: startTime,
        status: 'running',
        processingPeriodStart: processingPeriodStart,
        processingPeriodEnd: processingPeriodEnd,
      })
      .returning();

    runId = run.id;

    // Fetch songs from Plex that were played since last processing
    const response = await fetch(
      `${import.meta.env.VITE_PLEX_SERVER_URL}/library/sections/2/all?` +
      `X-Plex-Token=${import.meta.env.VITE_PLEX_TOKEN}` +
      `&type=10` +
      `&sort=lastViewedAt:desc` +
      (forceReprocess ? '' : `&lastViewedAt>=${Math.floor(processingPeriodStart.getTime() / 1000)}`),
      {
        headers: {
          Accept: 'application/json',
        }
      }
    );

    const data = await response.json();
    const tracks = data.MediaContainer.Metadata ?? [];
    let processedCount = 0;

    // Process tracks in batches
    const batchSize = 50;
    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize);
      const batchStartTime = Date.now();

      // Process batch concurrently
      const batchResults = await Promise.allSettled(
        batch.map(async (track) => {
          try {
            const songData = trackToSongData(track);
            await recordPlay(songData);
            return { success: true, title: track.title };
          } catch (error) {
            return {
              success: false,
              title: track.title,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );

      // Count successes and failures
      const batchSuccesses = batchResults.filter(
        result => result.status === 'fulfilled' && result.value.success
      ).length;
      const batchFailures = batchResults.filter(
        result => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)
      );

      // Log failures
      batchFailures.forEach(failure => {
        if (failure.status === 'rejected') {
          console.error('Failed to process song:', failure.reason);
        } else if (failure.status === 'fulfilled' && !failure.value.success) {
          console.error('Failed to process song:', failure.value.title, failure.value.error);
        }
      });

      processedCount += batchSuccesses;
      failedSongs += batchFailures.length;
      batchesProcessed++;

      // Update processing run record after each batch
      await db
        .update(processingRuns)
        .set({
          songsProcessed: processedCount,
          error: failedSongs > 0 ? `Failed to process ${failedSongs} songs` : undefined
        })
        .where(eq(processingRuns.id, runId));

      const batchDuration = Date.now() - batchStartTime;
      console.log(`Batch ${batchesProcessed} completed: ${batchSuccesses} successes, ${batchFailures.length} failures, duration: ${batchDuration}ms`);
    }

    const endTime = new Date();

    // Update processing state
    if (processedCount > 0) {
      await db
        .insert(processingState)
        .values({
          lastProcessedAt: processingPeriodEnd,
          updatedAt: endTime,
        })
        .onConflictDoUpdate({
          target: processingState.id,
          set: {
            lastProcessedAt: processingPeriodEnd,
            updatedAt: endTime,
          },
        });
    }

    // Update processing run record
    await db
      .update(processingRuns)
      .set({
        completedAt: endTime,
        status: failedSongs > 0 ? 'completed_with_errors' : 'completed',
        songsProcessed: processedCount,
        durationMs: endTime.getTime() - startTime.getTime(),
      })
      .where(eq(processingRuns.id, runId));

    return {
      songsProcessed: processedCount,
      startTime,
      endTime,
      error: failedSongs > 0 ? `Failed to process ${failedSongs} songs` : undefined,
      batchesProcessed,
      failedSongs

    };
  } catch (error) {
    const endTime = new Date();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update processing run record with error
    if (runId) {
      await db
        .update(processingRuns)
        .set({
          completedAt: endTime,
          status: 'failed',
          error: errorMessage,
          durationMs: endTime.getTime() - startTime.getTime(),
        })
        .where(eq(processingRuns.id, runId));
    }

    throw error;
  }
}

export async function getProcessingStatus(): Promise<ProcessingStatus> {
  console.info('Getting processing status');
  const [latestRun] = await db
    .select()
    .from(processingRuns)
    .orderBy(desc(processingRuns.startedAt))
    .limit(1);

  // Get last successful run
  const [lastSuccessful] = await db
    .select()
    .from(processingRuns)
    .where(eq(processingRuns.status, 'completed'))
    .orderBy(desc(processingRuns.completedAt))
    .limit(1);

  // Get recent runs (last 10)
  const recentRuns = await db
    .select()
    .from(processingRuns)
    .orderBy(desc(processingRuns.startedAt))
    .limit(10);

  // Get processing state
  const [currentState] = await db
    .select()
    .from(processingState)
    .limit(1);

  console.log({ currentState, lastSuccessful, recentRuns });

  return {
    currentStatus: latestRun ? {
      status: latestRun.status,
      progress: latestRun.songsProcessed,
      startedAt: latestRun.startedAt,
      completedAt: latestRun.completedAt ?? undefined,
      duration: latestRun.durationMs,
      error: latestRun.error ?? undefined,
      songsProcessed: latestRun.songsProcessed,
    } : null,
    lastSuccessful: lastSuccessful ? {
      completedAt: lastSuccessful.completedAt!,
      songsProcessed: lastSuccessful.songsProcessed,
      duration: lastSuccessful.durationMs!,
    } : null,
    recentRuns: recentRuns.map(run => ({
      startedAt: run.startedAt,
      completedAt: run.completedAt ?? undefined,
      status: run.status,
      songsProcessed: run.songsProcessed,
      duration: run.durationMs,
      error: run.error ?? undefined,
    })),
    processingState: currentState ? {
      lastProcessedAt: currentState.lastProcessedAt,
      updatedAt: currentState.updatedAt,
    } : null,
  };
}
