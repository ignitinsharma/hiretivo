---
phase: 08-paid-workflows-account-completion
plan: 03
subsystem: interviews-external-apply
tags:
  - interviews
  - paid-gating
  - external-apply
key-files:
  created:
    - src/lib/email/interview-scheduled.ts
    - src/app/api/jobs/[id]/external-apply/confirm/route.ts
    - src/components/shared/ExternalApplyConfirmationDialog.tsx
  modified:
    - src/app/api/recruiter/interviews/route.ts
    - src/modules/recruiter/applications/components/ScheduleInterviewModal.tsx
    - src/lib/validations/interview.schema.ts
    - src/app/jobs/[id]/redirect/page.tsx
metrics:
  tasks: 3
  commits: 2
---

# Plan 08-03 Summary

## What Changed

- Paid-gated recruiter interview creation with `canAccessRecruiterPaidFeature`.
- Schedule modal opens the shared paid modal on 403.
- Interview scheduled email helper added through Resend.
- Added explicit external apply confirmation endpoint and shared confirmation dialog.
- Redirect page now lets seekers open the external site and confirm "Did you apply on the company site?".

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `fd9f053` | Add paid interview scheduling and saved jobs flow changes |
| 2 | `45ddeaa` | Add external apply confirmation |

## Verification

Passed:

- `pnpm tsc --noEmit -p tsconfig.json`
- `pnpm lint`
- `rg "canAccessRecruiterPaidFeature|interview-scheduled|openPaidFeatureModal|applicationId" src/app/api/recruiter/interviews src/modules/recruiter/applications/components/ScheduleInterviewModal.tsx src/lib/email`
- `rg "external-apply/confirm|Did you apply" src/app/api/jobs src/components/shared/ExternalApplyConfirmationDialog.tsx`

## Deviations

- Some Plan 03 files were committed together with the initial Plan 04 executor commit because the parallel agent shutdown happened before per-plan summaries were written.

## Self-Check: PASSED

Free recruiters are blocked from scheduling interviews, paid interview records persist and send email, and external applicants are counted only after explicit seeker confirmation.
