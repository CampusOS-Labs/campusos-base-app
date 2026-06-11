CREATE TABLE "kidzee_mundhwa_check_in_token" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "kidzee_mundhwa_cit_teacher_id_idx" ON "kidzee_mundhwa_check_in_token" USING btree ("teacher_id");
--> statement-breakpoint
CREATE INDEX "kidzee_mundhwa_cit_expires_at_idx" ON "kidzee_mundhwa_check_in_token" USING btree ("expires_at");
