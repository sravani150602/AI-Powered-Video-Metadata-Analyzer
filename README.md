# AI-Powered Video Metadata Analyzer

An intelligent full-stack web application that classifies and tags video metadata at scale using Google Gemini NLP, surfaces content trends through SQL-powered analytics, and provides structured insights for digital video management workflows.

## Features

- **AI Analysis Pipeline** — Submits video metadata to Gemini 2.5 Flash for automatic classification: genre, sub-genre, topics, tags, sentiment, target audience, content rating, and a plain-language summary
- **Batch Processing** — Analyze all pending videos in one click with status tracking (pending → processing → completed / failed)
- **Analytics Dashboard** — Genre distribution charts, top tags, sentiment breakdown, and content trends over time powered by SQL aggregation queries
- **Full Video Management** — Add, view, and delete video records with title, description, channel, duration, publish date, and source URL
- **REST API** — Clean OpenAPI-defined endpoints for all operations, with generated TypeScript types and React Query hooks

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript, TanStack Query, Recharts, Tailwind CSS |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| AI / NLP | Google Gemini 2.5 Flash (via API) |
| API Contract | OpenAPI 3.1, Orval codegen |
| Package Manager | pnpm workspaces (monorepo) |

## Project Structure

```
├── artifacts/
│   ├── api-server/          # Express REST API
│   │   └── src/routes/
│   │       ├── videos.ts    # CRUD endpoints
│   │       ├── analyze.ts   # Gemini AI analysis endpoints
│   │       └── analytics.ts # SQL-powered analytics endpoints
│   └── video-analyzer/      # React frontend (dashboard, video list, analytics)
├── lib/
│   ├── api-spec/            # OpenAPI spec (openapi.yaml) + Orval config
│   ├── api-client-react/    # Auto-generated React Query hooks
│   ├── api-zod/             # Auto-generated Zod validation schemas
│   ├── db/                  # Drizzle ORM schema + PostgreSQL connection
│   └── integrations-gemini-ai/  # Gemini SDK client + batch utilities
└── scripts/                 # Utility scripts
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/videos` | List all videos (filterable by genre) |
| POST | `/api/videos` | Add a new video record |
| GET | `/api/videos/:id` | Get a single video with full metadata |
| DELETE | `/api/videos/:id` | Delete a video |
| POST | `/api/videos/:id/analyze` | Run Gemini NLP analysis on a video |
| POST | `/api/analyze/batch` | Analyze all pending/failed videos |
| GET | `/api/analytics/summary` | Genre distribution, top tags, sentiment stats |
| GET | `/api/analytics/trends` | Content trends over time |

## How the AI Pipeline Works

1. A video record is created with its title, description, channel, and duration
2. A POST request to `/api/videos/:id/analyze` sends the metadata to Gemini 2.5 Flash
3. Gemini returns a structured JSON response with:
   - **Genre & Sub-genre** — e.g., "Technology → Machine Learning"
   - **Tags** — 5–10 relevant keyword tags
   - **Topics** — 3–6 main subjects covered
   - **Sentiment** — positive, neutral, or negative
   - **Target Audience** — brief audience description
   - **Content Rating** — all-ages, teen, mature, or professional
   - **AI Summary** — 2–3 sentence human-readable summary
4. The structured data is stored in PostgreSQL and immediately available for analytics

## Database Schema

The `videos` table stores both raw metadata and AI-generated analysis:

```
id, title, description, channel, duration, published_at, source_url,
genre, sub_genre, tags[], topics[], sentiment, target_audience,
content_rating, ai_summary, analysis_status, created_at, updated_at
```

## Local Development

```bash
# Install dependencies
pnpm install

# Set up environment variables
# DATABASE_URL, AI_INTEGRATIONS_GEMINI_BASE_URL, AI_INTEGRATIONS_GEMINI_API_KEY

# Push database schema
pnpm --filter @workspace/db run push

# Regenerate API types (after changing openapi.yaml)
pnpm --filter @workspace/api-spec run codegen

# Start the API server
pnpm --filter @workspace/api-server run dev

# Start the frontend
pnpm --filter @workspace/video-analyzer run dev
```

## Screenshots

**Dashboard** — live stats, recent videos, top tags  
**Videos** — full table with genre badges, tag pills, analysis status  
**Analytics** — genre distribution charts, sentiment breakdown, content trends  
**Video Detail** — complete AI-generated metadata for each video
