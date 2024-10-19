import { z } from "zod";

// Basic schemas
const guidSchema = z.string();
const thumbSchema = z.string();
const ratingKeySchema = z.string();

// Media schema
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

// Part schema
const partSchema = z.object({
  id: z.string(), // Changed from number to string
  key: z.string(),
  duration: z.number().int().positive(),
  file: z.string(),
  size: z.number().int().positive(),
  audioProfile: z.string(),
  container: z.string(),
  videoProfile: z.string(),
}).partial();

// Stream schema
const streamSchema = z.object({
  id: z.string(), // Changed from number to string
  streamType: z.number().int().nonnegative(),
  default: z.boolean(),
  codec: z.string(),
  index: z.number().int().nonnegative(),
  bitrate: z.number().int().positive(),
  bitDepth: z.number().int().positive().optional(),
  chromaLocation: z.string().optional(),
  chromaSubsampling: z.string().optional(),
  codedHeight: z.number().int().positive().optional(),
  codedWidth: z.number().int().positive().optional(),
  colorPrimaries: z.string().optional(),
  colorRange: z.string().optional(),
  colorSpace: z.string().optional(),
  colorTrc: z.string().optional(),
  frameRate: z.number().positive().optional(),
  hasScalingMatrix: z.boolean().optional(),
  height: z.number().int().positive().optional(),
  level: z.number().int().nonnegative().optional(),
  profile: z.string().optional(),
  refFrames: z.number().int().nonnegative().optional(),
  width: z.number().int().positive().optional(),
  displayTitle: z.string(),
  extendedDisplayTitle: z.string(),
  selected: z.boolean(),
  channels: z.number().int().positive().optional(),
  language: z.string().optional(),
  languageCode: z.string().optional(),
  audioChannelLayout: z.string().optional(),
  samplingRate: z.number().int().positive().optional(),
}).partial();

// Current Music schema
const currentMusicSchema = z.object({
  addedAt: z.number().int().positive(),
  art: thumbSchema,
  duration: z.number().int().positive(),
  grandparentArt: thumbSchema,
  grandparentGuid: guidSchema,
  grandparentKey: z.string(),
  grandparentRatingKey: ratingKeySchema,
  grandparentThumb: thumbSchema,
  grandparentTitle: z.string(),
  guid: guidSchema,
  index: z.number().int().positive(),
  key: z.string(),
  lastViewedAt: z.number().int().positive().optional(),
  librarySectionID: z.union([z.string(), z.number()]), // Accept both string and number
  librarySectionKey: z.string(),
  librarySectionTitle: z.string(),
  originalTitle: z.string().optional(),
  parentGuid: guidSchema,
  parentIndex: z.number().int().positive(),
  parentKey: z.string(),
  parentRatingKey: ratingKeySchema,
  parentThumb: thumbSchema,
  parentTitle: z.string(),
  ratingKey: ratingKeySchema,
  sessionKey: z.string(),
  summary: z.string(),
  thumb: thumbSchema,
  title: z.string(),
  type: z.literal('track'),
  updatedAt: z.number().int().positive(),
  viewCount: z.number().int().nonnegative().optional(),
  viewOffset: z.number().int().nonnegative(),
  Media: z.array(mediaSchema.extend({
    Part: z.array(partSchema.extend({
      Stream: z.array(streamSchema)
    }))
  })),
  User: z.object({
    id: z.union([z.string(), z.number()]), // Accept both string and number
    thumb: thumbSchema,
    title: z.string()
  }),
  Player: z.object({
    address: z.string(),
    device: z.string(),
    machineIdentifier: z.string(),
    model: z.string().optional(), // Made optional
    platform: z.string(),
    platformVersion: z.string(),
    product: z.string(),
    profile: z.string(),
    remotePublicAddress: z.string(),
    state: z.string(),
    title: z.string(),
    version: z.string(),
    local: z.boolean(),
    relayed: z.boolean(),
    secure: z.boolean(),
    userID: z.number().int().positive(),
  }),
  // Fields added in the API
  albumArt: thumbSchema,
  currentTime: z.number().int().nonnegative(),
  isPlaying: z.boolean(),
}).partial();

// Response schema
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
  index: z.number(),
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
  updatedAt: z.number(),
  Media: z.array(z.object({
    id: z.number(),
    duration: z.number(),
    bitrate: z.number(),
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
      // Add other relevant fields
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
