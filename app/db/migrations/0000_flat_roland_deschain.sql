CREATE TABLE "albums" (
	"id" serial PRIMARY KEY NOT NULL,
	"rating_key" text NOT NULL,
	"key" text NOT NULL,
	"parent_rating_key" text,
	"guid" text,
	"parent_guid" text,
	"type" text,
	"title" text NOT NULL,
	"parent_title" text,
	"summary" text,
	"index" integer,
	"view_count" integer,
	"year" integer,
	"thumb" text,
	"art" text,
	"parent_thumb" text,
	"added_at" integer,
	"updated_at" integer
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" serial PRIMARY KEY NOT NULL,
	"rating_key" text NOT NULL,
	"guid" text,
	"type" text,
	"title" text NOT NULL,
	"summary" text,
	"view_count" integer,
	"thumb" text,
	"art" text,
	"added_at" integer,
	"updated_at" integer
);
--> statement-breakpoint
CREATE TABLE "play_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"song_id" integer NOT NULL,
	"artist_id" integer NOT NULL,
	"album_id" integer NOT NULL,
	"played_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"grandparent_title" text,
	"parent_title" text,
	"album_art" text,
	"duration" integer,
	"rating_key" text NOT NULL,
	"key" text NOT NULL,
	"parent_rating_key" text,
	"grandparent_rating_key" text,
	"view_count" integer,
	"last_viewed_at" integer,
	"thumb" text,
	"art" text,
	"parent_thumb" text,
	"grandparent_thumb" text,
	"added_at" integer,
	"updated_at" integer,
	"user_rating" integer
);
--> statement-breakpoint
ALTER TABLE "play_events" ADD CONSTRAINT "play_events_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_events" ADD CONSTRAINT "play_events_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_events" ADD CONSTRAINT "play_events_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE no action ON UPDATE no action;