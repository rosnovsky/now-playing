import { z } from "zod";

const mediaPartSchema = z.object({
  id: z.number(),
  key: z.string(),
  duration: z.number(),
  file: z.string(),
  size: z.number(),
  container: z.string(),
  hasThumbnail: z.string().optional(),
});

const mediaSchema = z.object({
  id: z.number(),
  duration: z.number(),
  bitrate: z.number(),
  audioChannels: z.number(),
  audioCodec: z.string(),
  container: z.string(),
  hasVoiceActivity: z.boolean(),
  Part: z.array(mediaPartSchema).optional(),
});

const songSchema = z.object({
  ratingKey: z.string(),
  key: z.string(),
  parentRatingKey: z.string(),
  grandparentRatingKey: z.string(),
  guid: z.string(),
  parentGuid: z.string(),
  grandparentGuid: z.string(),
  parentStudio: z.string().optional(),
  type: z.literal('track'),
  title: z.string(),
  grandparentKey: z.string().optional(),
  parentKey: z.string().optional(),
  grandparentTitle: z.string(),
  parentTitle: z.string(),
  summary: z.string(),
  index: z.number().optional(),
  parentIndex: z.number(),
  ratingCount: z.number().optional(),
  userRating: z.number().optional(),
  viewCount: z.number().default(0),
  skipCount: z.number().optional(),
  lastViewedAt: z.number().optional(),
  lastRatedAt: z.number().optional(),
  parentYear: z.number().optional(),
  thumb: z.string(),
  art: z.string().optional(),
  parentThumb: z.string(),
  grandparentThumb: z.string().optional(),
  grandparentArt: z.string().optional(),
  duration: z.number(),
  addedAt: z.number(),
  updatedAt: z.number().optional(),
  Media: z.array(mediaSchema).optional()
});

export const songsSchema = z.array(songSchema);
export type Song = z.infer<typeof songSchema>;

export const currentMusicSchema = z.object({
  title: z.string(),
  artist: z.string(),
  album: z.string(),
  albumArt: z.string(),
  duration: z.number(),
  currentTime: z.number(),
  isPlaying: z.boolean(),
});

export type CurrentMusic = z.infer<typeof currentMusicSchema>;

const artistSchema = z.object({
  ratingKey: z.string(),
  guid: z.string(),
  type: z.literal('artist'),
  title: z.string(),
  summary: z.string(),
  viewCount: z.number(),
  thumb: z.string(),
  art: z.string().nullable().optional(),
  addedAt: z.number(),
  updatedAt: z.number(),
});

export const artistsSchema = z.array(artistSchema);
export type Artist = z.infer<typeof artistSchema>;

const albumSchema = z.object({
  ratingKey: z.string(),
  key: z.string(),
  parentRatingKey: z.string(),
  guid: z.string(),
  parentGuid: z.string(),
  type: z.literal('album'),
  title: z.string(),
  parentTitle: z.string(),
  summary: z.string(),
  index: z.number(),
  viewCount: z.number(),
  year: z.number(),
  thumb: z.string(),
  art: z.string().nullable().optional(),
  parentThumb: z.string(),
  addedAt: z.number(),
  updatedAt: z.number(),
});

export const albumsSchema = z.array(albumSchema);
export type Album = z.infer<typeof albumSchema>;
