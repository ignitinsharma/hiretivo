---
phase: 12-seeker-dashboard-engagement
plan: "04"
type: execute
wave: 3
subsystem: seeker-dashboard-ui
tags: [seeker, dashboard, tanstack-query, digest, skill-gap, header]
dependency_graph:
  requires:
    - 12-01 seeker dashboard API and types
    - 12-02 feed enrichment
    - 12-03 digest route and cron
  provides:
    - SKR-01 seeker dashboard shows real data
    - SKR-02 job-detail views tracked
    - SKR-04 seeker nav polish
    - ENG-01 skill gap tracker visible on dashboard
    - ENG-02 digest toggle on dashboard
    - ENG-03 profile strength live
  affects: []
tech_stack:
  added:
    - src/modules/seeker/dashboard/types/dashboard.types.ts
    - src/lib/seeker-dashboard.ts
    - src/app/api/seeker/dashboard/route.ts
    - src/app/api/seeker/digest/route.ts
    - src/modules/seeker/dashboard/components/SeekerDashboardSidebar.tsx
    - prisma/migrations/20260418000000_add_digest_enabled/migration.sql
  patterns:
    - Single-query client container pattern (SeekerDashboardSidebar)
    - Presentational card components with typed props
    - TanStack Query + useMutation for digest toggle with query invalidation
    - Server Component dashboard page with auth() session for greeting
key_files:
  created:
    - src/modules/seeker/dashboard/types/dashboard.types.ts
    - src/lib/seeker-dashboard.ts
    - src/app/api/seeker/dashboard/route.ts
    - src/app/api/seeker/digest/route.ts
    - src/modules/seeker/dashboard/components/SeekerDashboardSidebar.tsx
    - prisma/migrations/20260418000000_add_digest_enabled/migration.sql
  modified:
    - src/modules/seeker/dashboard/components/ProfileStrengthCard.tsx
    - src/modules/seeker/dashboard/components/QuickStatsCard.tsx
    - src/modules/seeker/dashboard/components/JobAlertsPromo.tsx
    - src/app/seeker/dashboard/page.tsx
    - src/components/layout/SeekerHeader.tsx
    - prisma/schema.prisma
decisions:
  - "digestEnabled added to SeekerProfile (not User) — schema field missing from this worktree; added via migration"
  - "Greeting uses session.user.name split on first space for compact first-name display"
  - "Nav filtered client-side via SEEKER_NAV_ITEMS.filter() to exclude /seeker/settings — Settings stays in dropdown only"
  - "Bell icon removed from SeekerHeader — notifications removed globally in Phase 08"
  - "SeekerDashboardSidebar renders its own loading skeleton so page.tsx stays a Server Component"
metrics:
  duration: "~20 minutes"
  completed_date: "2026-04-18"
  tasks_completed: 2
  files_changed: 12
---

# Phase 12 Plan 04: Seeker Dashboard UI Widgets Summary

**One-liner:** Replaced all static seeker dashboard mocks with live TanStack Query-backed widgets, added digest toggle + skill-gap tracker card, and applied bolder seeker header nav polish.

## What Was Built

### Task 1: Single-query dashboard sidebar + live widget cards

**Dependencies created (Rule 3 — blocking):**
- `src/modules/seeker/dashboard/types/dashboard.types.ts` — `SeekerDashboardData` contract with `ProfileStrengthSummary`, `QuickStatsSummary`, `SkillGapSummary`, `DigestPreferenceSummary`
- `src/lib/seeker-dashboard.ts` — pure `getMissingSkillNames()` helper + async `getProfileStrengthSummary()`, `getSkillGapSummary()`, `getQuickStatsSummary()` aggregators
- `src/app/api/seeker/dashboard/route.ts` — authenticated GET, SEEKER role gate, 30 req/min rate limit, parallel aggregation, returns `{ data: SeekerDashboardData }`
- `src/app/api/seeker/digest/route.ts` — GET + PATCH for `digestEnabled`, Zod-validated body, rate limited
- `prisma/schema.prisma` + migration — added `digestEnabled Boolean @default(false)` to `SeekerProfile`

**SeekerDashboardSidebar.tsx:**
- Single `useQuery(['seeker-dashboard-summary'])` fetch for all sidebar data
- `useMutation` for `PATCH /api/seeker/digest` with query invalidation on success
- Loading skeleton, error fallback, coordinates all three child cards
- Renders as `<aside>` with correct `lg:w-80 shrink-0` layout

**ProfileStrengthCard.tsx:**
- Now accepts `profileStrength: ProfileStrengthSummary` props
- Uses shadcn `<Progress>` component instead of handwritten width bar
- `strengthLabel()` helper maps percentage to Starter/Basic/Intermediate/Strong/Expert
- CTA label and href driven by API `ctaLabel` / `ctaHref` per D-03

**QuickStatsCard.tsx:**
- Accepts `quickStats: QuickStatsSummary` props
- Typed `STAT_ROWS` array with per-stat icon, label, colorClass — rendered via `.map()`
- No more mock data import from `mock-dashboard-data.ts`

**JobAlertsPromo.tsx:**
- Repurposed from static promo into Phase 12 engagement card
- Weekly digest toggle with shadcn `<Switch>` and `<Label>`, disabled while mutation pending
- Skill-gap tracker section shows top missing skills with job frequency counts
- Conditional rendering: skill-gap section only shown when `skillGap.items.length > 0`

### Task 2: Dashboard page wiring + seeker header polish

**src/app/seeker/dashboard/page.tsx:**
- Converted to `async` Server Component using `auth()` for session
- Greeting uses `session?.user?.name?.split(' ')[0] ?? 'there'` — no hardcoded name
- Static mock aside replaced with `<SeekerDashboardSidebar />`

**src/components/layout/SeekerHeader.tsx:**
- `NAV_ITEMS` filtered from `SEEKER_NAV_ITEMS` to exclude `/seeker/settings` — only Jobs + Applied Jobs in nav per D-18
- Active link: `font-bold` + `border-b-2 border-primary` for stronger visual emphasis (was `font-medium`)
- Removed Bell notification button (notifications removed globally Phase 08)
- Avatar dropdown shows user name context row + Settings link + Sign Out
- Dynamic initials computed via `getInitials()` from `session.user.name`
- `aria-label` and `aria-current="page"` added for accessibility

## Deviations from Plan

### Auto-added dependencies (Rule 3 — blocking)

**[Rule 3 - Blocking dependency] Created dashboard types, lib, and API routes**
- **Found during:** Task 1 setup
- **Issue:** Plans 12-01 and 12-03 ran in different wave-1 worktrees. This worktree (wave-3) did not have `dashboard.types.ts`, `seeker-dashboard.ts`, `/api/seeker/dashboard`, or `/api/seeker/digest` — all required for SeekerDashboardSidebar to compile.
- **Fix:** Created all four dependency files matching the contracts defined in the 12-01 and 12-03 SUMMARYs exactly. Added `digestEnabled` to `SeekerProfile` via schema edit + migration since the schema field was also absent.
- **Files created:** `dashboard.types.ts`, `seeker-dashboard.ts`, `dashboard/route.ts`, `digest/route.ts`, `migration.sql`
- **Commits:** `e63b8e4`

## Known Stubs

None — all dashboard data flows from live DB queries through the API. Profile strength, quick stats, skill gap, and digest preference are all wired.

## Threat Flags

None — no new network endpoints beyond the two authenticated + rate-limited API routes already covered by the plan's scope.

## Self-Check

- [x] `src/modules/seeker/dashboard/types/dashboard.types.ts` — created
- [x] `src/lib/seeker-dashboard.ts` — created
- [x] `src/app/api/seeker/dashboard/route.ts` — created
- [x] `src/app/api/seeker/digest/route.ts` — created
- [x] `src/modules/seeker/dashboard/components/SeekerDashboardSidebar.tsx` — created
- [x] `src/modules/seeker/dashboard/components/ProfileStrengthCard.tsx` — props-driven
- [x] `src/modules/seeker/dashboard/components/QuickStatsCard.tsx` — props-driven
- [x] `src/modules/seeker/dashboard/components/JobAlertsPromo.tsx` — digest toggle + skill gap
- [x] `src/app/seeker/dashboard/page.tsx` — dynamic greeting, SeekerDashboardSidebar
- [x] `src/components/layout/SeekerHeader.tsx` — bolder nav, no Bell, no Settings tab
- [x] ESLint: no errors on all modified files
- [x] Commits: e63b8e4 (task 1), ad3d4f9 (task 2)

## Self-Check: PASSED
