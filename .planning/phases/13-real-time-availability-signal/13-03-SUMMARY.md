---
phase: 13
plan: "13-03"
subsystem: seeker-settings-ui
tags: [ui, seeker, seeking-status, tanstack-query, mutation]
dependency_graph:
  requires: ["13-02"]
  provides: ["seeking-status-ui-toggle"]
  affects: ["src/app/seeker/settings/page.tsx", "src/modules/seeker/settings/components/SeekingStatusToggle.tsx"]
tech_stack:
  added: []
  patterns: ["useMutation + invalidateQueries", "segmented-control radiogroup", "brand-token dot indicators"]
key_files:
  created:
    - src/modules/seeker/settings/components/SeekingStatusToggle.tsx
  modified:
    - src/app/seeker/settings/page.tsx
    - src/services/seeker.service.ts
decisions:
  - "SeekingStatusToggle placed above HideProfileToggle (lighter-weight, more frequent control first)"
  - "bg-yellow-400 used for OPEN_TO_OFFERS dot — no brand token exists for yellow (authorized by CONTEXT.md decision 3)"
  - "SeekerSettingsData interface extended with seekingStatus field (Rule 2 fix — type was missing after 13-02 API plumbing)"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-26"
  tasks_completed: 2
  files_modified: 3
---

# Phase 13 Plan 03: SeekingStatusToggle UI Component Summary

**One-liner:** 3-button segmented control that reads seekingStatus from cached settings and persists changes via PATCH /api/seeker/settings with toast feedback.

## What Was Built

### New File: SeekingStatusToggle.tsx (98 lines)

`src/modules/seeker/settings/components/SeekingStatusToggle.tsx`

- `"use client"` directive — uses TanStack Query hooks and event handlers
- `STATUS_OPTIONS` constant: three entries pairing `SeekingStatus` enum values with display labels and brand-token dot color classes
- `useUpdateSeekingStatus(currentName)` mutation hook: PATCHes `/api/seeker/settings` with `{ name, seekingStatus }`, invalidates `["seeker-settings"]` on success, shows `toast.success` / `toast.error`
- `SeekingStatusToggle` component: reads current value via `useSeekerSettingsData()`, falls back to `OPEN_TO_OFFERS` if undefined, renders `role="radiogroup"` with mobile-first layout (`flex-col` base, `sm:flex-row` on larger screens)
- Disabled state during `isPending || isLoading`
- Three multi-line `/* */` JSDoc comments per CLAUDE.md §6.7

### Modified: src/app/seeker/settings/page.tsx (+2 lines)

- Added import: `import { SeekingStatusToggle } from "@/modules/seeker/settings/components/SeekingStatusToggle";`
- Mounted `<SeekingStatusToggle />` as the **first child** of the visibility section, placed above `<HideProfileToggle hiddenUntil={...} />`

### Modified: src/services/seeker.service.ts (Rule 2 fix)

- Added `import type { SeekingStatus } from '@/constants/enums'`
- Added `seekingStatus: SeekingStatus | null` to `SeekerSettingsData` interface (13-02 wired the API field but left the TS type stale — fix required to compile the toggle component)

## Brand Token Confirmation

| Status | Dot Color Class | Source |
|--------|----------------|--------|
| ACTIVELY_LOOKING | `bg-brand-success` | Brand token (#16a34a) |
| OPEN_TO_OFFERS | `bg-yellow-400` | Native Tailwind (no yellow brand token — authorized by CONTEXT.md decision 3) |
| NOT_LOOKING | `bg-brand-foreground-secondary` | Brand token (#9ca3af) |

## Page Mount Location

```
<section id="visibility">
  <div> {/* heading: "Who can find me" */} </div>
  <SeekingStatusToggle />          ← NEW — seeking status (lighter control, first)
  <HideProfileToggle ... />        ← existing — full hide (heavier control, second)
  <WhoViewedMeSection />
  <BlockedRecruiterSection />
</section>
```

## TypeScript Compilation

`npx tsc --noEmit` — 0 errors in files owned by this plan. Pre-existing errors in unrelated files (admin, companies, saved-jobs routes) are out of scope and unchanged.

## Behavioral Demo

Click "Actively Looking" → component calls `fetch("/api/seeker/settings", { method: "PATCH", body: { name, seekingStatus: "ACTIVELY_LOOKING" } })` → on success: `toast.success("Seeking status updated")` + `invalidateQueries(["seeker-settings"])` → component re-renders with "Actively Looking" button highlighted in brand-primary/5 background.

## Commits

| Task | Hash | Description |
|------|------|-------------|
| Task 1 | 5fdba74 | feat(13-03): build SeekingStatusToggle component with PATCH mutation |
| Task 2 | 49a7a91 | feat(13-03): mount SeekingStatusToggle in seeker settings visibility section |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Type Field] SeekerSettingsData missing seekingStatus field**
- **Found during:** Task 1 — `npx tsc --noEmit` reported `Property 'seekingStatus' does not exist on type 'SeekerSettingsData'`
- **Issue:** Plan 13-02 wired `seekingStatus` into GET `/api/seeker/settings` response but did not update the `SeekerSettingsData` TypeScript interface in `src/services/seeker.service.ts`. The UI component reads `settings?.seekingStatus` which TypeScript rejected.
- **Fix:** Added `import type { SeekingStatus }` and `seekingStatus: SeekingStatus | null` field to `SeekerSettingsData` interface.
- **Files modified:** `src/services/seeker.service.ts`
- **Commit:** 5fdba74

## Known Stubs

None. The component reads live data from `useSeekerSettingsData()` (which calls GET `/api/seeker/settings`) and persists via PATCH. No mock data or placeholder text used.

## Self-Check: PASSED

- [x] `src/modules/seeker/settings/components/SeekingStatusToggle.tsx` exists (98 lines)
- [x] `src/app/seeker/settings/page.tsx` imports and mounts SeekingStatusToggle
- [x] Commits 5fdba74 and 49a7a91 exist in git log
- [x] No TypeScript errors in plan-owned files
