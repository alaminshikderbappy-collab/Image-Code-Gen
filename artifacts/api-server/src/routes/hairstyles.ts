import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { hairstylesTable, insertHairstyleSchema } from "@workspace/db";

const router: IRouter = Router();

router.get("/hairstyles", async (req, res) => {
  const { length, fade, texture, effortLevel, faceShape, category } = req.query as Record<string, string>;

  const allStyles = await db.query.hairstylesTable.findMany({
    where: eq(hairstylesTable.isActive, true),
    orderBy: (h, { asc }) => [asc(h.name)],
  });

  let results = allStyles;

  if (category) results = results.filter((h) => h.category === category);
  if (length) results = results.filter((h) => h.length === length);
  if (fade) results = results.filter((h) => h.fade === fade);
  if (texture) results = results.filter((h) => h.texture === texture);
  if (effortLevel) results = results.filter((h) => h.effortLevel === effortLevel);
  if (faceShape) {
    results = results.filter((h) =>
      h.suitableFaceShapes.some((s) => s.toLowerCase() === faceShape.toLowerCase()),
    );
  }

  res.json({ data: results, total: results.length });
});

router.post("/hairstyles", async (req, res) => {
  const parsed = insertHairstyleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const [hairstyle] = await db
    .insert(hairstylesTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(hairstyle);
});

router.get("/hairstyles/:hairstyleId", async (req, res) => {
  const { hairstyleId } = req.params;

  const hairstyle = await db.query.hairstylesTable.findFirst({
    where: eq(hairstylesTable.id, hairstyleId),
  });

  if (!hairstyle) {
    res.status(404).json({ error: "not_found", message: "Hairstyle not found" });
    return;
  }

  res.json(hairstyle);
});

export default router;
