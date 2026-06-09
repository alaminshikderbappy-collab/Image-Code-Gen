import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { hairstylesTable } from "./hairstyles";
import { scanSessionsTable } from "./scanSessions";

export const savedStylesTable = pgTable("saved_styles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  hairstyleId: uuid("hairstyle_id")
    .notNull()
    .references(() => hairstylesTable.id),
  scanSessionId: uuid("scan_session_id").references(() => scanSessionsTable.id),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
});

export const insertSavedStyleSchema = createInsertSchema(
  savedStylesTable,
).omit({ id: true, savedAt: true });

export const selectSavedStyleSchema = createSelectSchema(savedStylesTable);

export type InsertSavedStyle = z.infer<typeof insertSavedStyleSchema>;
export type SavedStyle = typeof savedStylesTable.$inferSelect;
