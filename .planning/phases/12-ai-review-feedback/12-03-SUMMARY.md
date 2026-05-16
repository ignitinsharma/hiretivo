---
phase: 12-ai-review-feedback
plan: 03
subsystem: pipeline, ui, api
tags: [kanban, pipeline, tanstack-query, optimistic-updates, engineer-unlock, blur]

requires:
  - phase: 09-verification-system
    provides: EngineerUnlock model, Application model with status enum
  - phase: 12-01
    provides: AI review / skills feedback infrastructure
  - phase: 12-02
    provides: Hiretivo Score, employer feedback flow

provides:
  - GET /api/recruiter/pipeline — grouped applications by 6 status columns with name blur
  - PATCH /api/recruiter/application/[id]/status — ownership-checked status moves
  - /recruiter/pipeline UI — 6-column kanban with horizontal scroll (mobile) / side-by-side (desktop)
  - Optimistic status moves with rollback on error
  - Loading skeletons, error retry, and empty states

affects: recruiter-dashboard, recruiter-navigation

tech-stack:
  added: []
  patterns:
    - "TanStack Query pipeline with optimistic updates + rollback"
    - "EngineerUnlock blur pattern: batch-fetch unlocks, check Set.has(), blur if absent"
    - "Status move via select dropdown (simpler than drag-and-drop)"

key-files:
  created:
    - src/app/api/recruiter/pipeline/route.ts
    - src/app/api/recruiter/application/[id]/status/route.ts
    - src/app/recruiter/pipeline/page.tsx
    - src/app/recruiter/pipeline/PipelineBoard.tsx
    - src/app/recruiter/pipeline/PipelineCard.tsx
  modified: []

key-decisions:
  - "Status move via select dropdown over drag-and-drop: simpler implementation, mobile-friendly, no drag library dependency"
  - "Optimistic updates with rollback on error: card moves instantly to new column, reverts if PATCH fails"
  - "Blur-sm + Lock icon for blocked engineer names: matches talent pool unlock pattern"
  - "Data cap at 200 applications via Prisma take:200 to prevent unbounded response size for large recruiters"

requirements-completed: [PIVAI-05]

duration: 4min
completed: 2026-05-17
---

# Phase 12: AI Review & Feedback — Plan 03 Summary

**Recruiter pipeline kanban at `/recruiter/pipeline`: 6-column status board with EngineerUnlock name blur, select-based status moves, optimistic UI, and auth-gated APIs with ownership enforcement**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-17
- **Completed:** 2026-05-17
- **Tasks:** 2
- **Files created/modified:** 5

## Accomplishments

- **GET `/api/recruiter/pipeline`** — Returns all applications grouped by status (APPLIED/REVIEWING/INTERVIEW/OFFER/HIRED/REJECTED), blurred engineer names (first+last initial) unless EngineerUnlock record exists, capped at 200 results, rate limited at 30/min
- **PATCH `/api/recruiter/application/[id]/status`** — Updates application status with Zod enum validation, ownership check (403 if recruiter doesn't own the job), rate limited at 10/min
- **`PipelineBoard.tsx`** — 6-column kanban with TanStack Query, skeleton loading, error+retry state, empty state messaging, horizontal scroll on mobile, side-by-side on desktop (`lg:`), card count badges on column headers
- **`PipelineCard.tsx`** — Card displaying engineer name (blur-sm + Lock icon when `isBlurred`), job title, color-coded match score badge (≥70 green, 40-69 amber, <40 red), formatted applied date, "Move to..." select dropdown for status changes
- **`page.tsx`** — Server component at `/recruiter/pipeline` with "Candidate Pipeline" heading, subtitle, back-to-dashboard link, renders PipelineBoard as client island
- Optimistic updates: card instantly moves to new column on select change, rolls back on PATCH error, invalidates query on settle

## Task Commits

Each task was committed atomically:

1. **Task 1: GET pipeline + PATCH status API routes** — `c04dfde` (feat)
2. **Task 2: PipelineBoard + PipelineCard UI** — `361d05b` (feat)

## Files Created

- `src/app/api/recruiter/pipeline/route.ts` — GET endpoint, grouped by status, EngineerUnlock blur
- `src/app/api/recruiter/application/[id]/status/route.ts` — PATCH endpoint with ownership validation
- `src/app/recruiter/pipeline/page.tsx` — Server component, page layout
- `src/app/recruiter/pipeline/PipelineBoard.tsx` — 6-column kanban with TanStack Query, optimistic updates
- `src/app/recruiter/pipeline/PipelineCard.tsx` — Application card with name blur, score badge, status select

## Decisions Made

- **Select over drag-and-drop**: A `<select>` dropdown labeled "Move to..." is simpler, mobile-friendly, and avoids the complexity of drag-and-drop libraries. All 5 other statuses are shown as options.
- **Optimistic updates**: `onMutate` removes card from old column and inserts into new column instantly. `onError` restores previous query data. `onSettled` refetches for consistency.
- **User ID rate limiting**: Both routes rate-limit by `session.user.id` instead of IP, following existing codebase patterns (dashboard route, stage route) for authenticated endpoints.

## Threat Model Coverage

All mitigated dispositions from the plan's threat register are implemented:

| Threat | Mitigation | Status |
|--------|-----------|--------|
| T-12-03-01 — Elevation of Privilege (PATCH another recruiter's app) | Ownership check: `job.recruiterId !== session.user.id` → 403 | ✅ |
| T-12-03-02 — Information Disclosure (unblurred names) | EngineerUnlock batch fetch + Set lookup; blur if not found | ✅ |
| T-12-03-03 — Spoofing (unauthenticated access) | Auth.js session; 401 if no session, 403 if wrong role | ✅ |
| T-12-03-04 — DoS (unbounded result set) | `take: 200` cap + `dataFetchRateLimiter` at 30/min | ✅ |
| T-12-03-05 — Tampering (arbitrary status values) | Zod enum with `APPLICATION_STATUS_VALUES`; validation before update | ✅ |

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Pipeline kanban complete with all 6 columns, blur logic, optimistic moves
- Ready for any remaining Phase 12 plans or Phase 12 completion

## Self-Check: PASSED

- [x] All 5 files created exist on disk
- [x] Both task commits present in git history (`c04dfde`, `361d05b`)
- [x] TypeScript compiles clean (`tsc --noEmit` passes)
- [x] All verification checks pass (blur logic, ownership check, horizontal scroll, name blur UI, optimistic update)
- [x] All threat mitigations implemented per threat register

---

*Phase: 12-ai-review-feedback*
*Plan: 03*
*Completed: 2026-05-17*
