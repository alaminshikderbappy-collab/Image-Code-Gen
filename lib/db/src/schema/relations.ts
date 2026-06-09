import { relations } from "drizzle-orm";
import { usersTable } from "./users";
import { hairstylesTable } from "./hairstyles";
import { scanSessionsTable } from "./scanSessions";
import { faceAnalysesTable } from "./faceAnalyses";
import { styleMatchesTable } from "./styleMatches";
import { savedStylesTable } from "./savedStyles";

export const usersRelations = relations(usersTable, ({ many }) => ({
  scanSessions: many(scanSessionsTable),
  savedStyles: many(savedStylesTable),
}));

export const hairstylesRelations = relations(hairstylesTable, ({ many }) => ({
  styleMatches: many(styleMatchesTable),
  savedStyles: many(savedStylesTable),
}));

export const scanSessionsRelations = relations(
  scanSessionsTable,
  ({ one, many }) => ({
    user: one(usersTable, {
      fields: [scanSessionsTable.userId],
      references: [usersTable.id],
    }),
    faceAnalyses: many(faceAnalysesTable),
    styleMatches: many(styleMatchesTable),
    savedStyles: many(savedStylesTable),
  }),
);

export const faceAnalysesRelations = relations(
  faceAnalysesTable,
  ({ one }) => ({
    scanSession: one(scanSessionsTable, {
      fields: [faceAnalysesTable.scanSessionId],
      references: [scanSessionsTable.id],
    }),
  }),
);

export const styleMatchesRelations = relations(
  styleMatchesTable,
  ({ one }) => ({
    scanSession: one(scanSessionsTable, {
      fields: [styleMatchesTable.scanSessionId],
      references: [scanSessionsTable.id],
    }),
    hairstyle: one(hairstylesTable, {
      fields: [styleMatchesTable.hairstyleId],
      references: [hairstylesTable.id],
    }),
  }),
);

export const savedStylesRelations = relations(savedStylesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [savedStylesTable.userId],
    references: [usersTable.id],
  }),
  hairstyle: one(hairstylesTable, {
    fields: [savedStylesTable.hairstyleId],
    references: [hairstylesTable.id],
  }),
  scanSession: one(scanSessionsTable, {
    fields: [savedStylesTable.scanSessionId],
    references: [scanSessionsTable.id],
  }),
}));
