// db/schema.ts
import { pgTable, serial, text, timestamp, uniqueIndex, integer } from "drizzle-orm/pg-core";

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  created_at: timestamp("created_at").defaultNow(),
  content: text("content").notNull(),
  request_id: text("request_id").notNull().unique(),
  num_of_prayers: integer("num_of_prayers").notNull(),
  encouragement: text("encouragement").notNull(),
}, (table) => {
  return {
    idIdx: uniqueIndex("requests_id_idx").on(table.id),
  }
});

export const moderatedRequests = pgTable("moderated_requests", {
  id: serial("id").primaryKey(),
  created_at: timestamp("created_at").defaultNow(),
  message: text("message").notNull(),
  ip_address: text("ip_address").notNull(),
  device: text("device").notNull(),
  location: text("location").notNull(),
  request_id: text("request_id").notNull().unique(),
}, (table) => {
  return {
    idIdx: uniqueIndex("moderated_requests_id_idx").on(table.id),
  }
});
