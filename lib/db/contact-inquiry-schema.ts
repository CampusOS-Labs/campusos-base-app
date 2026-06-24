import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const contactInquiry = pgTable(
  "contact_inquiry",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    schoolName: text("school_name").notNull(),
    email: text("email").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("contact_inquiry_created_at_idx").on(table.createdAt)],
)
