import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { barbersTable, insertBarberSchema } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const nearbyQuerySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radiusKm: z.coerce.number().default(10),
});

function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get("/barbers/nearby", async (req, res) => {
  const parsed = nearbyQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { lat, lng, radiusKm } = parsed.data;

  const all = await db.query.barbersTable.findMany({
    where: eq(barbersTable.isActive, true),
  });

  const nearby = all
    .filter((b) => {
      if (b.lat == null || b.lng == null) return false;
      return haversineDistanceKm(lat, lng, b.lat, b.lng) <= radiusKm;
    })
    .sort((a, b) => {
      const da = haversineDistanceKm(lat, lng, a.lat!, a.lng!);
      const db_ = haversineDistanceKm(lat, lng, b.lat!, b.lng!);
      return da - db_;
    });

  res.json({ data: nearby, total: nearby.length });
});

router.get("/barbers", async (req, res) => {
  const { city } = req.query as Record<string, string>;

  const all = await db.query.barbersTable.findMany({
    where: eq(barbersTable.isActive, true),
    orderBy: (b, { desc }) => [desc(b.rating)],
  });

  const results = city
    ? all.filter((b) => b.city?.toLowerCase().includes(city.toLowerCase()))
    : all;

  res.json({ data: results, total: results.length });
});

router.post("/barbers", async (req, res) => {
  const parsed = insertBarberSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const [barber] = await db
    .insert(barbersTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(barber);
});

router.get("/barbers/:barberId", async (req, res) => {
  const { barberId } = req.params;

  const barber = await db.query.barbersTable.findFirst({
    where: eq(barbersTable.id, barberId),
  });

  if (!barber) {
    res.status(404).json({ error: "not_found", message: "Barber not found" });
    return;
  }

  res.json(barber);
});

export default router;
