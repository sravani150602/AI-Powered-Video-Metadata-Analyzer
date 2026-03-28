import { Router, type IRouter } from "express";
import { db, videosTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import {
  CreateVideoBody,
  GetVideosQueryParams,
  GetVideoParams,
  DeleteVideoParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/videos", async (req, res) => {
  try {
    const query = GetVideosQueryParams.parse(req.query);
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const whereClause = query.genre
      ? eq(videosTable.genre, query.genre)
      : undefined;

    const [videos, countResult] = await Promise.all([
      whereClause
        ? db.select().from(videosTable).where(whereClause).orderBy(desc(videosTable.createdAt)).limit(limit).offset(offset)
        : db.select().from(videosTable).orderBy(desc(videosTable.createdAt)).limit(limit).offset(offset),
      whereClause
        ? db.select({ count: sql<number>`count(*)::int` }).from(videosTable).where(whereClause)
        : db.select({ count: sql<number>`count(*)::int` }).from(videosTable),
    ]);

    res.json({ videos, total: countResult[0]?.count ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to list videos");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/videos", async (req, res) => {
  try {
    const body = CreateVideoBody.parse(req.body);
    const [video] = await db.insert(videosTable).values({
      title: body.title,
      description: body.description,
      channel: body.channel ?? null,
      duration: body.duration ?? null,
      publishedAt: body.publishedAt ?? null,
      sourceUrl: body.sourceUrl ?? null,
      analysisStatus: "pending",
    }).returning();
    res.status(201).json(video);
  } catch (err) {
    req.log.error({ err }, "Failed to create video");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/videos/:id", async (req, res) => {
  try {
    const { id } = GetVideoParams.parse({ id: Number(req.params.id) });
    const [video] = await db.select().from(videosTable).where(eq(videosTable.id, id));
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }
    res.json(video);
  } catch (err) {
    req.log.error({ err }, "Failed to get video");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/videos/:id", async (req, res) => {
  try {
    const { id } = DeleteVideoParams.parse({ id: Number(req.params.id) });
    const result = await db.delete(videosTable).where(eq(videosTable.id, id)).returning();
    if (result.length === 0) {
      res.status(404).json({ error: "Video not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete video");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
