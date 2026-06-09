import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  scanSessionsTable,
  faceAnalysesTable,
  styleMatchesTable,
  hairstylesTable,
  insertScanSessionSchema,
} from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const updateFrontImageSchema = z.object({
  frontImageUrl: z.string().url(),
});

const update360ProgressSchema = z.object({
  captureProgress: z.number().int().min(0).max(100),
  scan360DataUrl: z.string().url().optional(),
});

const FACE_SHAPES = ["oval", "round", "square", "heart", "oblong", "diamond"];
const HEAD_SHAPES = ["round", "long", "wide", "flat-back"];
const JAW_TYPES = ["strong", "soft", "wide", "narrow"];

const PROCESSING_STEPS = [
  { key: "geometry", label: "Mapping facial geometry" },
  { key: "head_shape", label: "Analyzing head shape" },
  { key: "matching", label: "Matching style database" },
];

async function runAnalysis(scanId: string) {
  await db
    .update(scanSessionsTable)
    .set({ status: "processing", updatedAt: new Date() })
    .where(eq(scanSessionsTable.id, scanId));

  const faceShape = FACE_SHAPES[Math.floor(Math.random() * FACE_SHAPES.length)]!;
  const headShape = HEAD_SHAPES[Math.floor(Math.random() * HEAD_SHAPES.length)]!;
  const jawType = JAW_TYPES[Math.floor(Math.random() * JAW_TYPES.length)]!;

  const [analysis] = await db
    .insert(faceAnalysesTable)
    .values({
      scanSessionId: scanId,
      faceShape,
      headShape,
      jawType,
      dataPointsCount: 47,
      processingSteps: PROCESSING_STEPS.map((s) => ({ ...s, status: "done" })),
    })
    .returning();

  const styles = await db.query.hairstylesTable.findMany({
    where: eq(hairstylesTable.isActive, true),
  });

  const scoredStyles = styles
    .map((style) => {
      let score = Math.floor(Math.random() * 30) + 60;
      if (style.suitableFaceShapes.includes(faceShape)) score += 15;
      if (style.suitableJawTypes.includes(jawType)) score += 10;
      return { style, score: Math.min(score, 99) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (scoredStyles.length > 0) {
    await db.insert(styleMatchesTable).values(
      scoredStyles.map((item, index) => ({
        scanSessionId: scanId,
        hairstyleId: item.style.id,
        matchPercentage: item.score,
        rank: index + 1,
        isBestMatch: index === 0,
        reasoning: `${item.style.name} suits your ${faceShape} face shape and ${jawType} jaw.`,
      })),
    );
  }

  await db
    .update(scanSessionsTable)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(scanSessionsTable.id, scanId));

  return { analysis, matchCount: scoredStyles.length };
}

router.post("/scans", async (req, res) => {
  const parsed = insertScanSessionSchema.safeParse({
    userId: req.body.userId ?? null,
    status: "pending",
  });
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const [scan] = await db
    .insert(scanSessionsTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(scan);
});

router.get("/scans/:scanId", async (req, res) => {
  const { scanId } = req.params;

  const scan = await db.query.scanSessionsTable.findFirst({
    where: eq(scanSessionsTable.id, scanId),
  });

  if (!scan) {
    res.status(404).json({ error: "not_found", message: "Scan not found" });
    return;
  }

  res.json(scan);
});

router.put("/scans/:scanId/front-image", async (req, res) => {
  const { scanId } = req.params;

  const parsed = updateFrontImageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const existing = await db.query.scanSessionsTable.findFirst({
    where: eq(scanSessionsTable.id, scanId),
  });

  if (!existing) {
    res.status(404).json({ error: "not_found", message: "Scan not found" });
    return;
  }

  const [updated] = await db
    .update(scanSessionsTable)
    .set({
      frontImageUrl: parsed.data.frontImageUrl,
      status: "capturing",
      updatedAt: new Date(),
    })
    .where(eq(scanSessionsTable.id, scanId))
    .returning();

  res.json(updated);
});

router.put("/scans/:scanId/360-progress", async (req, res) => {
  const { scanId } = req.params;

  const parsed = update360ProgressSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const existing = await db.query.scanSessionsTable.findFirst({
    where: eq(scanSessionsTable.id, scanId),
  });

  if (!existing) {
    res.status(404).json({ error: "not_found", message: "Scan not found" });
    return;
  }

  const [updated] = await db
    .update(scanSessionsTable)
    .set({
      captureProgress: parsed.data.captureProgress,
      scan360DataUrl: parsed.data.scan360DataUrl ?? existing.scan360DataUrl,
      updatedAt: new Date(),
    })
    .where(eq(scanSessionsTable.id, scanId))
    .returning();

  res.json(updated);
});

router.post("/scans/:scanId/analyze", async (req, res) => {
  const { scanId } = req.params;

  const scan = await db.query.scanSessionsTable.findFirst({
    where: eq(scanSessionsTable.id, scanId),
  });

  if (!scan) {
    res.status(404).json({ error: "not_found", message: "Scan not found" });
    return;
  }

  if (!scan.frontImageUrl) {
    res.status(400).json({
      error: "missing_image",
      message: "Front image is required before analysis",
    });
    return;
  }

  if (scan.status === "processing") {
    res.json({
      scanId,
      status: "processing",
      steps: PROCESSING_STEPS.map((s) => ({ ...s, status: "active" })),
      matchCount: null,
    });
    return;
  }

  if (scan.status === "completed") {
    const matches = await db.query.styleMatchesTable.findMany({
      where: eq(styleMatchesTable.scanSessionId, scanId),
    });
    res.json({
      scanId,
      status: "completed",
      steps: PROCESSING_STEPS.map((s) => ({ ...s, status: "done" })),
      matchCount: matches.length,
    });
    return;
  }

  const { matchCount } = await runAnalysis(scanId);

  res.json({
    scanId,
    status: "completed",
    steps: PROCESSING_STEPS.map((s) => ({ ...s, status: "done" })),
    matchCount,
  });
});

router.get("/scans/:scanId/analysis", async (req, res) => {
  const { scanId } = req.params;

  const scan = await db.query.scanSessionsTable.findFirst({
    where: eq(scanSessionsTable.id, scanId),
  });

  if (!scan) {
    res.status(404).json({ error: "not_found", message: "Scan not found" });
    return;
  }

  const analysis = await db.query.faceAnalysesTable.findFirst({
    where: eq(faceAnalysesTable.scanSessionId, scanId),
    orderBy: (a, { desc }) => [desc(a.createdAt)],
  });

  if (!analysis) {
    res.status(404).json({ error: "not_found", message: "Analysis not found for this scan" });
    return;
  }

  res.json(analysis);
});

router.get("/scans/:scanId/matches", async (req, res) => {
  const { scanId } = req.params;

  const scan = await db.query.scanSessionsTable.findFirst({
    where: eq(scanSessionsTable.id, scanId),
  });

  if (!scan) {
    res.status(404).json({ error: "not_found", message: "Scan not found" });
    return;
  }

  const matches = await db.query.styleMatchesTable.findMany({
    where: eq(styleMatchesTable.scanSessionId, scanId),
    with: { hairstyle: true },
    orderBy: (m, { asc }) => [asc(m.rank)],
  });

  res.json({ data: matches, total: matches.length, scanId });
});

export default router;
