# Phase 14: Recruiter Analytics Dashboard — Context

**Gathered:** 2026-05-26
**Status:** Ready for planning
**Source:** Product brainstorm — v1.1 Trust & Conversion milestone
**Depends on:** Phase 12 (pipeline kanban at /recruiter/pipeline), Phase 10 (EngineerUnlock model), Phase 11 (Application model with source/status)

<domain>
## Phase Boundary

Phase 14 adds a hiring funnel analytics tab to the existing /recruiter/pipeline page. The goal is to show recruiters their ROI (credits spent → hires) so they understand the value of paid plans and upgrade from FREE → STARTER/GROWTH/SCALE.

All data already exists in Application + EngineerUnlock tables. No new Prisma models required. This is a pure read/aggregate/display phase.

**In scope:**
- "Analytics" tab on /recruiter/pipeline (alongside existing "Pipeline" kanban tab)
- GET /api/recruiter/analytics — new route aggregating Application + EngineerUnlock data
- `src/lib/analytics/recruiter.ts` — pure calculation functions (testable, no DB calls)
- Funnel: Unlocked → Applied/Invited → Interviewing → Offered → Hired (counts + conversion %)
- Avg days per stage (Application status transition approximation)
- Credits used vs quota remaining (current billing period)
- Top 5 skills across unlocked engineers

**Out of scope:**
- Time-range picker / date filtering (show all-time for now)
- CSV export of analytics data (deferred)
- Per-job analytics breakdown (deferred)
- Comparison between billing periods (deferred)
- Real-time updates / WebSocket (static fetch on tab open)

</domain>

<decisions>
## Implementation Decisions (LOCKED)

### Tab Structure on /recruiter/pipeline
Add a tab bar at the top with two options: "Pipeline" | "Analytics"
Default active: "Pipeline" (no behavior change for existing kanban).
Analytics tab renders the analytics dashboard below the tab bar.
Use URL hash or query param `?tab=analytics` to preserve tab state on refresh.

### API Route: GET /api/recruiter/analytics
```
GET /api/recruiter/analytics
Authorization: session required, role RECRUITER
Rate limit: dataFetchRateLimiter (30/min)
Response: {
  funnel: FunnelStage[],
  avgDaysPerStage: StageTime[],
  creditsUsed: number,
  quotaRemaining: number | null,   // null = unlimited (SCALE plan)
  topSkills: { skill: string; count: number }[]
}
```

### Funnel Stage Definition
Map ApplicationStatus to funnel stages:
| Funnel Stage | ApplicationStatus values |
|---|---|
| Unlocked | EngineerUnlock records for this recruiter |
| Applied/Invited | Application.status = APPLIED (source=SEEKER_APPLIED or RECRUITER_INITIATED) |
| Interviewing | Application.status = INTERVIEW |
| Offered | Application.status = OFFER |
| Hired | Application.status = HIRED |

Conversion % = stage_count / unlocked_count × 100 (funnel denominator is always total unlocks).

### Avg Days Per Stage Approximation
Application table has `createdAt` and `updatedAt`. Use `updatedAt - createdAt` as a rough proxy for time-in-pipeline per application. Group by current status. Average per status bucket.
Note: This is an approximation — we don't store per-status transition timestamps. Flag in comments. Add exact transition logging as a future enhancement.

### Credits Used vs Quota
EngineerUnlock count where `recruiterId = session.user.id` AND `createdAt >= billing period start`.
Billing period start: use `recruiterProfile.currentPeriodStart` if available, else first day of current month.
Quota from plan tier (use existing `getUnlockQuota()` helper from src/lib/billing/access.ts or equivalent).

### Top Skills Across Unlocked Engineers
Fetch engineer IDs from EngineerUnlock for this recruiter → fetch their SeekerSkill records → count by skill name → sort desc → take top 5.

### Pure Calculation Functions (src/lib/analytics/recruiter.ts)
All math in pure functions with typed inputs/outputs. No Prisma calls inside this file.
```ts
computeFunnel(unlockCount: number, applicationsByStatus: Record<string, number>): FunnelStage[]
computeAvgDaysPerStage(applications: { status: string; createdAt: Date; updatedAt: Date }[]): StageTime[]
computeTopSkills(skills: string[]): { skill: string; count: number }[]
```

### UI Layout for Analytics Tab
Three metric cards row (Credits Used / Quota Remaining / Conversion Rate to Hire).
Funnel visualization: horizontal bar chart using CSS widths (no chart library — avoid adding dependencies). Each row: stage name | count | conversion % | bar.
Avg days table: stage | avg days.
Top skills: pill list.

### No New Schema
Zero Prisma changes in this phase.

### Claude's Discretion
- Exact billing period start date calculation (if `currentPeriodStart` not on RecruiterProfile, use first day of current month as fallback)
- Whether to use TanStack Query for the analytics fetch (yes — consistent with other recruiter data fetching)
- Skeleton loading state design for the analytics tab

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pipeline Page (read + modify)
- `src/app/recruiter/pipeline/` — existing kanban page and PipelineBoard component; add Analytics tab

### Application Model
- `prisma/schema.prisma` — Application model fields (status enum, createdAt, updatedAt, recruiterId, source)
- `src/constants/enums.ts` — ApplicationStatus enum values

### EngineerUnlock Model
- `prisma/schema.prisma` — EngineerUnlock model (recruiterId, engineerId, createdAt, source)

### Billing/Quota
- `src/lib/billing/access.ts` or equivalent — `getUnlockQuota()`, `canAccessTalentPool()` helpers (locate exact path)
- `src/constants/billing.ts` — plan tier quota definitions

### Rate Limiting
- `src/lib/rate-limit.ts` — `dataFetchRateLimiter` (use for new analytics route)

### Design System
- `DESIGN.md` — brand tokens, component patterns (cards, tabs)
- `CLAUDE.md` — mobile-first rules, no shadows, border-only depth

### Prior Phase Patterns
- `src/app/api/recruiter/talent/route.ts` — recruiter API auth pattern
- `.planning/phases/12-ai-review-feedback/12-03-PLAN.md` — pipeline kanban implementation (understand tab structure)

</canonical_refs>

<deferred>
## Deferred

- Date range picker for analytics (show all-time for v1)
- Per-job breakdown analytics
- CSV export
- Billing period comparison view
- Exact per-status transition timestamps (requires adding status history table)
- Real-time analytics (WebSocket or SSE)

</deferred>

---
*Phase: 14-recruiter-analytics-dashboard*
*Context gathered: 2026-05-26*
*Branch: feat/pivot-2.0*
