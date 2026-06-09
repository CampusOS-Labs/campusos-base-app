import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const contactGroup = pgTable(
  "contact_group",
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
  (table) => [index("contact_group_created_by_idx").on(table.createdBy)],
);

export const contact = pgTable(
  "contact",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id")
      .notNull()
      .references(() => contactGroup.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phoneNumber: text("phone_number").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("contact_group_id_idx").on(table.groupId)],
);

export const announcementLog = pgTable(
  "announcement_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message"),
    type: text("type").notNull().default("announcement"),
    recipientCount: integer("recipient_count").notNull().default(0),
    groupId: text("group_id").references(() => contactGroup.id, {
      onDelete: "set null",
    }),
    audienceLabel: text("audience_label"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("announcement_log_user_id_idx").on(table.userId),
    index("announcement_log_created_at_idx").on(table.createdAt),
  ],
);

export const contactGroupRelations = relations(contactGroup, ({ one, many }) => ({
  createdByUser: one(user, {
    fields: [contactGroup.createdBy],
    references: [user.id],
  }),
  contacts: many(contact),
  announcementLogs: many(announcementLog),
}));

export const contactRelations = relations(contact, ({ one }) => ({
  group: one(contactGroup, {
    fields: [contact.groupId],
    references: [contactGroup.id],
  }),
}));

export const announcementLogRelations = relations(announcementLog, ({ one }) => ({
  user: one(user, {
    fields: [announcementLog.userId],
    references: [user.id],
  }),
  group: one(contactGroup, {
    fields: [announcementLog.groupId],
    references: [contactGroup.id],
  }),
}));
