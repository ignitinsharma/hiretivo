---
phase: 14-recruiter-analytics-dashboard
plan: "02"
subsystem: recruiter-analytics
tags: [analytics, api, tanstack-query, prisma, rate-limit, billing]
dependency_graph:
  requires: [14-01]
  provides: [analytics-api, analytics-types, analytics-query-hook]
  affects: [14-03]
tech_stack:
  added: []
  patterns: [prisma-groupBy, prisma-Promise.all, date-fns-startOfMonth, tanstack-query-enabled-flag]
key_files:
  created:
    - src/modules/recruiter/analytics/types/analytics.types.ts
    - src/app/api/recruiter/analytics/route.ts
    - src/modules/recruiter/analytics/queries/use-fetch-recruiter-analytics.ts
  modified: []
decisions:
  - "conversionPct returns null for first stage and when previous stage count is 0 (no divide-by-zero)"
  - "Billing period falls back to startOfMonth(now) via date-fns when recruiter has no subscription record"
  - "dataFetchRateLimiter keyed on userId (not IP) per T-14-07 — auth user id gives tighter per-user control"
  - "creditsUsed counts only source='talent_pool' unlocks within billing period; all-time unlockCount is separate for funnel"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-27T00:00:00Z"
  tasks_completed: 3
  tasks_total: 3
  files_created: 3
  files_modified: 0
---

# Phase 14 Plan 02: Analytics Backend — Types, Route, and Query Hook

**One-liner:** GET /api/recruiter/analytics returning 6-stage funnel with conversion %, period-scoped credit usage via getUnlockQuota, and top-5 skills from unlocked engineer graph — guarded by auth/role/rate-limit, returned typed via RecruiterAnalyticsResponse.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Define RecruiterAnalyticsResponse types | 3f2bad5 | src/modules/recruiter/analytics/types/analytics.types.ts |
| 2 | Implement GET /api/recruiter/analytics route | 3451b65 | src/app/api/recruiter/analytics/route.ts |
| 3 | TanStack Query hook for recruiter analytics | 5e7b446 | src/modules/recruiter/analytics/queries/use-fetch-recruiter-analytics.ts |

## Deviations from Plan

None — plan executed exactly as written.

## Verification

```
# Types file
grep -q "RecruiterAnalyticsResponse" src/modules/recruiter/analytics/types/analytics.types.ts && grep -q "FunnelStage" src/modules/recruiter/analytics/types/analytics.types.ts && echo PASS
# → PASS

# Route acceptances (all conditions)
grep -q "export async function GET" src/app/api/recruiter/analytics/route.ts  # PASS
grep -q "status: 401" src/app/api/recruiter/analytics/route.ts                # PASS
grep -q "status: 403" src/app/api/recruiter/analytics/route.ts                # PASS
grep -q "status: 429" src/app/api/recruiter/analytics/route.ts                # PASS
grep -q "groupBy" src/app/api/recruiter/analytics/route.ts                    # PASS
grep -q "getUnlockQuota" src/app/api/recruiter/analytics/route.ts             # PASS
grep -q "dataFetchRateLimiter" src/app/api/recruiter/analytics/route.ts       # PASS
grep -q "talent_pool" src/app/api/recruiter/analytics/route.ts                # PASS
grep -q "job: { recruiterId" src/app/api/recruiter/analytics/route.ts         # PASS
grep -q "rawCounts\[i - 1\] === 0" src/app/api/recruiter/analytics/route.ts  # PASS
grep -q "startOfMonth" src/app/api/recruiter/analytics/route.ts               # PASS (date-fns)
! grep -q "new Date(now.getFullYear" src/app/api/recruiter/analytics/route.ts # PASS

# Hook acceptances
grep -q "useQuery" src/modules/recruiter/analytics/queries/use-fetch-recruiter-analytics.ts   # PASS
grep -q "recruiter-analytics" src/modules/recruiter/analytics/queries/use-fetch-recruiter-analytics.ts # PASS
grep -q "enabled" src/modules/recruiter/analytics/queries/use-fetch-recruiter-analytics.ts    # PASS

# TypeScript — zero errors in new files
npx tsc --noEmit 2>&1 | grep "api/recruiter/analytics/route"      # empty → PASS
npx tsc --noEmit 2>&1 | grep "use-fetch-recruiter-analytics"       # empty → PASS
```

All must-haves confirmed:
- `GET /api/recruiter/analytics` returns funnel stages with counts + conversionPct, creditsUsed/creditsRemaining/totalQuota, topSkills
- Route is auth-gated (401), RECRUITER-gated (403), rate-limited with dataFetchRateLimiter (429)
- Funnel uses prisma.application.groupBy + prisma.engineerUnlock.count in Promise.all
- conversionPct is null when i===0 or previous stage count is 0
- creditsUsed counts source='talent_pool' unlocks within billing period; quota from getUnlockQuota
- All application queries scoped via `where: { job: { recruiterId } }` (cross-recruiter isolation)
- date-fns startOfMonth used for billing-period fallback (CLAUDE.md 1.3 compliance)

## Known Stubs

None — all data is wired to real Prisma queries.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: mitigated | src/app/api/recruiter/analytics/route.ts | T-14-04 (auth), T-14-05 (role), T-14-06 (cross-recruiter isolation), T-14-07 (rate limit on userId) — all mitigated per threat register |

## Self-Check: PASSED

- src/modules/recruiter/analytics/types/analytics.types.ts — FOUND
- src/app/api/recruiter/analytics/route.ts — FOUND
- src/modules/recruiter/analytics/queries/use-fetch-recruiter-analytics.ts — FOUND
- Task commits 3f2bad5, 3451b65, 5e7b446 — all present in git log
