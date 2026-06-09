import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const scanSessionsTable = pgTable("scan_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id),
  status: text("status").notNull().default("pending"),
  frontImageUrl: text("front_image_url"),
  scan360DataUrl: text("scan_360_data_url"),
  captureProgress: integer("capture_progress").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertScanSessionSchema = createInsertSchema(
  scanSessionsTable,
).omit({ id: true, createdAt: true, updatedAt: true });

export const selectScanSessionSchema = createSelectSchema(scanSessionsTable);

export type InsertScanSession = z.infer<typeof insertScanSessionSchema>;
export type ScanSession = typeof scanSessionsTable.$inferSelect;
