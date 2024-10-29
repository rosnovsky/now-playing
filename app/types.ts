import { z } from "zod";

const thumbSchema = z.string();

const mediaSchema = z.object({
  id: z.string(), // Changed from number to string
  duration: z.number().int().positive(),
  bitrate: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  aspectRatio: z.number().positive(),
  audioChannels: z.number().int().positive(),
  audioCodec: z.string(),
  videoCodec: z.string(),
  videoResolution: z.string(),
  container: z.string(),
  videoFrameRate: z.string(),
  audioProfile: z.string(),
  videoProfile: z.string(),
}).partial();

const currentMusicSchema = z.object({
  title: z.string(),
  grandparentTitle: z.string(), // Artist
  parentTitle: z.string(), // Album
  albumArt: thumbSchema,
  currentTime: z.number().int().nonnegative(),
  duration: z.number().int().positive(),
  isPlaying: z.boolean(),
  Media: z.array(mediaSchema).optional(),
}).partial();

const currentMusicResponseSchema = z.object({
  currentMusic: currentMusicSchema.nullable(),
  isPlaying: z.boolean(),
});

export type CurrentMusic = z.infer<typeof currentMusicSchema>;
export type CurrentMusicResponse = z.infer<typeof currentMusicResponseSchema>;

export { currentMusicResponseSchema, currentMusicSchema };

export const songSchema = z.object({
  ratingKey: z.string(),
  key: z.string(),
  parentRatingKey: z.string(),
  grandparentRatingKey: z.string(),
  guid: z.string(),
  parentGuid: z.string(),
  grandparentGuid: z.string(),
  type: z.literal('track'),
  title: z.string(),
  grandparentTitle: z.string(),
  parentTitle: z.string(),
  summary: z.string().optional(),
  index: z.number().optional(),
  parentIndex: z.number(),
  viewCount: z.number().optional(),
  lastViewedAt: z.number().optional(),
  parentYear: z.number().optional(),
  thumb: z.string(),
  art: z.string().optional(),
  parentThumb: z.string(),
  grandparentThumb: z.string().optional(),
  duration: z.number(),
  addedAt: z.number(),
  updatedAt: z.number().optional(),
  Media: z.array(z.object({
    id: z.number(),
    duration: z.number(),
    bitrate: z.number().optional(),
    audioChannels: z.number(),
    audioCodec: z.string(),
    container: z.string(),
    Part: z.array(z.object({
      id: z.number(),
      key: z.string(),
      duration: z.number(),
      file: z.string(),
      size: z.number(),
      container: z.string(),
    }))
  })),
  userRating: z.number().optional(),
});

export type Song = z.infer<typeof songSchema>;

export const songsSchema = z.array(songSchema);

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
  updatedAt: z.number().optional(),
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
  index: z.number().optional(),
  viewCount: z.number(),
  year: z.number(),
  thumb: z.string(),
  art: z.string().nullable().optional(),
  parentThumb: z.string(),
  addedAt: z.number(),
  updatedAt: z.number().optional(),
});

export const albumsSchema = z.array(albumSchema);
export type Album = z.infer<typeof albumSchema>;
