---
phase: 13-recruiter-intelligence
plan: "02"
subsystem: recruiter-analytics
tags: [analytics, api, tanstack-query, recharts, tabs]
dependency_graph:
  requires:
    - 13-01 (OpenRouter singleton, Prisma schema with ClickEvent and BoostedJob)
  provides:
    - GET /api/recruiter/jobs/[id]/analytics (viewCount, applyRate, avgMatchScore, topSkills, viewTrend)
    - /recruiter/jobs/[id] page with Overview/Analytics Tabs
    - JobAnalyticsTab client component with 4 metric cards and 30-day bar chart
    - useFetchAnalytics TanStack Query hook
  affects:
    - Recruiter job management flow (new per-job detail page)
tech_stack:
  added:
    - recharts (via shadcn chart.tsx ChartContainer/ChartTooltip)
  patterns:
    - Promise.all parallel DB aggregation
    - Manual date bucketing (avoiding prisma groupBy on DateTime)
    - Typed METRIC_CARD_CONFIGS data array with getValue functions
    - Server Component page embedding Client Component analytics tab
key_files:
  created:
    - src/modules/recruiter/jobs/types/analytics.types.ts
    - src/lib/validations/analytics.schema.ts
    - src/app/api/recruiter/jobs/[id]/analytics/route.ts
    - src/modules/recruiter/jobs/queries/use-fetch-analytics.ts
    - src/modules/recruiter/jobs/components/JobAnalyticsTab.tsx
    - src/app/recruiter/jobs/[id]/page.tsx
  modified: []
decisions:
  - "Return 404 (not 403) for unauthorized job access to avoid leaking job existence (ASVS V4.2.1 - T-13-05)"
  - "Manual day-by-day loop for 30-day trend instead of groupBy to avoid timestamp granularity issues"
  - "Promise.all for all 5 DB aggregation queries in analytics route for performance"
  - "Server Component page with Client Component analytics tab — standard Next.js App Router pattern"
metrics:
  duration: "~18 minutes"
  completed: "2026-04-19"
  tasks_completed: 2
  tasks_total: 2
  files_created: 6
  files_modified: 0
---

# Phase 13 Plan 02: Job Analytics Back-end and UI Summary

**One-liner:** Per-job analytics API aggregating ClickEvent views, apply rate, avg match score, and top skills via Promise.all, with a tabbed page and Recharts bar chart component.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Analytics type, Zod schema, and API route | 12a2d1c | Done |
| 2 | TanStack Query hook, JobAnalyticsTab component, and per-job page with Tabs | 59f623a | Done |

## What Was Built

### Analytics API Route (`GET /api/recruiter/jobs/[id]/analytics`)
- Auth check (401 if no session), role check (403 if not RECRUITER)
- Param validation via `AnalyticsParamsSchema` (Zod, min 1 max 100)
- Ownership check returns 404 for unauthorized or non-existent jobs (T-13-05 mitigated)
- 5 parallel DB queries via `Promise.all`: viewCount, applicationCount, avgMatchScore, applicationsWithSkills, rawTrendEvents
- Apply rate: `(applicationCount / viewCount) * 100` rounded to 1 decimal, 0 if no views
- Top 5 skills: frequency map from seeker profiles across all applicants
- 30-day view trend: manual date loop from `thirtyDaysAgo` to today — fills empty days with 0

### Analytics Types
- `ViewTrendPoint`: `{ date: string; views: number }`
- `JobAnalyticsResponse`: `{ viewCount, applyRate, avgMatchScore, topSkills, viewTrend }`

### `useFetchAnalytics` Hook
- TanStack Query hook wrapping `GET /api/recruiter/jobs/[id]/analytics`
- `staleTime: 5 minutes`, `enabled: !!jobId`

### `JobAnalyticsTab` Client Component
- Typed `METRIC_CARD_CONFIGS` array outside component (CLAUDE.md §15.4)
- Named `CARD_BASE` className constant (CLAUDE.md §15.2)
- All 3 states handled: skeleton loading, error with retry, data display (CLAUDE.md §15.7)
- 30-day bar chart using `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` from shadcn chart.tsx
- Recharts `BarChart` + `Bar` with `fill="var(--color-views)"` and `radius={[4, 4, 0, 0]}`

### Per-Job Page (`/recruiter/jobs/[id]`)
- Server Component — fetches job title and verifies ownership via Prisma directly
- Shows 404-style message for missing or unauthorized jobs
- `Tabs` with "Overview" (placeholder) and "Analytics" (`<JobAnalyticsTab jobId={id} />`)
- Consistent header with `SidebarToggle` matching other recruiter pages

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Coverage

| Threat ID | Mitigation | Status |
|-----------|------------|--------|
| T-13-05 (Information Disclosure) | `job.recruiterId === session.user.id` ownership check; returns 404 not 403 | Implemented |
| T-13-06 (Tampering) | `AnalyticsParamsSchema` validates `id` param before any DB query | Implemented |
| T-13-07 (DoS — large dataset) | Accepted — dataset bounded per-job, existing indexes on ClickEvent.jobId | Accepted |

## Known Stubs

- Overview tab content: `<p>Job overview and management coming soon.</p>` — intentional placeholder; scoped to Phase 13 analytics focus only; will be wired in a future phase when job management UI is built.

## Self-Check: PASSED

Files exist:
- FOUND: src/modules/recruiter/jobs/types/analytics.types.ts
- FOUND: src/lib/validations/analytics.schema.ts
- FOUND: src/app/api/recruiter/jobs/[id]/analytics/route.ts
- FOUND: src/modules/recruiter/jobs/queries/use-fetch-analytics.ts
- FOUND: src/modules/recruiter/jobs/components/JobAnalyticsTab.tsx
- FOUND: src/app/recruiter/jobs/[id]/page.tsx

Commits exist:
- FOUND: 12a2d1c (Task 1)
- FOUND: 59f623a (Task 2)

Build: `pnpm build` exits 0, ✓ Compiled successfully, ✓ Generating static pages (50/50)
