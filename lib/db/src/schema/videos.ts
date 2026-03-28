import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysisStatusEnum = pgEnum("analysis_status", ["pending", "processing", "completed", "failed"]);

export const videosTable = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  channel: text("channel"),
  duration: integer("duration"),
  publishedAt: text("published_at"),
  sourceUrl: text("source_url"),
  genre: text("genre"),
  subGenre: text("sub_genre"),
  tags: text("tags").array().notNull().default([]),
  topics: text("topics").array().notNull().default([]),
  sentiment: text("sentiment"),
  targetAudience: text("target_audience"),
  contentRating: text("content_rating"),
  aiSummary: text("ai_summary"),
  analysisStatus: analysisStatusEnum("analysis_status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVideoSchema = createInsertSchema(videosTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  genre: true,
  subGenre: true,
  tags: true,
  topics: true,
  sentiment: true,
  targetAudience: true,
  contentRating: true,
  aiSummary: true,
  analysisStatus: true,
});
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videosTable.$inferSelect;
