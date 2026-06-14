CREATE TABLE "product_event" (
  "id" text PRIMARY KEY NOT NULL,
  "school_id" text NOT NULL,
  "user_id" text,
  "event" text NOT NULL,
  "properties" jsonb,
  "duration_ms" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "product_event_school_event_created_idx" ON "product_event" ("school_id", "event", "created_at");
CREATE INDEX "product_event_user_created_idx" ON "product_event" ("user_id", "created_at");
