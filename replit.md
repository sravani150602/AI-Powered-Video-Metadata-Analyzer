# Workspace

## Overview

pnpm workspace monorepo using TypeScript. AI-Powered Video Metadata Analyzer — a full-stack web app that ingests video metadata, runs Gemini NLP analysis to classify and tag content, stores structured insights in PostgreSQL, and surfaces trends through an analytics dashboard.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React + Vite + TanStack Query + Recharts
- **AI**: Gemini 2.5 Flash via Replit AI Integrations

## Features

- Ingest video metadata (title, description, channel, duration, URL)
- Gemini NLP pipeline to classify genre, sub-genre, extract topics, tags, sentiment, target audience, content rating, and AI summary
- Batch analysis of all pending/failed videos
- SQL-powered analytics: genre distribution, top tags, sentiment breakdown, content trends over time
- Dashboard with stats cards, charts, and recent video table
- Full CRUD for video records

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/             # Express API server
│   └── video-analyzer/         # React + Vite frontend (served at /)
├── lib/
│   ├── api-spec/               # OpenAPI spec + Orval codegen config
│   ├── api-client-react/       # Generated React Query hooks
│   ├── api-zod/                # Generated Zod schemas from OpenAPI
│   ├── db/                     # Drizzle ORM schema + DB connection
│   └── integrations-gemini-ai/ # Gemini AI client + batch utilities
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Key Files

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/videos.ts` — Videos table schema
- `artifacts/api-server/src/routes/videos.ts` — CRUD API routes
- `artifacts/api-server/src/routes/analyze.ts` — Gemini AI analysis routes
- `artifacts/api-server/src/routes/analytics.ts` — Analytics & trends routes
- `artifacts/video-analyzer/src/pages/dashboard.tsx` — Dashboard page
- `artifacts/video-analyzer/src/pages/videos/` — Video list, detail, create pages
- `artifacts/video-analyzer/src/pages/analytics.tsx` — Analytics page

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all lib packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client + Zod schemas

## Database

- Push schema: `pnpm --filter @workspace/db run push`
- Force push: `pnpm --filter @workspace/db run push-force`
- Analysis status enum: `pending | processing | completed | failed`
