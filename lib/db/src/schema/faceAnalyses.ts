import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { scanSessionsTable } from "./scanSessions";

export const faceAnalysesTable = pgTable("face_analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  scanSessionId: uuid("scan_session_id")
    .notNull()
    .references(() => scanSessionsTable.id),
  faceShape: text("face_shape"),
  headShape: text("head_shape"),
  jawType: text("jaw_type"),
  dataPointsCount: integer("data_points_count").default(47),
  analysisData: jsonb("analysis_data"),
  processingSteps: jsonb("processing_steps"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFaceAnalysisSchema = createInsertSchema(
  faceAnalysesTable,
).omit({ id: true, createdAt: true });

export const selectFaceAnalysisSchema = createSelectSchema(faceAnalysesTable);

export type InsertFaceAnalysis = z.infer<typeof insertFaceAnalysisSchema>;
export type FaceAnalysis = typeof faceAnalysesTable.$inferSelect;
