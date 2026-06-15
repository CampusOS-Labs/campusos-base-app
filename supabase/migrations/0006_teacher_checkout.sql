ALTER TABLE "kidzee_mundhwa_teacher_attendance"
ADD COLUMN IF NOT EXISTS "checked_out_at" timestamp,
ADD COLUMN IF NOT EXISTS "checkout_latitude" real,
ADD COLUMN IF NOT EXISTS "checkout_longitude" real,
ADD COLUMN IF NOT EXISTS "checkout_distance_meters" integer,
ADD COLUMN IF NOT EXISTS "checkout_geofence_passed" boolean,
ADD COLUMN IF NOT EXISTS "checkout_manual_override" boolean DEFAULT false NOT NULL;
