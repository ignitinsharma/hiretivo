---
phase: 06-interview-scheduling
plan: "04"
subsystem: ui
tags: [nextjs, zustand, react-hook-form, zod, shadcn, tanstack-query, interview-scheduling]

# Dependency graph
requires:
  - phase: 06-03-interview-scheduling
    provides: POST /api/recruiter/interviews, PATCH reschedule+cancel, ScheduleInterviewSchema

provides:
  - "isScheduleModalOpen, openScheduleModal, closeScheduleModal in Zustand UIStore"
  - "ScheduleInterviewModal — shadcn Dialog with date/time/duration/meetLink/notes form, create+reschedule variants"
  - "CandidateDrawer Interview section — shown only for INTERVIEW-stage applications"
  - "FREE plan gate: disabled Schedule Interview button with Tooltip 'Available on Pro plan'"
  - "Inline cancel confirmation: 'Confirm cancellation?' + 'Never mind' (no Dialog stacking)"

affects:
  - "06-05 — settings page; no direct dependency but same Zustand store"

# Tech tracking
tech-stack:
  added:
    - "shadcn/ui Calendar component (via pnpm dlx shadcn add calendar)"
    - "date-fns format() for date display in Calendar popover"
  patterns:
    - "Schedule modal state in Zustand: openScheduleModal(applicationId, interviewId?) — dual-mode create/reschedule from single action"
    - "Form computes startsAt/endsAt from date+startTime+duration on submit — API receives ISO strings, not raw form fields"
    - "Inline cancel confirmation: local useState(cancelConfirming) — no nested Dialog, avoids Dialog-stacking UX issue"
    - "FREE plan gate: isPlanGated = application.plan === PlanTier.FREE (D-07: no STARTER enum)"

key-files:
  created:
    - src/components/ui/calendar.tsx
    - src/modules/recruiter/applications/components/ScheduleInterviewModal.tsx
  modified:
    - src/store/use-ui-store.ts
    - src/modules/recruiter/applications/components/CandidateDrawer.tsx
    - src/components/ui/button.tsx

key-decisions:
  - "Zod form schema uses separate date/startTime/duration fields — ScheduleInterviewSchema startsAt/endsAt computed on submit"
  - "DURATION_OPTIONS typed const array mapped with .map() — no hardcoded JSX per CLAUDE.md §15.1"
  - "Calendar Popover disabled predicate: date < today (UTC midnight) — prevents scheduling in the past"
  - "ScheduleInterviewModal mounted once inside SheetContent (not in layout) — application-scoped, only when application exists"

patterns-established:
  - "Dual-mode modal pattern: existingInterview prop controls create vs reschedule behavior; single component, single Zustand key"
  - "cancelConfirming local state for destructive inline confirmation — no second Dialog opened"

requirements-completed: [SCHED-04, SCHED-05, SCHED-06, SCHED-07, SCHED-08]

# Metrics
duration: 3min
completed: 2026-04-12
---

# Phase 06 Plan 04: Schedule Modal UI and CandidateDrawer Interview Section Summary

**Zustand-driven ScheduleInterviewModal with Calendar date picker, create/reschedule variants, FREE-plan Tooltip gate, and inline cancel confirmation wired into CandidateDrawer's Interview section**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-12T07:51:23Z
- **Completed:** 2026-04-12T07:54:11Z
- **Tasks:** 3 (Task 1, Task 2a, Task 2b)
- **Files modified:** 5

## Accomplishments

- Extended `useUIStore` with `isScheduleModalOpen`, `scheduleInterviewApplicationId`, `scheduledInterviewId`, `openScheduleModal`, and `closeScheduleModal` — existing state fields untouched
- Created `ScheduleInterviewModal` with shadcn Calendar+Popover date picker, time input, duration Select (DURATION_OPTIONS typed array via `.map()`), Meet link, notes; submits POST or PATCH based on `existingInterview` prop; 403 shows plan upgrade toast
- Extended `CandidateDrawer` with Interview section (visible only when `status === INTERVIEW`): FREE-plan gated button with Tooltip, schedule/reschedule buttons opening Zustand modal, inline cancel confirmation (`cancelConfirming` useState) without Dialog stacking

## Task Commits

Each task was committed atomically:

1. **Task 1: Add schedule modal state to Zustand store** - `fc1cb38` (feat)
2. **Task 2a: Create ScheduleInterviewModal component** - `7ab7d1b` (feat)
3. **Task 2b: Extend CandidateDrawer with Interview section** - `d8ed1bd` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/store/use-ui-store.ts` — Added 5 schedule modal state fields + openScheduleModal/closeScheduleModal actions
- `src/components/ui/calendar.tsx` — Installed via `pnpm dlx shadcn add calendar`
- `src/components/ui/button.tsx` — Updated by shadcn install (no functional changes)
- `src/modules/recruiter/applications/components/ScheduleInterviewModal.tsx` — New shadcn Dialog modal, React Hook Form + Zod, create+reschedule variants
- `src/modules/recruiter/applications/components/CandidateDrawer.tsx` — Added Interview section, cancelInterviewMutation, ScheduleInterviewModal mount

## Decisions Made

- Zod `ModalFormSchema` uses `date`/`startTime`/`duration` fields instead of raw ISO strings — `startsAt`/`endsAt` are computed in `onSubmit`, keeping the form UX clean
- `DURATION_OPTIONS` defined as `const` typed array at module level and rendered with `.map()` — zero repeated JSX per CLAUDE.md §15.1
- Calendar disabled predicate uses UTC midnight comparison to prevent past-date selection
- `ScheduleInterviewModal` mounted inside `SheetContent` (not in the outer layout) — scoped to the active application, naturally unmounts when drawer closes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Zod v4 date() API — `required_error` → `error`**
- **Found during:** Task 2a (ScheduleInterviewModal — TypeScript check)
- **Issue:** Zod v4 changed the error param name from `required_error` to `error` in `z.date()`; tsc reported TS2353
- **Fix:** Changed `z.date({ required_error: '...' })` to `z.date({ error: '...' })`
- **Files modified:** `src/modules/recruiter/applications/components/ScheduleInterviewModal.tsx`
- **Verification:** `pnpm tsc --noEmit` reports no errors for ScheduleInterviewModal.tsx
- **Committed in:** `7ab7d1b` (Task 2a commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — Bug)
**Impact on plan:** Single-line fix for Zod v4 API change. No scope creep.

## Issues Encountered

Pre-existing TypeScript errors in pre-built UI components (custom Button `variant` values like `"brand"`, `"icon-ghost"` etc.) were present before this plan's changes — these are out of scope per deviation rule scope boundary and were not touched.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `ScheduleInterviewModal` and `CandidateDrawer` Interview section are fully wired; recruiters on PRO/ENTERPRISE can schedule, reschedule, and cancel interviews from the drawer
- FREE-plan gate is enforced at both API level (403, plan 06-03) and UI level (disabled button + tooltip)
- All three query keys (`recruiter-applications`, `recruiter-interviews-upcoming`, `recruiter-application-stats`) are invalidated on mutation settle
- Settings page (06-05) is the final remaining plan in phase 06

## Self-Check: PASSED

- `src/store/use-ui-store.ts` — confirmed present, `isScheduleModalOpen` found at lines 23, 62, 66, 71
- `src/components/ui/calendar.tsx` — confirmed present
- `src/modules/recruiter/applications/components/ScheduleInterviewModal.tsx` — confirmed present, exports `ScheduleInterviewModal`
- `src/modules/recruiter/applications/components/CandidateDrawer.tsx` — confirmed `ApplicationStatus.INTERVIEW`, `Confirm cancellation?`, `Available on Pro plan`, `PlanTier.FREE`, `openScheduleModal`, `ScheduleInterviewModal`
- Task commits: `fc1cb38`, `7ab7d1b`, `d8ed1bd` — all confirmed in git log
- `pnpm tsc --noEmit` — no errors in any file created/modified by this plan

---
*Phase: 06-interview-scheduling*
*Completed: 2026-04-12*
