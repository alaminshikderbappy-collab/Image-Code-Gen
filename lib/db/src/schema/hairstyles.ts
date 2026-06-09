import {
  pgTable,
  text,
  uuid,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hairstylesTable = pgTable("hairstyles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  length: text("length").notNull(),
  fade: text("fade").notNull(),
  texture: text("texture").notNull(),
  effortLevel: text("effort_level").notNull(),
  imageUrl: text("image_url"),
  hdImageUrl: text("hd_image_url"),
  suitableFaceShapes: text("suitable_face_shapes").array().notNull().default([]),
  suitableJawTypes: text("suitable_jaw_types").array().notNull().default([]),
  tags: text("tags").array().notNull().default([]),
  category: text("category").notNull().default("hair"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHairstyleSchema = createInsertSchema(hairstylesTable).omit({
  id: true,
  createdAt: true,
});

export const selectHairstyleSchema = createSelectSchema(hairstylesTable);

export type InsertHairstyle = z.infer<typeof insertHairstyleSchema>;
export type Hairstyle = typeof hairstylesTable.$inferSelect;
