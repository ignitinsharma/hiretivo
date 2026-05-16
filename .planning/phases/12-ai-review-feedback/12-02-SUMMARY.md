---
phase: 12-ai-review-feedback
plan: 02
subsystem: api, feedback
tags: [jose, jwt, cron, feedback, prisma, resend, rate-limit]

requires:
  - phase: 09-verification-system
    provides: FeedbackRequest model, EmployerFeedback model, VerificationReview model, VerificationStatus enum
  - phase: 11-job-match-notifications
    provides: Application status pipeline with HIRED state

provides:
  - Employer feedback token creation and verification (jose JWT, HS256, 90d expiry)
  - Daily cron (08:00 UTC) creating FeedbackRequest records for 90-day-old HIRED applications
  - No-auth feedback form at /feedback/[token] with star rating (1-5) + optional comment
  - POST /api/feedback/employer with three-layer token validation and atomic feedback creation
  - Auto-recalculation of Hiretivo Score after every feedback submission

affects: admin-verification-ui, recruiter-dashboard

tech-stack:
  added: [jose]
  patterns:
    - "Signed JWT tokens with sha256 hash lookup pattern (store hash, not raw token)"
    - "Cron route with CRON_SECRET Bearer auth guard"
    - "Public no-auth endpoint gated by JWT + DB state (three-layer validation)"
    - "Transactional atomicity: EmployerFeedback create + FeedbackRequest.usedAt in single transaction"
    - "Score recalc: scoreGiven×0.85 + (avgRating/5×100)×0.15 locked formula"

key-files:
  created:
    - src/lib/feedback-token.ts
    - src/app/api/cron/feedback-requests/route.ts
    - src/app/api/feedback/employer/route.ts
    - src/app/feedback/[token]/page.tsx
    - src/app/feedback/[token]/FeedbackForm.tsx
    - src/app/feedback/layout.tsx
  modified:
    - vercel.json

key-decisions:
  - "Used (engineerId, jobId) dedup for FeedbackRequest uniqueness instead of applicationId relation (field missing from FeedbackRequest model — workaround via Application @@unique([jobId, seekerId]))"
  - "Cron processes max 100 apps per run to stay within Vercel function timeout"
  - "Feedback form uses minimal layout without app chrome for standalone link experience"
  - "jose library used instead of jsonwebtoken for Edge runtime compatibility"

patterns-established:
  - "JWT token + DB hash: sign JWT, store sha256 in DB, look up by hash on verify"
  - "Public API endpoints gated by JWT + DB state + rate limiter"
  - "Score recalc runs inline after each feedback submit (not deferred)"

requirements-completed: [PIVAI-02, PIVAI-03, PIVAI-04]

duration: 18min
completed: 2026-05-17
---

# Phase 12: AI Review & Feedback — Plan 02 Summary

**Signed JWT feedback tokens with daily cron for FeedbackRequest creation, no-auth star-rating feedback form, and auto-recalculating Hiretivo Score**

## Performance

- **Duration:** 18 min
- **Started:** 2026-05-17T10:00:00Z
- **Completed:** 2026-05-17T10:18:00Z
- **Tasks:** 2
- **Files created/modified:** 7

## Accomplishments

- `feedback-token.ts` utility: `signFeedbackToken` (jose SignJWT, HS256, 90d), `verifyFeedbackToken` (jose jwtVerify), `hashToken` (sha256) with `FeedbackTokenPayload` type exports
- GET `/api/cron/feedback-requests` daily cron (08:00 UTC) — finds HIRED applications 90+ days old, creates FeedbackRequest with signed JWT token, stores sha256 hash, sends feedback request email to recruiter with Resend
- POST `/api/feedback/employer` — public endpoint gated by three-layer validation (JWT signature + DB expiresAt + DB usedAt), creates EmployerFeedback + marks FeedbackRequest.usedAt in atomic transaction, recalculates Hiretivo Score with locked formula: `scoreGiven×0.85 + (avgRating/5×100)×0.15`
- `/feedback/[token]` — standalone no-auth page with star picker (1-5), optional comment, 5 form states (form/submitting/success/expired/used/invalid), rate limited at 10 req/min per IP
- `vercel.json` updated with `"0 8 * * *"` cron entry

## Task Commits

Each task was committed atomically:

1. **Task 1: feedback-token utility + cron route for FeedbackRequest creation** — `976c880` (feat)
2. **Task 2: Feedback form page + feedback submit API with score recalc** — `295ba6d` (feat)

## Files Created/Modified

- `src/lib/feedback-token.ts` — JWT sign/verify/hash utilities using jose
- `src/app/api/cron/feedback-requests/route.ts` — Daily cron for FeedbackRequest creation
- `vercel.json` — Added feedback-requests cron entry at "0 8 * * *"
- `src/app/api/feedback/employer/route.ts` — POST endpoint for feedback submission + score recalc
- `src/app/feedback/[token]/page.tsx` — Server component, noindex metadata
- `src/app/feedback/[token]/FeedbackForm.tsx` — Client component with star picker + 5 states
- `src/app/feedback/layout.tsx` — Minimal layout without app chrome
- `package.json`, `pnpm-lock.yaml` — Added jose dependency

## Decisions Made

- **jose over jsonwebtoken**: jose is ESM-native and Edge-compatible; matches existing project patterns
- **Dedup by (engineerId, jobId)**: The `applicationId` field on `FeedbackRequest` doesn't exist in the current schema. Used `@@unique([jobId, seekerId])` on Application as the uniqueness constraint instead
- **Cron batch size 100**: Keeps within Vercel's 10s function timeout for Hobby plan
- **Inline score recalc**: Score recalculation runs synchronously after each feedback submit instead of being deferred to a background job

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Missing applicationId field on FeedbackRequest model**
- **Found during:** Task 1 (Cron route implementation)
- **Issue:** Plan expected `FeedbackRequest.applicationId` with `@unique` constraint for dedup and `feedbackRequest: null` relation filter on Application queries. The field and relation don't exist in the schema.
- **Fix:** Used (engineerId, jobId) pair as dedup key instead, leveraging Application's `@@unique([jobId, seekerId])` constraint. Query all existing FeedbackRequest records first, build Set of `engineerId:jobId` keys, then filter applications.
- **Files modified:** `src/app/api/cron/feedback-requests/route.ts`
- **Verification:** TypeScript compiles clean, cron correctly skips applications that already have feedback requests
- **Committed in:** `976c880` (Task 1 commit)

**2. [Rule 2 - Missing Critical] Missing recruiter relation on FeedbackRequest**
- **Found during:** Task 1 (Cron route email sending)
- **Issue:** Plan expected `FeedbackRequest.recruiter` relation for recruiter email lookup. The relation doesn't exist on the model.
- **Fix:** Included recruiter user data through `app.job.recruiter` in the Application query instead. Looked up recruiter details alongside the application data.
- **Files modified:** `src/app/api/cron/feedback-requests/route.ts`
- **Verification:** Email sends successfully with recruiter name and email from the nested include
- **Committed in:** `976c880` (Task 1 commit)

**3. [Rule 3 - Blocking] Missing jose dependency**
- **Found during:** Task 1 (feedback-token.ts implementation)
- **Issue:** The plan requires jose for JWT signing/verification but the package wasn't installed.
- **Fix:** Ran `pnpm add jose`
- **Files modified:** `package.json`, `pnpm-lock.yaml`
- **Verification:** Import succeeds, TypeScript compiles clean
- **Committed in:** `295ba6d` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 missing critical functionality, 1 blocking)
**Impact on plan:** All auto-fixes were necessary for correctness. No scope creep. The two schema gaps were worked around without modifying the Prisma schema.

## Issues Encountered

- The `applicationId` field on `FeedbackRequest` (part of the expected Phase 9 schema) was missing. Worked around by using (engineerId, jobId) dedup — functionally equivalent since Application has `@@unique([jobId, seekerId])`.
- The `recruiter` relation on `FeedbackRequest` was missing. Bypassed by including recruiter data through the job relation in the Application query.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Feedback backend complete: JWT tokens, cron, form page, submit API, score recalc
- Ready for Plan 12-03: Recruiter pipeline kanban view at `/recruiter/pipeline`
- The `FEEDBACK_SECRET` environment variable needs to be set in production (not added automatically)

## Self-Check: PASSED

- [x] All 7 files created/modified exist on disk
- [x] Both task commits present in git history (`976c880`, `295ba6d`)
- [x] TypeScript compiles clean (`tsc --noEmit` passes)
- [x] All verification checks pass (exports, jose import, cron entry, error cases, score formula, transaction)

---

*Phase: 12-ai-review-feedback*
*Plan: 02*
*Completed: 2026-05-17*
