---
phase: 08-paid-workflows-account-completion
plan: 04
subsystem: seeker-saved-jobs-settings
tags:
  - saved-jobs
  - seeker-settings
  - profile-completion
key-files:
  created:
    - src/app/api/seeker/saved-jobs/route.ts
    - src/app/api/seeker/saved-jobs/[jobId]/route.ts
    - src/app/seeker/saved-jobs/page.tsx
    - src/modules/seeker/saved-jobs/components/SavedJobsList.tsx
    - src/modules/seeker/saved-jobs/queries/use-saved-jobs.ts
    - src/modules/seeker/settings/components/AvatarSection.tsx
    - src/modules/seeker/settings/components/ResumeSection.tsx
    - src/modules/seeker/settings/components/SkillsSection.tsx
  modified:
    - src/components/shared/JobCard.tsx
    - src/app/api/seeker/settings/route.ts
    - src/app/seeker/settings/page.tsx
    - src/lib/validations/seeker.schema.ts
    - src/modules/seeker/settings/components/PersonalInfoSection.tsx
    - src/services/seeker.service.ts
  deleted:
    - src/app/api/auth/delete-account/route.ts
    - src/modules/seeker/settings/components/BillingSection.tsx
    - src/modules/seeker/settings/components/DangerZoneSection.tsx
metrics:
  tasks: 3
  commits: 3
---

# Plan 08-04 Summary

## What Changed

- Added seeker saved jobs APIs, saved jobs page, query hooks, and list UI.
- Extended `JobCard` with bookmark save/unsave controls.
- Removed seeker billing/upgrade and delete-account UI/API surfaces.
- Added seeker settings panels for avatar, skills, resume, personal info, and password.
- Seeker settings can update skills and invalidates matching/feed cache through `invalidateSeekerCache`.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `fd9f053` | Add seeker saved jobs flow |
| 2 | `3bc9f7c` | Remove seeker billing and danger settings |
| 3 | `fdbf0a5` | Complete seeker profile settings |

## Verification

Passed:

- `pnpm tsc --noEmit -p tsconfig.json`
- `pnpm lint`
- `rg "SavedJob|saved-jobs|Bookmark|onToggleSave|SkillsSection|ResumeSection|AvatarSection|invalidateSeekerCache" src prisma/schema.prisma`
- `rg "BillingSection|DangerZoneSection|delete-account|Upgrade to Pro" src/app/seeker/settings/page.tsx src/modules/seeker/settings src/app/api/auth` returns no matches

## Deviations

- The old unused seeker billing and danger component files were deleted, not just unrendered, to satisfy the requirement that seeker upgrade/delete-account surfaces be removed for now.

## Self-Check: PASSED

Seekers can save, view, remove, and apply to saved jobs, and settings now covers profile, skills, resume, avatar, and password without seeker paid/delete flows.
