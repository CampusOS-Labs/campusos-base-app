CREATE TABLE "kidzee_vadgaonsheri_invoices" (
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
CREATE INDEX "kidzee_vadgaonsheri_invoices_status_idx" ON "kidzee_vadgaonsheri_invoices" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "kidzee_vadgaonsheri_invoices_student_id_idx" ON "kidzee_vadgaonsheri_invoices" USING btree ("student_id");
--> statement-breakpoint
CREATE TABLE "kidzee_vadgaonsheri_contact_group" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kidzee_vadgaonsheri_contact" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"name" text NOT NULL,
	"phone_number" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kidzee_vadgaonsheri_announcement_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text,
	"type" text DEFAULT 'announcement' NOT NULL,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"group_id" text,
	"audience_label" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kidzee_vadgaonsheri_contact_group" ADD CONSTRAINT "kidzee_vadgaonsheri_contact_group_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "kidzee_vadgaonsheri_contact" ADD CONSTRAINT "kidzee_vadgaonsheri_contact_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."kidzee_vadgaonsheri_contact_group"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "kidzee_vadgaonsheri_announcement_log" ADD CONSTRAINT "kidzee_vadgaonsheri_al_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "kidzee_vadgaonsheri_announcement_log" ADD CONSTRAINT "kidzee_vadgaonsheri_al_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."kidzee_vadgaonsheri_contact_group"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "kidzee_vadgaonsheri_cg_created_by_idx" ON "kidzee_vadgaonsheri_contact_group" USING btree ("created_by");
--> statement-breakpoint
CREATE INDEX "kidzee_vadgaonsheri_contact_group_id_idx" ON "kidzee_vadgaonsheri_contact" USING btree ("group_id");
--> statement-breakpoint
CREATE INDEX "kidzee_vadgaonsheri_al_user_id_idx" ON "kidzee_vadgaonsheri_announcement_log" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "kidzee_vadgaonsheri_al_created_at_idx" ON "kidzee_vadgaonsheri_announcement_log" USING btree ("created_at");
