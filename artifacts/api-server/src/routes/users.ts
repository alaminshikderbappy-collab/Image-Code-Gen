import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  usersTable,
  hairstylesTable,
  savedStylesTable,
  insertUserSchema,
  insertSavedStyleSchema,
} from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const updateUserSchema = z.object({
  displayName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

const saveStyleSchema = z.object({
  hairstyleId: z.string().uuid(),
  scanSessionId: z.string().uuid().optional(),
});

router.post("/users", async (req, res) => {
  const parsed = insertUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(user);
});

router.get("/users/:userId", async (req, res) => {
  const { userId } = req.params;

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });

  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  res.json(user);
});

router.patch("/users/:userId", async (req, res) => {
  const { userId } = req.params;

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const existing = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });

  if (!existing) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(usersTable.id, userId))
    .returning();

  res.json(updated);
});

router.get("/users/:userId/saved-styles", async (req, res) => {
  const { userId } = req.params;

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });

  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const savedStyles = await db.query.savedStylesTable.findMany({
    where: eq(savedStylesTable.userId, userId),
    with: { hairstyle: true },
    orderBy: (s, { desc }) => [desc(s.savedAt)],
  });

  res.json({ data: savedStyles, total: savedStyles.length });
});

router.post("/users/:userId/saved-styles", async (req, res) => {
  const { userId } = req.params;

  const parsed = saveStyleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const hairstyle = await db.query.hairstylesTable.findFirst({
    where: eq(hairstylesTable.id, parsed.data.hairstyleId),
  });
  if (!hairstyle) {
    res.status(404).json({ error: "not_found", message: "Hairstyle not found" });
    return;
  }

  const [saved] = await db
    .insert(savedStylesTable)
    .values({ userId, ...parsed.data })
    .returning();

  res.status(201).json({ ...saved, hairstyle });
});

router.delete("/users/:userId/saved-styles/:savedStyleId", async (req, res) => {
  const { userId, savedStyleId } = req.params;

  const existing = await db.query.savedStylesTable.findFirst({
    where: eq(savedStylesTable.id, savedStyleId),
  });

  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "not_found", message: "Saved style not found" });
    return;
  }

  await db
    .delete(savedStylesTable)
    .where(eq(savedStylesTable.id, savedStyleId));

  res.status(204).send();
});

export default router;
