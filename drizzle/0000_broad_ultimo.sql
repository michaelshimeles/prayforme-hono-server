CREATE TABLE IF NOT EXISTS "moderated_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"message" text NOT NULL,
	"ip_address" text NOT NULL,
	"device" text NOT NULL,
	"location" text NOT NULL,
	"request_id" text NOT NULL,
	CONSTRAINT "moderated_requests_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"content" text NOT NULL,
	"request_id" text NOT NULL,
	"num_of_prayers" integer NOT NULL,
	"encouragement" text,
	CONSTRAINT "requests_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "moderated_requests_id_idx" ON "moderated_requests" ("id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "requests_id_idx" ON "requests" ("id");