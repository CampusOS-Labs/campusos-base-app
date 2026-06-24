import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  real,
  boolean,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const kidzeeMundhwaInvoices = pgTable(
  "kidzee_mundhwa_invoices",
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
    index("kidzee_mundhwa_invoices_status_idx").on(table.status),
    index("kidzee_mundhwa_invoices_student_id_idx").on(table.studentId),
  ],
);

export const kidzeeMundhwaTeacherAttendance = pgTable(
  "kidzee_mundhwa_teacher_attendance",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id").notNull(),
    teacherName: text("teacher_name").notNull(),
    checkedInAt: timestamp("checked_in_at").defaultNow().notNull(),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    distanceMeters: integer("distance_meters").notNull(),
    geofencePassed: boolean("geofence_passed").notNull(),
    manualOverride: boolean("manual_override").notNull().default(false),
    checkedOutAt: timestamp("checked_out_at"),
    checkoutLatitude: real("checkout_latitude"),
    checkoutLongitude: real("checkout_longitude"),
    checkoutDistanceMeters: integer("checkout_distance_meters"),
    checkoutGeofencePassed: boolean("checkout_geofence_passed"),
    checkoutManualOverride: boolean("checkout_manual_override").notNull().default(false),
  },
  (table) => [
    index("kidzee_mundhwa_ta_teacher_id_idx").on(table.teacherId),
    index("kidzee_mundhwa_ta_checked_in_at_idx").on(table.checkedInAt),
  ],
);

export const kidzeeMundhwaContactGroup = pgTable(
  "kidzee_mundhwa_contact_group",
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
    index("kidzee_mundhwa_cg_created_by_idx").on(table.createdBy),
  ],
);

export const kidzeeMundhwaContact = pgTable(
  "kidzee_mundhwa_contact",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id")
      .notNull()
      .references(() => kidzeeMundhwaContactGroup.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phoneNumber: text("phone_number").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("kidzee_mundhwa_contact_group_id_idx").on(table.groupId),
  ],
);

export const kidzeeMundhwaAnnouncementLog = pgTable(
  "kidzee_mundhwa_announcement_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message"),
    type: text("type").notNull().default("announcement"),
    recipientCount: integer("recipient_count").notNull().default(0),
    groupId: text("group_id").references(() => kidzeeMundhwaContactGroup.id, {
      onDelete: "set null",
    }),
    audienceLabel: text("audience_label"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("kidzee_mundhwa_al_user_id_idx").on(table.userId),
    index("kidzee_mundhwa_al_created_at_idx").on(table.createdAt),
  ],
);

export const kidzeeMundhwaContactGroupRelations = relations(
  kidzeeMundhwaContactGroup,
  ({ one, many }) => ({
    createdByUser: one(user, {
      fields: [kidzeeMundhwaContactGroup.createdBy],
      references: [user.id],
    }),
    contacts: many(kidzeeMundhwaContact),
    announcementLogs: many(kidzeeMundhwaAnnouncementLog),
  }),
);

export const kidzeeMundhwaContactRelations = relations(
  kidzeeMundhwaContact,
  ({ one }) => ({
    group: one(kidzeeMundhwaContactGroup, {
      fields: [kidzeeMundhwaContact.groupId],
      references: [kidzeeMundhwaContactGroup.id],
    }),
  }),
);

export const kidzeeMundhwaAnnouncementLogRelations = relations(
  kidzeeMundhwaAnnouncementLog,
  ({ one }) => ({
    user: one(user, {
      fields: [kidzeeMundhwaAnnouncementLog.userId],
      references: [user.id],
    }),
    group: one(kidzeeMundhwaContactGroup, {
      fields: [kidzeeMundhwaAnnouncementLog.groupId],
      references: [kidzeeMundhwaContactGroup.id],
    }),
  }),
);
