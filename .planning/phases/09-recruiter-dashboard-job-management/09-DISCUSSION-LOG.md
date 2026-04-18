# Phase 9: Recruiter Dashboard & Job Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 09-recruiter-dashboard-job-management
**Areas discussed:** Dashboard data API, Sidebar real-time counts, Application trend chart, Dead UI removal scope

---

## Dashboard Data API

| Option | Description | Selected |
|--------|-------------|----------|
| Single aggregated endpoint | One /api/recruiter/dashboard returning all stats, recent applicants, and trend data | ✓ |
| Separate endpoints per section | Independent endpoints for stats, applicants, and trend data | |
| Hybrid: reuse existing + new for trend | Stats from existing endpoints, new endpoint only for trend | |

**User's choice:** Single aggregated endpoint
**Notes:** User confirmed this matches their preference for simplicity.

---

## Sidebar Real-time Counts

| Option | Description | Selected |
|--------|-------------|----------|
| TanStack Query + shared API | Sidebar queries same /api/recruiter/dashboard, 5min stale time, refetch on focus | ✓ |
| Zustand store from dashboard data | Counts stored in Zustand, populated by dashboard API response | |
| Dedicated sidebar endpoint | Separate /api/recruiter/sidebar-counts endpoint | |

**User's choice:** TanStack Query + shared API (recommended)
**Notes:** User said "go with the best approach according to you" — selected recommended approach.

---

## Application Trend Chart

| Option | Description | Selected |
|--------|-------------|----------|
| Area chart (gradient) | Smooth area chart with gradient fill — matches current SVG look | ✓ |
| Line chart | Clean line, no fill — easier to read exact values | |
| Bar chart (weekly) | Bars per week — good for comparing discrete periods | |

**User's choice:** Area chart (gradient)
**Notes:** Matches the current static SVG visual style but with real data.

---

## Dead UI Removal Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full cleanup as described | Remove analytics route, Talent Pool link, Settings link, grid/list toggle, filter bar, hardcoded user data, hardcoded greeting | ✓ |
| Full cleanup but keep filter bar | Same as above but keep search + status filter on jobs page | |
| Minimal: only requirements specify | Only remove analytics route and grid/list toggle | |

**User's choice:** Full cleanup as described
**Notes:** Full scope removal including replacing hardcoded user name and sidebar avatar with real data.

---

## the agent's Discretion

- Exact API response shape and field names
- Chart tooltip and axis formatting
- Skeleton animation and layout details
- Whether to add a refetch button on dashboard
- Empty state designs (0 jobs, 0 applicants)

## Deferred Ideas

- Talent Pool feature — explicitly out of scope per REQUIREMENTS.md
- Analytics page replacement — deferred to Phase 13 (Recruiter Intelligence)
- Settings restructure — Phase 10