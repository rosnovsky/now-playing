import { z } from "zod";

const streamSchema = z.object({
  albumGain: z.string().optional(),
  albumPeak: z.string().optional(),
  albumRange: z.string().optional(),
  audioChannelLayout: z.string(),
  bitDepth: z.number(),
  bitrate: z.number(),
  channels: z.number(),
  codec: z.string(),
  displayTitle: z.string(),
  extendedDisplayTitle: z.string(),
  gain: z.string().optional(),
  id: z.string(),
  index: z.number(),
  loudness: z.string().optional(),
  lra: z.string().optional(),
  peak: z.string().optional(),
  samplingRate: z.number(),
  selected: z.boolean(),
  streamType: z.number(),
});

const mediaPartSchema = z.object({
  container: z.string(),
  duration: z.number(),
  file: z.string(),
  id: z.string(),
  key: z.string(),
  size: z.number(),
  Stream: z.array(streamSchema),
});

const mediaSchema = z.object({
  audioChannels: z.number(),
  audioCodec: z.string(),
  bitrate: z.number(),
  container: z.string(),
  duration: z.number(),
  hasVoiceActivity: z.string(),
  id: z.string(),
  Part: z.array(mediaPartSchema),
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
  ratingKey: z.string(),
  key: z.string(),
  guid: z.string(),
  parentGuid: z.string(),
  grandparentGuid: z.string(),
  type: z.literal('track'),
  title: z.string(),
  grandparentTitle: z.string(),
  parentTitle: z.string(),
  summary: z.string(),
  index: z.number(),
  parentIndex: z.number(),
  userRating: z.string().optional(),
  viewCount: z.number(),
  lastViewedAt: z.number(),
  thumb: z.string(),
  parentThumb: z.string(),
  duration: z.number(),
  addedAt: z.number(),
  Media: z.array(mediaSchema),
  albumArt: z.string(),
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
