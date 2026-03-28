import { Router, type IRouter } from "express";
import { db, videosTable } from "@workspace/db";
import { sql, eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/analytics/summary", async (req, res) => {
  try {
    const [totals, genreRows, tagRows, sentimentRows, avgDurationRow] = await Promise.all([
      db.select({
        total: sql<number>`count(*)::int`,
        analyzed: sql<number>`count(*) filter (where analysis_status = 'completed')::int`,
        pending: sql<number>`count(*) filter (where analysis_status in ('pending', 'processing'))::int`,
      }).from(videosTable),

      db.execute<{ genre: string; count: number }>(sql`
        SELECT genre, count(*)::int as count
        FROM videos
        WHERE genre IS NOT NULL
        GROUP BY genre
        ORDER BY count DESC
        LIMIT 10
      `),

      db.execute<{ tag: string; count: number }>(sql`
        SELECT unnest(tags) as tag, count(*)::int as count
        FROM videos
        WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 15
      `),

      db.execute<{ genre: string; count: number }>(sql`
        SELECT sentiment as genre, count(*)::int as count
        FROM videos
        WHERE sentiment IS NOT NULL
        GROUP BY sentiment
        ORDER BY count DESC
      `),

      db.select({ avg: sql<number>`avg(duration)::float` }).from(videosTable),
    ]);

    const summary = totals[0] ?? { total: 0, analyzed: 0, pending: 0 };

    res.json({
      totalVideos: summary.total,
      analyzedVideos: summary.analyzed,
      pendingVideos: summary.pending,
      genreDistribution: genreRows.rows.map((r) => ({ genre: r.genre, count: r.count })),
      topTags: tagRows.rows.map((r) => ({ tag: r.tag, count: r.count })),
      sentimentBreakdown: sentimentRows.rows.map((r) => ({ genre: r.genre, count: r.count })),
      avgDuration: avgDurationRow[0]?.avg ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to compute analytics summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analytics/trends", async (req, res) => {
  try {
    const trends = await db.execute<{ date: string; count: number; genre: string | null }>(sql`
      SELECT
        DATE_TRUNC('day', created_at)::date::text as date,
        count(*)::int as count,
        genre
      FROM videos
      GROUP BY DATE_TRUNC('day', created_at), genre
      ORDER BY date DESC
      LIMIT 60
    `);

    res.json({ trends: trends.rows });
  } catch (err) {
    req.log.error({ err }, "Failed to compute trends");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
