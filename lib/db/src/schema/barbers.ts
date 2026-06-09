import {
  pgTable,
  text,
  uuid,
  timestamp,
  boolean,
  doublePrecision,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const barbersTable = pgTable("barbers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  shopName: text("shop_name"),
  address: text("address"),
  city: text("city"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  phone: text("phone"),
  rating: doublePrecision("rating"),
  reviewCount: integer("review_count").default(0),
  specialties: text("specialties").array().default([]),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBarberSchema = createInsertSchema(barbersTable).omit({
  id: true,
  createdAt: true,
});

export const selectBarberSchema = createSelectSchema(barbersTable);

export type InsertBarber = z.infer<typeof insertBarberSchema>;
export type Barber = typeof barbersTable.$inferSelect;
