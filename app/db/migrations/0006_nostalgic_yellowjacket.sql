CREATE TABLE IF NOT EXISTS "processing_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"status" text NOT NULL,
	"songs_processed" integer DEFAULT 0 NOT NULL,
	"error" text,
	"duration_ms" integer,
	"processing_period_start" timestamp NOT NULL,
	"processing_period_end" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "processing_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"last_processed_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
