import {
  pgTable,
  uuid,
  timestamp,
  integer,
  boolean,
  text,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { scanSessionsTable } from "./scanSessions";
import { hairstylesTable } from "./hairstyles";

export const styleMatchesTable = pgTable("style_matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  scanSessionId: uuid("scan_session_id")
    .notNull()
    .references(() => scanSessionsTable.id),
  hairstyleId: uuid("hairstyle_id")
    .notNull()
    .references(() => hairstylesTable.id),
  matchPercentage: integer("match_percentage").notNull(),
  rank: integer("rank").notNull(),
  isBestMatch: boolean("is_best_match").notNull().default(false),
  reasoning: text("reasoning"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStyleMatchSchema = createInsertSchema(
  styleMatchesTable,
).omit({ id: true, createdAt: true });

export const selectStyleMatchSchema = createSelectSchema(styleMatchesTable);

export type InsertStyleMatch = z.infer<typeof insertStyleMatchSchema>;
export type StyleMatch = typeof styleMatchesTable.$inferSelect;
