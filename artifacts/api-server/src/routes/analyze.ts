import { Router, type IRouter } from "express";
import { db, videosTable } from "@workspace/db";
import { eq, isNull, or } from "drizzle-orm";
import { ai } from "@workspace/integrations-gemini-ai";

const router: IRouter = Router();

async function analyzeVideoWithGemini(video: { title: string; description: string; channel?: string | null; duration?: number | null }) {
  const prompt = `You are an AI video metadata analyst. Analyze the following video metadata and return a JSON object with the specified fields.

Video Title: ${video.title}
Video Description: ${video.description}
Channel: ${video.channel ?? "Unknown"}
Duration (seconds): ${video.duration ?? "Unknown"}

Return ONLY a valid JSON object with these exact fields:
{
  "genre": "primary genre (e.g., Education, Entertainment, Technology, Gaming, Music, News, Sports, Lifestyle, Science, Comedy, Documentary, Tutorial, Review)",
  "subGenre": "more specific sub-category",
  "tags": ["array", "of", "5-10", "relevant", "tags"],
  "topics": ["array", "of", "3-6", "main", "topics", "covered"],
  "sentiment": "positive | neutral | negative",
  "targetAudience": "brief description of target audience",
  "contentRating": "all-ages | teen | mature | professional",
  "aiSummary": "2-3 sentence summary of what this video is about and its value"
}

Only return the JSON, no explanation.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
    },
  });

  const text = response.text ?? "{}";
  const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleanText);
}

router.post("/videos/:id/analyze", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, id));
  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  await db.update(videosTable).set({ analysisStatus: "processing" }).where(eq(videosTable.id, id));

  try {
    const analysis = await analyzeVideoWithGemini(video);

    const [updated] = await db.update(videosTable).set({
      genre: analysis.genre ?? null,
      subGenre: analysis.subGenre ?? null,
      tags: Array.isArray(analysis.tags) ? analysis.tags : [],
      topics: Array.isArray(analysis.topics) ? analysis.topics : [],
      sentiment: analysis.sentiment ?? null,
      targetAudience: analysis.targetAudience ?? null,
      contentRating: analysis.contentRating ?? null,
      aiSummary: analysis.aiSummary ?? null,
      analysisStatus: "completed",
    }).where(eq(videosTable.id, id)).returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Gemini analysis failed");
    await db.update(videosTable).set({ analysisStatus: "failed" }).where(eq(videosTable.id, id));
    res.status(500).json({ error: "Analysis failed" });
  }
});

router.post("/analyze/batch", async (req, res) => {
  const pendingVideos = await db.select().from(videosTable).where(
    or(eq(videosTable.analysisStatus, "pending"), eq(videosTable.analysisStatus, "failed"))
  );

  let succeeded = 0;
  let failed = 0;

  for (const video of pendingVideos) {
    await db.update(videosTable).set({ analysisStatus: "processing" }).where(eq(videosTable.id, video.id));
    try {
      const analysis = await analyzeVideoWithGemini(video);
      await db.update(videosTable).set({
        genre: analysis.genre ?? null,
        subGenre: analysis.subGenre ?? null,
        tags: Array.isArray(analysis.tags) ? analysis.tags : [],
        topics: Array.isArray(analysis.topics) ? analysis.topics : [],
        sentiment: analysis.sentiment ?? null,
        targetAudience: analysis.targetAudience ?? null,
        contentRating: analysis.contentRating ?? null,
        aiSummary: analysis.aiSummary ?? null,
        analysisStatus: "completed",
      }).where(eq(videosTable.id, video.id));
      succeeded++;
    } catch (err) {
      req.log.error({ err, videoId: video.id }, "Batch analysis failed for video");
      await db.update(videosTable).set({ analysisStatus: "failed" }).where(eq(videosTable.id, video.id));
      failed++;
    }
  }

  res.json({ processed: pendingVideos.length, succeeded, failed });
});

export default router;
