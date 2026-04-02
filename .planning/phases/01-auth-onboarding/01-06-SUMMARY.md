---
phase: 01-auth-onboarding
plan: 06
subsystem: auth
tags: [nextauth, oauth, google, prisma, role-selection, server-actions]

# Dependency graph
requires:
  - phase: 01-auth-onboarding
    provides: Auth.js config with callbacks, Prisma User model with seekerProfile/recruiterProfile relations

provides:
  - Google OAuth new-user role-selection redirect via signIn callback in Auth.js
  - /auth/select-role page with SEEKER/RECRUITER two-button UI
  - setUserRole server action that updates User.role in DB and returns onboarding redirect

affects:
  - 01-auth-onboarding plan 07 (middleware route guards — select-role redirect is a gate before onboarding)
  - seeker and recruiter onboarding flows

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Auth.js signIn callback returns URL string to redirect user (Auth.js v5 pattern)
    - Profile-existence check to detect new Google OAuth users (avoids default-SEEKER ambiguity)
    - Server action with session auth guard returns discriminated union result type

key-files:
  created:
    - src/app/auth/select-role/page.tsx
    - src/app/actions/auth/set-role.ts
  modified:
    - src/auth.ts

key-decisions:
  - "Google new-user detection via seekerProfile/recruiterProfile existence rather than role value — role defaults to SEEKER so value alone can't detect unset state"
  - "signIn callback returns URL string to trigger Auth.js v5 redirect — avoids separate redirect middleware for this case"
  - "setUserRole server action uses session auth guard — no userId param needed, server-side identity"

patterns-established:
  - "Auth.js signIn callback: return URL string redirects user, return true allows, return false/Error rejects"
  - "New Google user detection: check profile model existence, not role value"

requirements-completed: [AUTH-02, AUTH-03]

# Metrics
duration: 10min
completed: 2026-04-02
---

# Phase 01 Plan 06: Google OAuth Role Selection Summary

**Auth.js signIn callback redirects new Google users to /auth/select-role page where SEEKER/RECRUITER choice persists to DB and routes to onboarding**

## Performance

- **Duration:** 10 min
- **Started:** 2026-04-02T11:15:00Z
- **Completed:** 2026-04-02T11:25:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added signIn callback to Auth.js that intercepts Google OAuth logins and checks seekerProfile/recruiterProfile existence to detect new users
- New Google users (no profile) are redirected to /auth/select-role via URL return from signIn callback
- Returning Google users with existing profiles bypass the redirect and log in normally
- Created minimal role-selection page with SEEKER/RECRUITER buttons, loading states, and error handling
- Created setUserRole server action with session authentication guard, role validation, DB update, and onboarding redirect routing

## Task Commits

Each task was committed atomically:

1. **Task 1: Add signIn callback to Auth.js for Google new-user role-selection redirect** - `5b0f8ea` (feat)
2. **Task 2: Create /auth/select-role page with role selection UI and DB update** - `a32acdf` (feat)

## Files Created/Modified
- `src/auth.ts` - Added signIn callback inside callbacks object; intercepts Google OAuth and redirects new users
- `src/app/auth/select-role/page.tsx` - Client component with SEEKER/RECRUITER role selection, loading/error states
- `src/app/actions/auth/set-role.ts` - Server action: auth guard, role validation, prisma.user.update, onboarding redirect

## Decisions Made
- Google new-user detection uses seekerProfile/recruiterProfile existence rather than role value because role defaults to SEEKER in the DB schema — value alone cannot distinguish "explicitly chosen" from "default". Profile existence is a reliable signal that onboarding was completed.
- Auth.js v5 signIn callback returning a URL string triggers the redirect natively, keeping all logic inside the Auth.js config without needing separate middleware handling for this case.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Google OAuth new-user role selection is fully wired; new users will be routed to /auth/select-role after first Google login
- Plan 07 (middleware route guards) can now enforce that users without a profile cannot access seeker/recruiter routes until role selection is done
- Both /seeker/onboarding and /recruiter/onboarding are the target redirects after role selection — those must be implemented in subsequent plans

---
*Phase: 01-auth-onboarding*
*Completed: 2026-04-02*
