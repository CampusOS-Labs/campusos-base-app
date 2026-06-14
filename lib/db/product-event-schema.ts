import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const productEvent = pgTable(
  "product_event",
  {
    id: text("id").primaryKey(),
    schoolId: text("school_id").notNull(),
    userId: text("user_id"),
    event: text("event").notNull(),
    properties: jsonb("properties"),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("product_event_school_event_created_idx").on(
      table.schoolId,
      table.event,
      table.createdAt
    ),
    index("product_event_user_created_idx").on(table.userId, table.createdAt),
  ]
)
