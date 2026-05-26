---
phase: 13
plan: "13-04"
subsystem: recruiter-talent-ui
tags: [seeking-status, talent-pool, filter, ui, types]
dependency_graph:
  requires: ["13-02"]
  provides: ["seekingStatus on talent cards", "SeekingStatusFilter chip row", "filter wired to query"]
  affects: ["src/modules/recruiter/talent"]
tech_stack:
  added: []
  patterns: ["Record<Enum, string> color map", "controlled chip filter row", "radiogroup a11y pattern"]
key_files:
  created:
    - src/modules/recruiter/talent/components/SeekingStatusFilter.tsx
  modified:
    - src/modules/recruiter/talent/types/talent.types.ts
    - src/modules/recruiter/talent/queries/use-talent-pool.ts
    - src/modules/recruiter/talent/components/EngineerCard.tsx
    - src/modules/recruiter/talent/components/TalentPoolClient.tsx
decisions:
  - "NOT_LOOKING excluded from filter chip row (only visible in All view) per CONTEXT.md decision 5"
  - "Dot inserted before name in flex items-center gap-2 container: dot → name → Verified pill"
  - "seekingStatus filter uses functional setState to merge into existing filters object"
metrics:
  duration: "~12 min"
  completed: "2026-05-26"
  tasks: 5
  files: 5
---

# Phase 13 Plan 04: Talent Pool Recruiter UI — Seeking Status Signal Summary

**One-liner:** Seeking-status dot (green/yellow/gray) on every talent card + three-chip filter row (All / Actively Looking / Open to Offers) wired end-to-end through TanStack Query to `/api/recruiter/talent`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend types to carry seekingStatus end-to-end | 7f59b1a | talent.types.ts |
| 2 | Pass seekingStatus filter through useTalentPool query | 0337a07 | use-talent-pool.ts |
| 3 | Render colored seeking-status dot on EngineerCard | 9763045 | EngineerCard.tsx |
| 4 | Build SeekingStatusFilter chip row component | a5153ce | SeekingStatusFilter.tsx |
| 5 | Mount SeekingStatusFilter in TalentPoolClient | 67f11da | TalentPoolClient.tsx |

## File Changes

### src/modules/recruiter/talent/types/talent.types.ts
- Added `import type { SeekingStatus } from "@/constants/enums"` at top
- Added `seekingStatus: SeekingStatus` (non-optional) to `LockedEngineer` interface — non-nullable because DB column has `@default(OPEN_TO_OFFERS)`
- Added `seekingStatus?: SeekingStatus` (optional) to `TalentFilters` interface
- `UnlockedEngineer` inherits `seekingStatus` automatically via `extends LockedEngineer`
- Legacy types (`TalentListItem`, `TalentDetail`) unchanged

### src/modules/recruiter/talent/queries/use-talent-pool.ts
- Added `if (filters.seekingStatus) params.set("seekingStatus", filters.seekingStatus)` after `availableBefore` param
- `queryKey: ["talent-pool", filters]` unchanged — filters object reference change drives cache invalidation
- No mutation hooks modified

### src/modules/recruiter/talent/components/EngineerCard.tsx
- Added `import { SeekingStatus } from "@/constants/enums"`
- Added `SEEKING_STATUS_DOT_CLASS: Record<SeekingStatus, string>` mapping enum to brand token classes
- Added `SEEKING_STATUS_LABEL: Record<SeekingStatus, string>` mapping enum to accessible label strings
- Inserted colored dot `<span>` before `<h3>` name element inside `flex items-center gap-2` container
- Dot has `aria-label` and `title` for accessibility

### src/modules/recruiter/talent/components/SeekingStatusFilter.tsx (new)
- `"use client"` on line 1
- `CHIP_OPTIONS` array with exactly three entries: null (All), ACTIVELY_LOOKING, OPEN_TO_OFFERS
- `SeekingStatusFilterProps` interface: `value: SeekingStatus | undefined`, `onChange: (next: SeekingStatus | undefined) => void`
- `role="radiogroup"` on container, `role="radio"` + `aria-checked` on each chip
- Decorative dot spans have `aria-hidden="true"`
- Mobile-first: `flex-col gap-2` base, `sm:flex-row sm:items-center` enhancement

### src/modules/recruiter/talent/components/TalentPoolClient.tsx
- Added `import { SeekingStatusFilter } from "./SeekingStatusFilter"`
- Mounted `<SeekingStatusFilter value={filters.seekingStatus} onChange={...} />` above `<TalentFilters>`
- `onChange` handler: `setFilters((prev) => ({ ...prev, seekingStatus: next }))` — functional update merges with existing filters
- No new `useState` added; existing `filters` state reused

## Brand Token Confirmation

| Status | Token Used | Value |
|--------|-----------|-------|
| ACTIVELY_LOOKING | `bg-brand-success` | #16a34a (green) |
| OPEN_TO_OFFERS | `bg-yellow-400` | native Tailwind (no brand yellow token exists) |
| NOT_LOOKING | `bg-brand-foreground-secondary` | #9ca3af (gray) |

`bg-yellow-400` is the only native Tailwind class used for colors — justified because no brand yellow token exists per CONTEXT.md decision 3.

## NOT_LOOKING Exclusion Confirmation

- NOT_LOOKING engineers **still appear** in the "All" view (default, no filter)
- NOT_LOOKING is **not** a filter chip option (intentionally excluded per CONTEXT.md decision 5)
- NOT_LOOKING **is** rendered as a gray dot on cards via `SEEKING_STATUS_DOT_CLASS`
- Recruiters cannot specifically filter FOR NOT_LOOKING engineers

## Mobile-First Responsive Classes

`SeekingStatusFilter.tsx`:
- Base: `flex flex-col gap-2` (stacked on mobile)
- `sm:flex-row sm:items-center sm:gap-3` (inline on ≥640px)
- Chip buttons: `flex flex-wrap gap-2` (wraps naturally on small screens)

## TypeScript Compilation

`npx tsc --noEmit` exits 0 — no errors.

## Sample Request URL

A recruiter clicking "Actively Looking" chip triggers:

```
GET /api/recruiter/talent?seekingStatus=ACTIVELY_LOOKING
```

Clicking "Open to Offers":
```
GET /api/recruiter/talent?seekingStatus=OPEN_TO_OFFERS
```

Clicking "All" (default):
```
GET /api/recruiter/talent
```
(no seekingStatus param — backend returns all engineers)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data wired end-to-end. `seekingStatus` flows from DB → API → `LockedEngineer` type → `EngineerCard` dot. Filter chip state flows from `TalentPoolClient` → `useTalentPool` → URLSearchParams → `/api/recruiter/talent`.

## Threat Flags

No new security surface introduced. Filter param emission uses enum values only (not user-typed strings). Backend whitelisting of `seekingStatus` was implemented in Plan 13-02.

## Self-Check: PASSED

- [x] `src/modules/recruiter/talent/components/SeekingStatusFilter.tsx` — exists
- [x] `7f59b1a` — feat(13-04): extend LockedEngineer and TalentFilters types
- [x] `0337a07` — feat(13-04): pass seekingStatus filter param through useTalentPool query
- [x] `9763045` — feat(13-04): render colored seeking-status dot on EngineerCard
- [x] `a5153ce` — feat(13-04): add SeekingStatusFilter chip row component
- [x] `67f11da` — feat(13-04): mount SeekingStatusFilter in TalentPoolClient
