CREATE TABLE "kidzee_mundhwa_teacher_attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"teacher_name" text NOT NULL,
	"checked_in_at" timestamp DEFAULT now() NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"distance_meters" integer NOT NULL,
	"geofence_passed" boolean NOT NULL,
	"manual_override" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX "kidzee_mundhwa_ta_teacher_id_idx" ON "kidzee_mundhwa_teacher_attendance" USING btree ("teacher_id");
--> statement-breakpoint
CREATE INDEX "kidzee_mundhwa_ta_checked_in_at_idx" ON "kidzee_mundhwa_teacher_attendance" USING btree ("checked_in_at");
