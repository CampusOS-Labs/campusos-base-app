import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const kidzeeVadgaonsheriInvoices = pgTable(
  "kidzee_vadgaonsheri_invoices",
  {
    invoiceNumber: text("invoice_number").primaryKey(),
    academicYear: text("academic_year").notNull(),
    dueDate: text("due_date").notNull(),
    status: text("status").notNull().default("pending"),
    totalAmount: integer("total_amount").notNull(),
    studentId: text("student_id").notNull(),
    studentName: text("student_name").notNull(),
    studentClass: text("student_class").notNull(),
    rollNumber: text("roll_number").notNull(),
    admissionNumber: text("admission_number").notNull(),
    parentName: text("parent_name").notNull(),
    parentPhone: text("parent_phone").notNull(),
    parentEmail: text("parent_email").notNull(),
    paymentDetails: jsonb("payment_details"),
  },
  (table) => [
    index("kidzee_vadgaonsheri_invoices_status_idx").on(table.status),
    index("kidzee_vadgaonsheri_invoices_student_id_idx").on(table.studentId),
  ],
);

export const kidzeeVadgaonsheriContactGroup = pgTable(
  "kidzee_vadgaonsheri_contact_group",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("kidzee_vadgaonsheri_cg_created_by_idx").on(table.createdBy),
  ],
);

export const kidzeeVadgaonsheriContact = pgTable(
  "kidzee_vadgaonsheri_contact",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id")
      .notNull()
      .references(() => kidzeeVadgaonsheriContactGroup.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phoneNumber: text("phone_number").notNull(),
    fatherName: text("father_name"),
    fatherPhoneNumber: text("father_phone_number"),
    motherName: text("mother_name"),
    motherPhoneNumber: text("mother_phone_number"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("kidzee_vadgaonsheri_contact_group_id_idx").on(table.groupId),
  ],
);

export const kidzeeVadgaonsheriAnnouncementLog = pgTable(
  "kidzee_vadgaonsheri_announcement_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message"),
    type: text("type").notNull().default("announcement"),
    recipientCount: integer("recipient_count").notNull().default(0),
    groupId: text("group_id").references(() => kidzeeVadgaonsheriContactGroup.id, {
      onDelete: "set null",
    }),
    audienceLabel: text("audience_label"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("kidzee_vadgaonsheri_al_user_id_idx").on(table.userId),
    index("kidzee_vadgaonsheri_al_created_at_idx").on(table.createdAt),
  ],
);

export const kidzeeVadgaonsheriContactGroupRelations = relations(
  kidzeeVadgaonsheriContactGroup,
  ({ one, many }) => ({
    createdByUser: one(user, {
      fields: [kidzeeVadgaonsheriContactGroup.createdBy],
      references: [user.id],
    }),
    contacts: many(kidzeeVadgaonsheriContact),
    announcementLogs: many(kidzeeVadgaonsheriAnnouncementLog),
  }),
);

export const kidzeeVadgaonsheriContactRelations = relations(
  kidzeeVadgaonsheriContact,
  ({ one }) => ({
    group: one(kidzeeVadgaonsheriContactGroup, {
      fields: [kidzeeVadgaonsheriContact.groupId],
      references: [kidzeeVadgaonsheriContactGroup.id],
    }),
  }),
);

export const kidzeeVadgaonsheriAnnouncementLogRelations = relations(
  kidzeeVadgaonsheriAnnouncementLog,
  ({ one }) => ({
    user: one(user, {
      fields: [kidzeeVadgaonsheriAnnouncementLog.userId],
      references: [user.id],
    }),
    group: one(kidzeeVadgaonsheriContactGroup, {
      fields: [kidzeeVadgaonsheriAnnouncementLog.groupId],
      references: [kidzeeVadgaonsheriContactGroup.id],
    }),
  }),
);
