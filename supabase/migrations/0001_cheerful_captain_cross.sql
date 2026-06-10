CREATE TABLE "kidzee_mundhwa" (
	"invoice_number" text PRIMARY KEY NOT NULL,
	"academic_year" text NOT NULL,
	"due_date" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_amount" integer NOT NULL,
	"student_id" text NOT NULL,
	"student_name" text NOT NULL,
	"student_class" text NOT NULL,
	"roll_number" text NOT NULL,
	"admission_number" text NOT NULL,
	"parent_name" text NOT NULL,
	"parent_phone" text NOT NULL,
	"parent_email" text NOT NULL,
	"payment_details" jsonb
);
--> statement-breakpoint
CREATE INDEX "kidzee_mundhwa_status_idx" ON "kidzee_mundhwa" USING btree ("status");--> statement-breakpoint
CREATE INDEX "kidzee_mundhwa_student_id_idx" ON "kidzee_mundhwa" USING btree ("student_id");