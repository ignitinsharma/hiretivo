---
phase: 01-auth-onboarding
plan: 07
subsystem: auth
tags: [middleware, next-auth, jwt, route-guards, prisma, email-verification]

# Dependency graph
requires:
  - phase: 01-auth-onboarding plan 01
    provides: "SeekerProfile with situation and primaryRole fields; RecruiterProfile model"
  - phase: 01-auth-onboarding plan 04
    provides: "Seeker wizard server actions populate situation+primaryRole on SeekerProfile"
  - phase: 01-auth-onboarding plan 05
    provides: "Recruiter onboarding server action populates RecruiterProfile"
  - phase: 01-auth-onboarding plan 06
    provides: "Google OAuth signIn callback and auth export from src/auth.ts"
provides:
  - "JWT callback extended to include emailVerified in token and session.user"
  - "middleware.ts with route guards for all seeker/* and recruiter/* routes"
  - "Role-based cross-route redirect (RECRUITER->seeker = /recruiter/dashboard, SEEKER->recruiter = /seeker/jobs)"
  - "Onboarding completion gate: seeker without situation+primaryRole redirected to /seeker/onboarding"
  - "Onboarding completion gate: recruiter without RecruiterProfile redirected to /recruiter/onboarding"
  - "Email verification gate: /seeker/jobs and /recruiter/dashboard redirect to /auth/verify-email-pending when emailVerified is null"
affects:
  - "All subsequent phases — middleware guards all authenticated routes"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Auth.js v5 middleware pattern: export default auth(async (req) => {...}) wraps all route logic"
    - "Node.js runtime for middleware (export const runtime = 'nodejs') enables Prisma DB checks"
    - "emailVerified surfaced through JWT chain: DB -> token.emailVerified -> session.user.emailVerified"
    - "Onboarding check via DB query in middleware (not JWT) for real-time accuracy"

key-files:
  created:
    - middleware.ts
  modified:
    - src/auth.ts
    - src/types/next-auth.d.ts

key-decisions:
  - "Node.js runtime for middleware enables Prisma but sacrifices Edge speed — acceptable for V1 simplicity"
  - "emailVerified read from JWT token (set at login) rather than querying DB every request — reduces DB calls"
  - "Onboarding completion (situation/primaryRole/RecruiterProfile) checked via DB in middleware — always fresh, avoids stale JWT"
  - "Email gate applied only to /seeker/jobs and /recruiter/dashboard (not all routes) per D-03 spec — other routes accessible to unverified users"

patterns-established:
  - "Middleware pattern: public routes early exit -> unauthenticated redirect -> auth routes passthrough -> role check -> onboarding check -> email gate -> next()"

requirements-completed: [AUTH-03, AUTH-08]

# Metrics
duration: 2min
completed: 2026-04-02
---

# Phase 1 Plan 07: Route Guards Middleware Summary

**Next.js middleware with Auth.js v5 wrapping all seeker/recruiter routes — enforcing role, onboarding completion, and email verification gates via DB queries and JWT emailVerified field**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-02T11:26:37Z
- **Completed:** 2026-04-02T11:30:54Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Extended JWT callback in `src/auth.ts` to fetch and store `emailVerified` from DB; surfaced on `session.user.emailVerified` in session callback
- Added `emailVerified: Date | null` to Session.user type augmentation and `emailVerified?: Date | null` to JWT type augmentation in `src/types/next-auth.d.ts`
- Created `middleware.ts` at project root using `auth(async (req) => {...})` pattern with Node.js runtime for Prisma support
- Implemented all 8 route guard truths: unauthenticated redirect, cross-role redirect, onboarding completion gates, and email verification gates for `/seeker/jobs` and `/recruiter/dashboard`

## Task Commits

Each task was committed atomically:

1. **Task 1: Add emailVerified to JWT token and Session type** - `dc08cfd` (feat)
2. **Task 2: Create middleware.ts with auth, role, onboarding, and email-verification guards** - `896f263` (feat)

**Plan metadata:** (included in final docs commit)

## Files Created/Modified

- `middleware.ts` - Next.js middleware with all route guards; Node.js runtime; Auth.js v5 auth() pattern
- `src/auth.ts` - JWT callback extended with emailVerified fetch; session callback surfaces it on session.user
- `src/types/next-auth.d.ts` - Session.user and JWT interfaces augmented with emailVerified field

## Decisions Made

- Used Node.js runtime (`export const runtime = "nodejs"`) instead of Edge to support Prisma in middleware. Acceptable for V1 since we need DB queries for onboarding completion checks.
- emailVerified is stored in JWT (fetched at login) to avoid a DB query on every request. Onboarding completion (situation/primaryRole/RecruiterProfile) is still queried from DB in middleware for real-time accuracy.
- Email verification gate applies only to `/seeker/jobs` and `/recruiter/dashboard` per D-03 — not all authenticated routes. This allows unverified users to access onboarding and other settings pages.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Worktree was branched from `06fc41a` (before GSD work), missing all prior plan commits. Resolved by merging main branch (fast-forward). The merge pulled in all schema changes (situation, primaryRole fields), migrations, and prior auth work needed by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All seeker/* and recruiter/* routes are now guarded
- Phase 2 (Job Posting) routes under /recruiter/* will automatically require RECRUITER role + RecruiterProfile
- Phase 3 (Seeker Feed) routes under /seeker/jobs will require SEEKER role + Steps 1+2 + email verified
- Phase 1 is now complete — all 7 plans executed

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: middleware.ts at project root
- FOUND: src/auth.ts contains emailVerified in select, token assignment, and session assignment
- FOUND: src/types/next-auth.d.ts contains emailVerified in Session.user and JWT interfaces
- FOUND: commit dc08cfd (Task 1 — emailVerified in JWT)
- FOUND: commit 896f263 (Task 2 — middleware.ts)

---
*Phase: 01-auth-onboarding*
*Completed: 2026-04-02*
