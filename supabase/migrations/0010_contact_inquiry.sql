CREATE TABLE "contact_inquiry" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "school_name" text NOT NULL,
  "email" text NOT NULL,
  "message" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "contact_inquiry_created_at_idx" ON "contact_inquiry" ("created_at");
