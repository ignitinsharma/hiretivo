---
phase: 02-job-posting
plan: "04"
subsystem: api
tags: [next-api, prisma, ownership-verification, transaction, patch, delete]

# Dependency graph
requires:
  - phase: 02-job-posting
    provides: API routes foundation (Plan 03), Skill model (Plan 01)
provides:
  - PATCH /api/jobs/[id] with ownership verification and atomic skill replacement
  - DELETE /api/jobs/[id] with ownership verification
affects: [My Jobs page CRUD actions, PostJobModal edit mode]

# Tech tracking
tech-stack:
  added: []
  patterns: [Ownership check via recruiterId comparison, $transaction for skill replacement, params not Promise in Next.js 14]

key-files:
  created: [src/app/api/jobs/[id]/route.ts]
  modified: []

key-decisions:
  - "Next.js 14 params is object not Promise — no await needed"
  - "Skills replacement uses deleteMany + createMany in transaction for atomicity"
  - "Status toggle: client sends desired status directly, no server-side toggle detection"

patterns-established:
  - "Ownership guard: findUnique select recruiterId, compare to session.user.id, return 403"
  - "PATCH with optional skills: if skills provided, transaction replaces all; otherwise simple update"

requirements-completed: [JOBS-03, JOBS-04, JOBS-05]

# Metrics
duration: 3min
completed: 2026-04-06T00:15:00Z
---

# Phase 02: Job Posting — Plan 04 Summary

**PATCH/DELETE /api/jobs/[id] routes with ownership verification and atomic skill replacement**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-06T00:12:00Z
- **Completed:** 2026-04-06T00:15:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- PATCH /api/jobs/[id] updates job fields with ownership verification
- Atomic skill replacement via $transaction (deleteMany + createMany) when skills provided
- DELETE /api/jobs/[id] removes job with ownership check, cascades to related records
- Both handlers return 401/403/404 correctly

## Task Commits

1. **Task 1: Create PATCH /api/jobs/[id] and DELETE /api/jobs/[id] routes** - `ba41465` (feat)

**Plan metadata:** `ba41465` (docs: complete plan)

## Files Created/Modified
- `src/app/api/jobs/[id]/route.ts` - PATCH (edit/toggle) and DELETE handlers

## Decisions Made
- Next.js 14 params is `{ id: string }` not `Promise<{ id: string }>` — no await needed
- Used Zod v4 `.issues` instead of `.errors` (carried over from Plan 03 fix)

## Deviations from Plan

None - plan executed exactly as specified

## Issues Encountered
None

## Next Phase Readiness
- PATCH endpoint enables PostJobModal edit mode (Plan 05) and My Jobs toggle (Plan 06)
- DELETE endpoint enables My Jobs delete action (Plan 06)

---
*Phase: 02-job-posting*
*Completed: 2026-04-06*
