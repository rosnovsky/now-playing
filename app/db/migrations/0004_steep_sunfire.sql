ALTER TABLE "album_stats" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "album_stats" ADD COLUMN "artist_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "albums" ADD COLUMN "artist_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "artist_stats" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "play_history" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "play_history" ADD COLUMN "artist_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "play_history" ADD COLUMN "album_title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "song_stats" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "song_stats" ADD COLUMN "artist_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "song_stats" ADD COLUMN "album_title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "artist_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "album_title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "albums" DROP COLUMN IF EXISTS "year";--> statement-breakpoint
ALTER TABLE "albums" DROP COLUMN IF EXISTS "thumb";--> statement-breakpoint
ALTER TABLE "albums" DROP COLUMN IF EXISTS "art";--> statement-breakpoint
ALTER TABLE "albums" DROP COLUMN IF EXISTS "summary";--> statement-breakpoint
ALTER TABLE "artists" DROP COLUMN IF EXISTS "thumb";--> statement-breakpoint
ALTER TABLE "artists" DROP COLUMN IF EXISTS "art";--> statement-breakpoint
ALTER TABLE "artists" DROP COLUMN IF EXISTS "summary";--> statement-breakpoint
ALTER TABLE "songs" DROP COLUMN IF EXISTS "duration";--> statement-breakpoint
ALTER TABLE "songs" DROP COLUMN IF EXISTS "track_number";--> statement-breakpoint
ALTER TABLE "songs" DROP COLUMN IF EXISTS "disc_number";--> statement-breakpoint
ALTER TABLE "songs" DROP COLUMN IF EXISTS "year";--> statement-breakpoint
ALTER TABLE "songs" DROP COLUMN IF EXISTS "thumb";--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_plex_id_unique" UNIQUE("plex_id");--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_plex_id_unique" UNIQUE("plex_id");--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_plex_id_unique" UNIQUE("plex_id");