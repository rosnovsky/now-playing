import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const artists = pgTable('artists', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  addedAt: timestamp('added_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at'),
  plexId: text('plex_id').unique(),
});

export const albums = pgTable('albums', {
  id: uuid('id').defaultRandom().primaryKey(),
  artistId: uuid('artist_id').notNull().references(() => artists.id),
  title: text('title').notNull(),
  artist: text('artist_name').notNull(),  // Denormalized for human readability
  addedAt: timestamp('added_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at'),
  plexId: text('plex_id').unique(),
});

export const songs = pgTable('songs', {
  id: uuid('id').defaultRandom().primaryKey(),
  albumId: uuid('album_id').notNull().references(() => albums.id),
  title: text('title').notNull(),
  artist: text('artist_name').notNull(),  // Denormalized for human readability
  album: text('album_title').notNull(),  // Denormalized for human readability
  addedAt: timestamp('added_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at'),
  plexId: text('plex_id').unique(),
});

export const playHistory = pgTable('play_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  songId: uuid('song_id').notNull().references(() => songs.id),
  title: text('title').notNull(),  // Denormalized for human readability
  artist: text('artist_name').notNull(),  // Denormalized for human readability
  album: text('album_title').notNull(),  // Denormalized for human readability
  playedAt: timestamp('played_at').notNull().defaultNow(),
});

export const songStats = pgTable('song_stats', {
  songId: uuid('song_id').primaryKey().references(() => songs.id),
  title: text('title').notNull(),  // Denormalized for human readability
  artist: text('artist_name').notNull(),  // Denormalized for human readability
  album: text('album_title').notNull(),  // Denormalized for human readability
  playCount: integer('play_count').notNull().default(0),
  lastPlayedAt: timestamp('last_played_at'),
});

export const albumStats = pgTable('album_stats', {
  albumId: uuid('album_id').primaryKey().references(() => albums.id),
  title: text('title').notNull(),  // Denormalized for human readability
  artist: text('artist_name').notNull(),  // Denormalized for human readability
  playCount: integer('play_count').notNull().default(0),
  lastPlayedAt: timestamp('last_played_at'),
});

export const artistStats = pgTable('artist_stats', {
  artistId: uuid('artist_id').primaryKey().references(() => artists.id),
  title: text('title').notNull(),  // Denormalized for human readability
  playCount: integer('play_count').notNull().default(0),
  lastPlayedAt: timestamp('last_played_at'),
});

export const processingState = pgTable('processing_state', {
  id: uuid('id').defaultRandom().primaryKey(),
  lastProcessedAt: timestamp('last_processed_at').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const processingRuns = pgTable('processing_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
  status: text('status').notNull(), // 'running', 'completed', 'failed'
  songsProcessed: integer('songs_processed').notNull().default(0),
  error: text('error'),
  durationMs: integer('duration_ms'),
  processingPeriodStart: timestamp('processing_period_start').notNull(),
  processingPeriodEnd: timestamp('processing_period_end').notNull(),
});
