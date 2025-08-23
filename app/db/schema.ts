import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const songs = pgTable('songs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  grandparentTitle: text('grandparent_title'), // Artist
  parentTitle: text('parent_title'), // Album
  albumArt: text('album_art'),
  duration: integer('duration'),
  ratingKey: text('rating_key').notNull(),
  key: text('key').notNull(),
  parentRatingKey: text('parent_rating_key'),
  grandparentRatingKey: text('grandparent_rating_key'),
  viewCount: integer('view_count'),
  lastViewedAt: integer('last_viewed_at'),
  thumb: text('thumb'),
  art: text('art'),
  parentThumb: text('parent_thumb'),
  grandparentThumb: text('grandparent_thumb'),
  addedAt: integer('added_at'),
  updatedAt: integer('updated_at'),
  userRating: integer('user_rating'),
});

export const artists = pgTable('artists', {
  id: serial('id').primaryKey(),
  ratingKey: text('rating_key').notNull().unique(),
  guid: text('guid'),
  type: text('type'),
  title: text('title').notNull(),
  summary: text('summary'),
  viewCount: integer('view_count'),
  thumb: text('thumb'),
  art: text('art'),
  addedAt: integer('added_at'),
  updatedAt: integer('updated_at'),
});

export const albums = pgTable('albums', {
  id: serial('id').primaryKey(),
  ratingKey: text('rating_key').notNull(),
  key: text('key').notNull(),
  parentRatingKey: text('parent_rating_key'),
  guid: text('guid'),
  parentGuid: text('parent_guid'),
  type: text('type'),
  title: text('title').notNull(),
  parentTitle: text('parent_title'),
  summary: text('summary'),
  index: integer('index'),
  viewCount: integer('view_count'),
  year: integer('year'),
  thumb: text('thumb'),
  art: text('art'),
  parentThumb: text('parent_thumb'),
  addedAt: integer('added_at'),
  updatedAt: integer('updated_at'),
});

export const playEvents = pgTable('play_events', {
  id: serial('id').primaryKey(),
  songId: integer('song_id').references(() => songs.id).notNull(),
  artistId: integer('artist_id').references(() => artists.id).notNull(),
  albumId: integer('album_id').references(() => albums.id).notNull(),
  playedAt: timestamp('played_at').notNull().defaultNow(),
});

export const songsRelations = relations(songs, ({ many }) => ({
  playEvents: many(playEvents),
}));

export const artistsRelations = relations(artists, ({ many }) => ({
  playEvents: many(playEvents),
}));

export const albumsRelations = relations(albums, ({ many }) => ({
  playEvents: many(playEvents),
}));

export const playEventsRelations = relations(playEvents, ({ one }) => ({
  song: one(songs, {
    fields: [playEvents.songId],
    references: [songs.id],
  }),
  artist: one(artists, {
    fields: [playEvents.artistId],
    references: [artists.id],
  }),
  album: one(albums, {
    fields: [playEvents.albumId],
    references: [albums.id],
  }),
}));
