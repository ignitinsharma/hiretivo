---
phase: 08-paid-workflows-account-completion
plan: 01
subsystem: paid-workflows-foundation
tags:
  - schema
  - paid-gating
  - uploads
  - password-reset
key-files:
  created:
    - src/lib/billing/plan-access.ts
    - src/components/shared/PaidFeatureModal.tsx
    - src/components/shared/InitialsAvatar.tsx
    - src/lib/initials.ts
    - src/lib/validations/upload.schema.ts
    - src/lib/validations/password-reset.schema.ts
    - src/lib/email/password-reset.ts
    - src/app/api/upload/avatar/route.ts
    - src/app/api/upload/resume/route.ts
    - src/app/api/upload/company-logo/route.ts
    - src/app/api/auth/reset-password/request/route.ts
    - src/app/api/auth/reset-password/confirm/route.ts
    - src/app/(auth)/forgot-password/page.tsx
    - src/app/(auth)/reset-password/page.tsx
  modified:
    - prisma/schema.prisma
    - src/constants/enums.ts
    - src/store/use-ui-store.ts
    - src/services/upload.service.ts
    - src/services/auth.service.ts
metrics:
  tasks: 9
  commits: 8
---

# Plan 08-01 Summary

## What Changed

Plan 08-01 built the shared Phase 8 foundation:

- Added `SavedJob` and `TalentShortlist` models plus relations on `User` and `Job`.
- Pushed the additive Prisma schema to Neon and verified the live schema includes both new models.
- Added paid recruiter feature helpers via `canAccessRecruiterPaidFeature`, `PAID_FEATURE_COPY`, and `PAID_FEATURE_FORBIDDEN_MESSAGE`.
- Extended `useUIStore` with `paidFeatureModal`, `openPaidFeatureModal`, and `closePaidFeatureModal`.
- Added `PaidFeatureModal` using shadcn `Dialog`, primary indigo styling, rounded-2xl content, and scale button animation.
- Added `InitialsAvatar` and `getInitials` for image fallback behavior.
- Added authenticated, rate-limited upload APIs for avatar, resume, and company logo using R2.
- Added password reset request/confirm APIs using `VerificationToken` identifiers prefixed by `password-reset:`.
- Added forgot-password and reset-password pages and extended `authService`.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `99f34a5` | Add saved job and shortlist models |
| 2 | orchestrator | Ran `npx prisma db push --accept-data-loss`; verified with `npx prisma db pull --print` |
| 3 | `cba9459` | Add paid recruiter feature access helper |
| 4 | `42d4b03` | Add paid feature modal state |
| 5 | `89557b0` | Add initials avatar fallback |
| 6 | `55f99e1` | Add paid feature modal |
| 7 | `276f45f` | Add upload routes and service |
| 8 | `6bdbfcd` | Add password reset API flow |
| 9 | `4092ecf` | Add password reset pages |

## Downstream Notes

- Plans 02 and 03 should import `canAccessRecruiterPaidFeature` from `src/lib/billing/plan-access.ts` for paid API enforcement.
- Locked UI surfaces should open `openPaidFeatureModal({ feature: "talent_pool" })` or `openPaidFeatureModal({ feature: "interview_scheduling" })`.
- Resume storage persists `SeekerProfile.resumeKey` as the R2 key. Company logo persists `RecruiterProfile.logo` as the R2 key. Avatar upload stores the returned URL in `User.image`.
- Password reset tokens use `VerificationToken` with identifier `password-reset:{email}`, are single-use, and expire after 60 minutes.
- The reset request route always returns `{ data: { ok: true } }` to avoid account enumeration.

## Verification

Passed:

- `pnpm db:generate`
- `npx prisma db push --accept-data-loss`
- `npx prisma db pull --print` contains `model SavedJob` and `model TalentShortlist`
- `pnpm tsc --noEmit -p tsconfig.json`
- `pnpm lint`
- Grep checks for schema models, paid helper, modal store actions, R2 upload routes, and reset-token usage

Environment note: verification commands emitted the existing warning that the project expects Node `22.x` while the current shell uses Node `v20.19.0`.

## Deviations

- Task 2 was completed by the orchestrator after the executor hit a sandbox network checkpoint reaching Neon.
- `PaidFeatureModal` routes upgrade clicks to `/pricing`; billing checkout wiring for recruiter settings remains in Plan 05.

## Self-Check: PASSED

All Plan 08-01 must-haves are present and verified. Later plans can consume the schema, paid gate, upload, avatar, and password reset primitives.
