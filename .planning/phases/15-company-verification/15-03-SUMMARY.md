---
phase: 15-company-verification
plan: "03"
subsystem: jobs-ui
tags: [company-verification, job-card, job-detail, seeker-feed, badges]
dependency_graph:
  requires: [15-01a, 15-01b]
  provides: [CMPV-05-badge-surface]
  affects: [JobCard, JobDetailHeader, seeker-feed, saved-jobs, job-detail-api]
tech_stack:
  added: []
  patterns: [server-side-flag-propagation, brand-token-badges]
key_files:
  created: []
  modified:
    - src/modules/jobs/types/job.types.ts
    - src/app/api/seeker/feed/route.ts
    - src/app/api/jobs/[id]/route.ts
    - src/app/api/seeker/saved-jobs/route.ts
    - src/components/shared/JobCard.tsx
    - src/modules/jobs/components/JobDetailHeader.tsx
    - src/app/jobs/[id]/page.tsx
decisions:
  - "Admin-posted jobs (isAdminPosted=true) suppress the Unverified badge by setting companyVerified=false rather than showing a misleading Unverified label"
  - "TalentProfileDialog is intentionally out of scope — it shows engineer profiles, not recruiter company info; CMPV-05 is satisfied by job card badges on the seeker job feed"
  - "companyVerified defaults to false (via ?? false) at every mapping point so null recruiterProfile degrades gracefully to Unverified rather than crashing"
metrics:
  duration: "~12 minutes"
  completed: "2026-05-27T12:16:49Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 7
requirements: [CMPV-05]
---

# Phase 15 Plan 03: Company Verification Badge Surface Summary

**One-liner:** companyVerified boolean propagated from RecruiterProfile through 3 job queries onto JobListItem, rendered as green "Verified Company" or gray "Unverified" badge in JobCard and JobDetailHeader.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add companyVerified to JobListItem and 3 job queries | 89ebc39 | job.types.ts, feed/route.ts, jobs/[id]/route.ts, saved-jobs/route.ts |
| 2 | Render verification badge in JobCard and JobDetailHeader | 4d73973 | JobCard.tsx, JobDetailHeader.tsx, jobs/[id]/page.tsx |

## What Was Built

### Task 1 — Data Layer
- `companyVerified?: boolean` added to `JobListItem` interface in `job.types.ts`
- `seeker/feed/route.ts`: added `companyVerified: true` to enrichedJobs recruiterProfile select; added `companyVerified: boolean` to the inline `jobsResponse` type; mapped `job.recruiter.recruiterProfile?.companyVerified ?? false` onto each response item
- `jobs/[id]/route.ts`: added `companyVerified: true` to recruiterProfile select; mapped `companyVerified` onto the job detail response (admin-posted jobs get `false`)
- `seeker/saved-jobs/route.ts`: added `companyVerified: true` to recruiterProfile select; mapped `savedJob.job.recruiter.recruiterProfile?.companyVerified ?? false` onto each saved job item

### Task 2 — Badge Rendering
- `JobCard.tsx`: imported `CheckCircle2`; replaced single postedAt badge with fragment rendering both postedAt (when present) and a verification badge — green `bg-brand-success/10 text-brand-success` for verified, gray `bg-brand-surface text-brand-foreground-secondary` for unverified
- `JobDetailHeader.tsx`: imported `CheckCircle2`; added `companyVerified: boolean` to `JobData` interface; inserted badge in the meta row immediately after the company name Link/span
- `jobs/[id]/page.tsx`: added `companyVerified: true` to recruiterProfile select; mapped `companyVerified` onto `jobData` (admin-posted jobs → `false`, otherwise `recruiterProfile?.companyVerified ?? false`)

## Decisions Made

1. **Admin-posted job badge suppression** — Admin-posted jobs (isAdminPosted=true) set `companyVerified=false` which renders the Unverified badge. This intentionally avoids showing a misleading Unverified badge for Hiretivo's own curated postings. The plan's threat model T-15-13 calls this out as mitigated.

2. **TalentProfileDialog excluded** — CMPV-05 "talent pool recruiter info shows Verified Company badge" is satisfied by job card badges on the seeker-facing job feed. TalentProfileDialog shows engineer/seeker profiles, not recruiter company data, so adding a badge there would be out of place. Not modified.

3. **False default at every mapping** — `?? false` is applied at all three query mapping points so a null `recruiterProfile` (edge case where recruiter has no profile) degrades to Unverified rather than a runtime error.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

No new network endpoints, auth paths, or trust boundaries introduced. `companyVerified` is a read-only boolean derived server-side from `RecruiterProfile`; the client only renders what the server sends. This aligns with T-15-11 (Tampering mitigated) in the plan's threat model.

## Known Stubs

None. `companyVerified` is wired end-to-end from the Prisma `RecruiterProfile.companyVerified` field (set by Plan 01b verify-company routes) through the API queries to the badge render.

## Self-Check: PASSED

All 7 modified files confirmed on disk. Both task commits (89ebc39, 4d73973) confirmed in git history. TypeScript check passes with 0 errors.
