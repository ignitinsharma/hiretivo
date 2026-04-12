---
phase: 06-interview-scheduling
plan: "03"
subsystem: api
tags: [nextjs, api-routes, interview, prisma, ratelimit, upstash, bcrypt, resend, zod]

# Dependency graph
requires:
  - phase: 06-01-interview-scheduling
    provides: RecruiterProfile with notification fields in Prisma schema and live DB
  - phase: 06-02-interview-scheduling
    provides: ScheduleInterviewSchema, email functions (sendInterviewScheduledEmail/Rescheduled/Cancelled), ChangePasswordSchema

provides:
  - "POST /api/recruiter/interviews — create interview, plan gate (FREE=403), rate-limited 10req/min, sends scheduled email"
  - "PATCH /api/recruiter/interviews/[id] — reschedule interview, sends rescheduled email"
  - "PATCH /api/recruiter/interviews/[id]/cancel — cancel interview (status=CANCELLED), sends cancellation email to seeker"
  - "GET /api/recruiter/interviews/upcoming — up to 4 next SCHEDULED interviews with job title and seeker name"
  - "GET /api/recruiter/settings — returns name, email, companyName, bio, 3 notification booleans"
  - "PATCH /api/recruiter/settings — saves profile or notification fields via z.union discriminated schema"
  - "PATCH /api/auth/change-password — verifies current password with bcrypt, hashes new at 12 rounds"

affects:
  - "06-04 — settings page frontend wires GET/PATCH /api/recruiter/settings"
  - "06-05 — schedule modal calls POST /api/recruiter/interviews"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Non-blocking fire-and-forget email sends: sendEmail().catch(console.error) — request not failed if email fails"
    - "z.union([ProfileSchema, NotifSchema]) with 'name' in data discriminant for PATCH settings"
    - "Ratelimit.slidingWindow(10, '1 m') keyed on session.user.id for interview creation"
    - "ScheduleInterviewSchema.omit({ applicationId: true }) for reschedule body validation"

key-files:
  created:
    - src/app/api/recruiter/interviews/route.ts
    - src/app/api/recruiter/interviews/[id]/route.ts
    - src/app/api/recruiter/interviews/[id]/cancel/route.ts
    - src/app/api/recruiter/interviews/upcoming/route.ts
    - src/app/api/recruiter/settings/route.ts
    - src/app/api/auth/change-password/route.ts
  modified: []

key-decisions:
  - "Plan gate checks PlanTier.FREE only — D-07 mentions STARTER but no STARTER enum value exists in codebase"
  - "Non-blocking email sends — interview creation/reschedule/cancel request succeeds even if Resend is temporarily unavailable"
  - "Settings PATCH uses z.union + 'name' in data discriminant — avoids separate endpoints for profile vs notification tabs"
  - "Change-password route open to both SEEKER and RECRUITER roles — any authenticated user can change their password"

patterns-established:
  - "Interview route ownership: recruiterId check on findFirst ensures recruiters only modify their own interviews"
  - "Fire-and-forget email: .catch() logs error, never throws to caller"

requirements-completed: [SCHED-04, SCHED-05, SCHED-06, SCHED-07, SCHED-08, SCHED-09]

# Metrics
duration: 1min
completed: 2026-04-12
---

# Phase 06 Plan 03: Interview Scheduling API Routes Summary

**Six API routes wired for interview CRUD (create/reschedule/cancel/upcoming), recruiter settings GET+PATCH, and password change — all typed, gated, rate-limited, and validated with Zod**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-04-12T07:47:39Z
- **Completed:** 2026-04-12T07:48:49Z
- **Tasks:** 3 (1a, 1b, 2)
- **Files modified:** 6

## Accomplishments

- Created `POST /api/recruiter/interviews` with Upstash Ratelimit (10 req/min per userId), PlanTier.FREE gate (403), application ownership check, Prisma interview.create, and non-blocking sendInterviewScheduledEmail
- Created `PATCH /api/recruiter/interviews/[id]` (reschedule) and `PATCH /api/recruiter/interviews/[id]/cancel` — both verify recruiterId ownership, update status, send appropriate lifecycle emails
- Created `GET /api/recruiter/interviews/upcoming` returning 4 soonest SCHEDULED interviews with application.job.title and application.seeker.name for dashboard widget
- Created `GET+PATCH /api/recruiter/settings` using z.union discriminant to handle both profile fields and notification toggles in a single endpoint
- Created `PATCH /api/auth/change-password` with bcrypt.compare (current password verification) and bcrypt.hash at 12 rounds — available to all authenticated users
- `pnpm tsc --noEmit` exits 0 — zero TypeScript errors across all 6 files

## Task Commits

Each task was committed atomically:

1. **Task 1a: Interview CRUD routes — create, reschedule, cancel** - `8e42704` (feat)
2. **Task 1b: Upcoming interviews GET route** - `db95509` (feat)
3. **Task 2: Settings GET/PATCH and change-password routes** - `0621f31` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/app/api/recruiter/interviews/route.ts` — POST: create interview with plan gate, rate limiting, ownership check, email
- `src/app/api/recruiter/interviews/[id]/route.ts` — PATCH: reschedule interview with ownership check and email
- `src/app/api/recruiter/interviews/[id]/cancel/route.ts` — PATCH: cancel interview, seeker-only cancellation email
- `src/app/api/recruiter/interviews/upcoming/route.ts` — GET: 4 soonest SCHEDULED interviews for dashboard
- `src/app/api/recruiter/settings/route.ts` — GET/PATCH: recruiter profile and notification settings
- `src/app/api/auth/change-password/route.ts` — PATCH: bcrypt-based password change for credentials users

## Decisions Made

- Plan gate checks `PlanTier.FREE` only — D-07 references "FREE and STARTER" but no STARTER value exists in the PlanTier enum; comment in route documents this discrepancy
- Non-blocking email sends — interview lifecycle emails use `.catch(console.error)` so a Resend outage cannot fail the primary operation
- Settings PATCH uses `z.union([RecruiterProfileSettingsSchema, NotificationSettingsSchema])` with `"name" in data` discriminant — avoids separate PUT profile and PUT notifications endpoints
- Change-password route does not check role — any authenticated user (SEEKER or RECRUITER) with a `passwordHash` may change their password; credentials-less OAuth accounts receive a descriptive 400

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All 6 API routes are live and typed — downstream frontend plans (06-04, 06-05) can call them immediately
- `POST /api/recruiter/interviews` enforces plan gates and rate limits as specified; test with a FREE-plan recruiter session to confirm 403 response
- Settings tabs (profile, notifications) can call GET then PATCH to load and save all fields
- Change-password route handles OAuth-only accounts gracefully (400 with descriptive message)

---
*Phase: 06-interview-scheduling*
*Completed: 2026-04-12*
