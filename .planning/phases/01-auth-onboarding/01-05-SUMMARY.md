---
phase: 01-auth-onboarding
plan: 05
subsystem: onboarding
tags: [server-action, prisma, recruiter-profile, onboarding]

# Dependency graph
requires:
  - 01-01 (RecruiterProfile.companySize field in schema + Prisma client)
  - 01-04 (src/app/actions/onboarding/ directory created)
provides:
  - saveRecruiterProfile server action at src/app/actions/onboarding/recruiter.ts
  - StepCompanyProfile wired to persist RecruiterProfile on completion
affects:
  - 01-07 (middleware checks RecruiterProfile existence to gate /recruiter/dashboard)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server action upserts RecruiterProfile — re-submitting overwrites safely during onboarding"
    - "Non-blocking DB write in wizard: error logged but wizard advances to avoid UX friction"

key-files:
  created:
    - src/app/actions/onboarding/recruiter.ts
  modified:
    - src/modules/onboarding/components/StepCompanyProfile.tsx
    - prisma/schema.prisma

key-decisions:
  - "Non-blocking server action: if saveRecruiterProfile fails, wizard still advances — error is logged for debugging"
  - "website param maps from store's companyWebsite field; empty string becomes null"

patterns-established:
  - "Wizard server actions use upsert — safe for re-submission and retries"

requirements-completed: [AUTH-07]

# Metrics
duration: 4min
completed: 2026-04-02
---

# Phase 1 Plan 05: Recruiter Onboarding Server Action Summary

**saveRecruiterProfile server action upserts RecruiterProfile with companyName, website, companySize, bio; wired to StepCompanyProfile handleContinue**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-02T11:07:15Z
- **Completed:** 2026-04-02T11:11:02Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `src/app/actions/onboarding/recruiter.ts` with `saveRecruiterProfile` server action
- Server action authenticates via `auth()`, validates companyName, then upserts RecruiterProfile
- Returns `{ success: true }` on success or `{ success: false, error: string }` for auth/validation failures
- Modified `StepCompanyProfile.tsx` to import and call `saveRecruiterProfile` before calling `onNext()`
- `handleContinue` is now async; maps `step2.companyWebsite` to `website` param

## Task Commits

Each task was committed atomically:

1. **Task 1: Create saveRecruiterProfile server action** - `3171229` (feat)
2. **Task 2: Wire StepCompanyProfile to call saveRecruiterProfile** - `255398f` (feat)

**Plan metadata:** (included in final docs commit)

## Files Created/Modified

- `src/app/actions/onboarding/recruiter.ts` - New server action with upsert logic
- `src/modules/onboarding/components/StepCompanyProfile.tsx` - handleContinue wired to server action
- `prisma/schema.prisma` - Added companySize field to RecruiterProfile (deviation fix)

## Decisions Made

- Non-blocking wizard advance: if `saveRecruiterProfile` fails, the error is logged but `onNext()` is still called so the user can complete onboarding. RecruiterProfile can be created on retry.
- `website` parameter receives `step2.companyWebsite || null` — empty string from the URL input becomes null in the DB.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added companySize to RecruiterProfile schema in worktree**
- **Found during:** Task 1 setup
- **Issue:** This worktree branch (`worktree-agent-a2834607`) was created from a commit before Plan 01 changes were merged into main. The RecruiterProfile model in `prisma/schema.prisma` was missing the `companySize String?` field that Plan 01 added, causing a TypeScript type error when the server action tried to use `companySize` in the upsert call.
- **Fix:** Added `companySize String?` to RecruiterProfile in `prisma/schema.prisma` and ran `prisma generate` to regenerate the Prisma client with the new field.
- **Files modified:** prisma/schema.prisma
- **Commit:** `3171229` (included in Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocked by missing schema field from parallel plan)
**Impact on plan:** Schema now matches the expected state from Plan 01. No scope creep.

## Known Stubs

None — `saveRecruiterProfile` is fully wired and writes real data to the DB.

## Self-Check: PASSED

- FOUND: src/app/actions/onboarding/recruiter.ts
- FOUND: export async function saveRecruiterProfile in recruiter.ts
- FOUND: prisma.recruiterProfile.upsert in recruiter.ts
- FOUND: companySize in both create and update blocks of recruiter.ts
- FOUND: import { saveRecruiterProfile } in StepCompanyProfile.tsx
- FOUND: const handleContinue = async in StepCompanyProfile.tsx
- FOUND: await saveRecruiterProfile( in StepCompanyProfile.tsx
- FOUND: onNext() after await saveRecruiterProfile( in StepCompanyProfile.tsx
- FOUND: commit 3171229 (Task 1)
- FOUND: commit 255398f (Task 2)

---
*Phase: 01-auth-onboarding*
*Completed: 2026-04-02*
